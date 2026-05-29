#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Enrich MDPI article timeline metadata for articles_master.xlsx.

功能：
1. 读取 articles_master.xlsx
2. 只处理 DOI 以 10.3390/ 开头的 MDPI 文章
3. 如果 received_date 已经有值，则跳过，不再请求 MDPI 页面
4. 通过 DOI 解析或 DOI+ISSN 构造 MDPI URL
5. 打开 MDPI 页面
6. 提取：
   - mdpi_url
   - mdpi_citation_line
   - mdpi_journal_abbrev
   - mdpi_volume
   - mdpi_issue
   - mdpi_article_number
   - received_date
   - revised_dates
   - revised_first_date
   - revised_last_date
   - accepted_date
   - online_date
   - mdpi_published_date
   - days_received_to_accepted
   - days_revised_last_to_accepted
7. 定期保存 checkpoint，便于中断后恢复

注意：
- 不使用 Google 自动化搜索。
- 默认：已有 received_date 的行直接跳过。
- 默认：已有非空字段不覆盖，只补空值。
"""

import argparse
import random
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional, Tuple

import pandas as pd
import requests
from bs4 import BeautifulSoup
from dateutil import parser as date_parser
from tqdm import tqdm

try:
    from selenium import webdriver
    from selenium.common.exceptions import TimeoutException, WebDriverException
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait
except Exception:  # pragma: no cover
    webdriver = None
    TimeoutException = Exception
    WebDriverException = Exception
    ChromeOptions = None
    WebDriverWait = None
    EC = None
    By = None


DEFAULT_TIMEOUT = 40


ENRICH_COLS = [
    "mdpi_url",
    "mdpi_citation_line",
    "mdpi_journal_abbrev",
    "mdpi_volume",
    "mdpi_issue",
    "mdpi_article_number",
    "mdpi_published_date",
    "mdpi_parse_status",
    "mdpi_parse_error",
    "mdpi_fetched_at",
]

DATE_COLS = [
    "received_date",
    "revised_dates",
    "revised_first_date",
    "revised_last_date",
    "accepted_date",
    "online_date",
    "days_received_to_accepted",
    "days_revised_last_to_accepted",
]


def now_utc_iso() -> str:
    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def is_blank(x) -> bool:
    if pd.isna(x):
        return True
    s = str(x).strip()
    return s == "" or s.lower() in {"nan", "none", "null", "[]", "metadata_only"}


def has_value(x) -> bool:
    return not is_blank(x)


def clean_text(s: str) -> str:
    if s is None:
        return ""
    s = str(s).replace("\xa0", " ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n+", "\n", s)
    return s.strip()


def normalize_doi(doi: str) -> str:
    if is_blank(doi):
        return ""
    doi = str(doi).strip()
    doi = doi.replace("https://doi.org/", "")
    doi = doi.replace("http://doi.org/", "")
    doi = doi.replace("doi:", "")
    return doi.strip()


def parse_date_to_iso(date_str: str) -> str:
    """
    Convert:
      18 May 2025 -> 2025-05-18
    """
    if is_blank(date_str):
        return ""
    try:
        dt = date_parser.parse(str(date_str), dayfirst=False, fuzzy=True)
        return dt.date().isoformat()
    except Exception:
        return clean_text(date_str)


def safe_days(start: str, end: str):
    try:
        if is_blank(start) or is_blank(end):
            return ""
        d0 = date_parser.parse(str(start)).date()
        d1 = date_parser.parse(str(end)).date()
        return (d1 - d0).days
    except Exception:
        return ""


def make_session(email: Optional[str] = None) -> requests.Session:
    session = requests.Session()

    user_agent = "MDPIArticleTimelineEnricher/1.0"
    if email:
        user_agent += f" (mailto:{email})"

    session.headers.update(
        {
            "User-Agent": user_agent,
            "Accept": (
                "text/html,application/xhtml+xml,application/xml;"
                "q=0.9,*/*;q=0.8"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
        }
    )
    return session


def mdpi_url_from_doi_and_issn(doi: str, issn: str) -> str:
    """
    Fallback URL constructor for MDPI DOI pattern.

    Example:
      DOI:  10.3390/accountaudit1020007
      ISSN: 3042-6618

      numeric tail = 1020007
      volume = 1
      issue = 02
      article = 0007

      URL:
      https://www.mdpi.com/3042-6618/1/2/7

    Another example:
      10.3390/admsci15020032
      volume = 15
      issue = 02
      article = 0032
    """
    doi = normalize_doi(doi)

    if not doi.lower().startswith("10.3390/"):
        return ""

    if is_blank(issn):
        return ""

    suffix = doi.split("/", 1)[1]
    m = re.search(r"(\d+)$", suffix)

    if not m:
        return ""

    numeric = m.group(1)

    # MDPI common pattern:
    # volume digits + issue 2 digits + article number 4 digits
    if len(numeric) < 7:
        return ""

    vol = numeric[:-6]
    issue = numeric[-6:-4]
    article = numeric[-4:]

    try:
        vol_i = int(vol)
        issue_i = int(issue)
        article_i = int(article)
    except Exception:
        return ""

    return f"https://www.mdpi.com/{str(issn).strip()}/{vol_i}/{issue_i}/{article_i}"


def resolve_doi_to_mdpi_url(session: requests.Session, doi: str) -> str:
    """
    Resolve DOI through doi.org.
    If final URL is MDPI, return it.
    """
    doi = normalize_doi(doi)

    if not doi:
        return ""

    doi_url = f"https://doi.org/{doi}"

    try:
        r = session.get(
            doi_url,
            allow_redirects=True,
            timeout=DEFAULT_TIMEOUT,
        )
        if r.status_code < 400 and "mdpi.com" in r.url.lower():
            return r.url.split("?")[0]
    except Exception:
        return ""

    return ""


def fetch_html(session: requests.Session, url: str) -> Tuple[str, str]:
    r = session.get(url, timeout=DEFAULT_TIMEOUT)
    r.raise_for_status()
    final_url = r.url.split("?")[0]
    return r.text, final_url


def is_blocked_html(html: str, title: str = "", final_url: str = "") -> bool:
    soup = BeautifulSoup(html or "", "html.parser")
    text = clean_text(soup.get_text(" "))
    blob = f"{title} {final_url} {text[:3000]}".lower()

    blocked_markers = [
        "access denied",
        "errors.edgesuite.net",
        "request blocked",
        "forbidden",
        "verify you are human",
        "too many requests",
        "akamai",
    ]

    return any(x in blob for x in blocked_markers)


def extract_mdpi_subject(text: str, target_doi: str = "") -> str:
    """
    Extract MDPI breadcrumb-style subject string.

    Example page text:
      Journals
      Accounting and Auditing
      Volume 1
      Issue 2
      10.3390/accountaudit1020007

    Output:
      Accounting and Auditing Volume 1 Issue 2 10.3390/accountaudit1020007
    """
    normalized_target_doi = normalize_doi(target_doi)

    lines = [clean_text(x) for x in str(text).splitlines()]
    lines = [x for x in lines if x]

    # Preferred extraction from breadcrumb lines.
    for i, line in enumerate(lines):
        if line.lower() != "journals":
            continue

        window = lines[i + 1 : i + 12]
        journal_title = ""
        volume = ""
        issue = ""
        doi = ""

        for item in window:
            if not journal_title and not re.match(r"^(Volume|Issue)\b", item, flags=re.I) and not item.lower().startswith("10.3390/"):
                journal_title = item
                continue

            if not volume and re.match(r"^Volume\s+\S+", item, flags=re.I):
                volume = item
                continue

            if not issue and re.match(r"^Issue\s+\S+", item, flags=re.I):
                issue = item
                continue

            if item.lower().startswith("10.3390/"):
                candidate_doi = normalize_doi(item)
                if not normalized_target_doi or candidate_doi.lower() == normalized_target_doi.lower():
                    doi = candidate_doi
                    break

        if journal_title and volume and issue and doi:
            return clean_text(f"{journal_title} {volume} {issue} {doi}")

    # Fallback extraction from flattened text.
    doi_pat = re.escape(normalized_target_doi) if normalized_target_doi else r"10\.3390/[A-Za-z0-9._;()/:\-]+"
    flat = re.sub(r"\s+", " ", clean_text(text))
    m = re.search(
        rf"\bJournals\s+"
        rf"(?P<journal>.+?)\s+"
        rf"(?P<volume>Volume\s+\S+)\s+"
        rf"(?P<issue>Issue\s+\S+)\s+"
        rf"(?P<doi>{doi_pat})\b",
        flat,
        flags=re.I,
    )

    if m:
        return clean_text(
            f"{m.group('journal')} {m.group('volume')} {m.group('issue')} {normalize_doi(m.group('doi'))}"
        )

    return ""
    

class BrowserMDPIFetcher:
    def __init__(
        self,
        headless: bool = True,
        timeout_ms: int = 45000,
        retries: int = 2,
        wait_ms: int = 1200,
    ):
        self.headless = headless
        self.timeout_ms = timeout_ms
        self.retries = retries
        self.wait_ms = wait_ms

        self._driver = None

    def open(self):
        if webdriver is None or ChromeOptions is None:
            raise RuntimeError(
                "Selenium is not available. Install it first: pip install selenium"
            )

        options = ChromeOptions()
        if self.headless:
            options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1440,900")
        options.add_argument("--lang=en-US")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        self._driver = webdriver.Chrome(options=options)
        self._driver.set_page_load_timeout(max(15, int(self.timeout_ms / 1000)))

    def close(self):
        try:
            if self._driver:
                self._driver.quit()
        except Exception:
            pass
        self._driver = None

    def fetch(self, url: str) -> Tuple[str, str, int, str]:
        if not self._driver:
            raise RuntimeError("Browser fetcher is not initialized. Call open() first.")

        last_error = ""

        for attempt in range(1, self.retries + 2):
            try:
                self._driver.get(url)
                if WebDriverWait and EC and By:
                    WebDriverWait(self._driver, max(8, int(self.timeout_ms / 1000))).until(
                        EC.presence_of_element_located((By.TAG_NAME, "body"))
                    )

                time.sleep(self.wait_ms / 1000.0)

                final_url = (self._driver.current_url or "").split("?")[0]
                html = self._driver.page_source or ""
                title = self._driver.title or ""
                status_code = 0

                blocked = is_blocked_html(html, title=title, final_url=final_url)

                if blocked:
                    last_error = (
                        f"blocked_or_rate_limited status={status_code} title={title}"
                    )
                    if attempt <= self.retries:
                        time.sleep(1.2 * attempt)
                        continue

                return html, final_url, status_code, title

            except TimeoutException:
                last_error = "selenium_timeout"
                if attempt <= self.retries:
                    time.sleep(1.2 * attempt)
                    continue
            except WebDriverException as e:
                last_error = f"selenium_error: {str(e)[:300]}"
                if attempt <= self.retries:
                    time.sleep(1.2 * attempt)
                    continue
            except Exception as e:
                last_error = f"browser_error: {str(e)[:300]}"
                if attempt <= self.retries:
                    time.sleep(1.2 * attempt)
                    continue

        raise RuntimeError(last_error or "browser_fetch_failed")


def extract_from_mdpi_html(html: str, target_doi: str = "") -> Dict[str, str]:
    """
    Extract citation line and article timeline from MDPI HTML.

    Example target text:
      Account. Audit. 2025, 1(2), 7;
      https://doi.org/10.3390/accountaudit1020007

      Submission received: 18 May 2025 /
      Revised: 25 August 2025 /
      Accepted: 28 August 2025 /
      Published: 31 August 2025
    """
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    text = clean_text(soup.get_text("\n"))

    out = {
        "mdpi_citation_line": "",
        "mdpi_journal_abbrev": "",
        "mdpi_volume": "",
        "mdpi_issue": "",
        "mdpi_article_number": "",
        "doi": "",
        "received_date": "",
        "revised_dates": "",
        "revised_first_date": "",
        "revised_last_date": "",
        "accepted_date": "",
        "online_date": "",
        "mdpi_published_date": "",
    }

    normalized_target_doi = normalize_doi(target_doi)
    doi_pat = re.escape(normalized_target_doi) if normalized_target_doi else r"10\.[^\s;]+"

    # Citation line:
    # Account. Audit. 2025, 1 (2), 7; https://doi.org/10.3390/accountaudit1020007
    citation_re = re.compile(
        rf"(?P<citation>"
        rf"(?P<journal>[A-Z][A-Za-z0-9&.\- ]+?)\s+"
        rf"(?P<year>20\d{{2}}),\s*"
        rf"(?P<volume>\d+)\s*"
        rf"\(\s*(?P<issue>[^)]+)\s*\)\s*,\s*"
        rf"(?P<article>[^;\n]+?)\s*;\s*"
        rf"https?://doi\.org/(?P<doi>{doi_pat})"
        rf")",
        re.IGNORECASE,
    )

    m = citation_re.search(text)

    if m:
        out["mdpi_citation_line"] = clean_text(m.group("citation"))
        out["mdpi_journal_abbrev"] = clean_text(m.group("journal"))
        out["mdpi_volume"] = clean_text(m.group("volume"))
        out["mdpi_issue"] = clean_text(m.group("issue"))
        out["mdpi_article_number"] = clean_text(m.group("article"))
        out["doi"] = normalize_doi(m.group("doi"))

    # Timeline fields
    date_patterns = {
        "received_date": r"(?:Submission received|Received):\s*([^/\n]+)",
        "revised": r"Revised:\s*([^/\n]+)",
        "accepted_date": r"Accepted:\s*([^/\n]+)",
        "published": r"Published:\s*([^/\n]+)",
    }

    revised_list = []

    for key, pattern in date_patterns.items():
        matches = re.findall(pattern, text, flags=re.IGNORECASE)

        if not matches:
            continue

        vals = [parse_date_to_iso(x) for x in matches if not is_blank(x)]
        vals = [v for v in vals if v]

        if not vals:
            continue

        if key == "revised":
            revised_list.extend(vals)

        elif key == "published":
            out["online_date"] = vals[-1]
            out["mdpi_published_date"] = vals[-1]

        else:
            out[key] = vals[-1]

    if revised_list:
        unique_revised = []

        for d in revised_list:
            if d not in unique_revised:
                unique_revised.append(d)

        out["revised_dates"] = str(unique_revised)
        out["revised_first_date"] = unique_revised[0]
        out["revised_last_date"] = unique_revised[-1]
        out["subject"] = extract_mdpi_subject(text, target_doi=target_doi)
    return out


def should_process_row(
    row: pd.Series,
    overwrite: bool = False,
    skip_if_received: bool = True,
) -> bool:
    """
    Processing rules:
    1. Only MDPI DOI, DOI starts with 10.3390/
    2. If skip_if_received=True and received_date already has value, skip
    3. If overwrite=False, only process rows missing target fields
    """
    doi = normalize_doi(row.get("doi", ""))

    if not doi.lower().startswith("10.3390/"):
        return False

    if skip_if_received and has_value(row.get("received_date", "")):
        return False

    if overwrite:
        return True

    target_cols = [
        "received_date",
        "accepted_date",
        "online_date",
        "mdpi_citation_line",
    ]

    for col in target_cols:
        if col not in row or is_blank(row.get(col, "")):
            return True

    return False


def save_df(df: pd.DataFrame, path: Path, sheet_name: str):
    if path.suffix.lower() in {".xlsx", ".xlsm", ".xls"}:
        with pd.ExcelWriter(path, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    else:
        df.to_csv(path, index=False, encoding="utf-8-sig")


def main():
    parser = argparse.ArgumentParser(
        description="Fill MDPI URL, citation line, and article submission timeline fields."
    )

    parser.add_argument("--input", required=True, help="Input .xlsx/.csv file")
    parser.add_argument("--output", required=True, help="Output .xlsx/.csv file")
    parser.add_argument("--sheet", default="data", help="Excel sheet name, default: data")

    parser.add_argument(
        "--email",
        default=None,
        help="Optional contact email in User-Agent",
    )

    parser.add_argument(
        "--min-delay",
        type=float,
        default=2.0,
        help="Minimum delay between article requests",
    )

    parser.add_argument(
        "--max-delay",
        type=float,
        default=6.0,
        help="Maximum delay between article requests",
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Process only first N eligible rows; 0 means all",
    )

    parser.add_argument(
        "--start",
        type=int,
        default=0,
        help="Start row index for resume",
    )

    parser.add_argument(
        "--checkpoint-every",
        type=int,
        default=50,
        help="Save checkpoint every N processed rows",
    )

    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing non-empty target fields",
    )

    parser.add_argument(
        "--no-skip-if-received",
        action="store_true",
        help="Disable default behavior of skipping rows with existing received_date",
    )

    parser.add_argument(
        "--browser-headless",
        action="store_true",
        help="Use headless browser mode (default: False, i.e. visible browser)",
    )

    parser.add_argument(
        "--browser-timeout-ms",
        type=int,
        default=45000,
        help="Browser navigation timeout in milliseconds",
    )

    parser.add_argument(
        "--browser-retries",
        type=int,
        default=2,
        help="Browser retries for blocked/timeout pages",
    )

    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if input_path.suffix.lower() in {".xlsx", ".xlsm", ".xls"}:
        df = pd.read_excel(
            input_path,
            sheet_name=args.sheet,
            dtype=str,
            engine="openpyxl",
        )
    else:
        df = pd.read_csv(input_path, dtype=str)

    # Ensure needed columns exist
    for col in ENRICH_COLS + DATE_COLS:
        if col not in df.columns:
            df[col] = ""

    if "doi" not in df.columns:
        raise ValueError("Input file must contain column: doi")

    if "issn" not in df.columns:
        df["issn"] = ""

    session = make_session(args.email)

    skip_if_received = not args.no_skip_if_received

    eligible_indices = []

    for idx, row in df.iterrows():
        if idx < args.start:
            continue

        if should_process_row(
            row,
            overwrite=args.overwrite,
            skip_if_received=skip_if_received,
        ):
            eligible_indices.append(idx)

    if args.limit and args.limit > 0:
        eligible_indices = eligible_indices[: args.limit]

    print(f"Rows loaded: {len(df)}")
    print(f"Eligible rows to process: {len(eligible_indices)}")
    print(f"Skip rows with existing received_date: {skip_if_received}")

    processed = 0
    fetcher = BrowserMDPIFetcher(
        headless=args.browser_headless,
        timeout_ms=args.browser_timeout_ms,
        retries=max(0, args.browser_retries),
    )

    fetcher.open()
    try:
        for idx in tqdm(eligible_indices, desc="Processing MDPI articles"):
            row = df.loc[idx]

            doi = normalize_doi(row.get("doi", ""))
            issn = row.get("issn", "")

            mdpi_url = ""
            status = ""
            error = ""

            try:
                # 1. Use existing MDPI URL if available
                for url_col in ["mdpi_url", "source_url"]:
                    if url_col in df.columns:
                        candidate = str(row.get(url_col, "")).strip()

                        if candidate.startswith("https://www.mdpi.com/") or candidate.startswith(
                            "http://www.mdpi.com/"
                        ):
                            mdpi_url = candidate.split("?")[0]
                            break

                # 2. Resolve DOI through doi.org
                if not mdpi_url:
                    mdpi_url = resolve_doi_to_mdpi_url(session, doi)

                # 3. Fallback: construct MDPI URL from DOI suffix + ISSN
                if not mdpi_url:
                    mdpi_url = mdpi_url_from_doi_and_issn(doi, issn)

                if not mdpi_url:
                    raise RuntimeError("Could not resolve or construct MDPI URL")

                html, final_url, http_status, page_title = fetcher.fetch(mdpi_url)
                mdpi_url = final_url or mdpi_url
                df.at[idx, "mdpi_url"] = mdpi_url
                df.at[idx, "mdpi_fetched_at"] = now_utc_iso()

                if is_blocked_html(html, title=page_title, final_url=mdpi_url):
                    status = "blocked"
                    error = f"http_status={http_status}; title={page_title}"[:500]
                else:
                    parsed = extract_from_mdpi_html(html, target_doi=doi)

                    # Fill parsed fields
                    for key, value in parsed.items():
                        if key not in df.columns:
                            df[key] = ""

                        if value and (args.overwrite or is_blank(df.at[idx, key])):
                            df.at[idx, key] = value

                    # Compute duration fields
                    received_date = df.at[idx, "received_date"]
                    accepted_date = df.at[idx, "accepted_date"]
                    revised_last_date = df.at[idx, "revised_last_date"]

                    if is_blank(df.at[idx, "days_received_to_accepted"]):
                        df.at[idx, "days_received_to_accepted"] = safe_days(
                            received_date,
                            accepted_date,
                        )

                    if is_blank(df.at[idx, "days_revised_last_to_accepted"]):
                        df.at[idx, "days_revised_last_to_accepted"] = safe_days(
                            revised_last_date,
                            accepted_date,
                        )

                    # Update standard tracking fields if present
                    if "source_url" in df.columns and is_blank(df.at[idx, "source_url"]):
                        df.at[idx, "source_url"] = mdpi_url

                    if "extraction_status" in df.columns:
                        df.at[idx, "extraction_status"] = "ok"

                    if "parse_method" in df.columns:
                        df.at[idx, "parse_method"] = "mdpi_html_selenium"

                    if "updated_at" in df.columns:
                        df.at[idx, "updated_at"] = now_utc_iso()

                    found_dates = any(
                        has_value(df.at[idx, c])
                        for c in ["received_date", "accepted_date", "online_date"]
                    )

                    found_citation = has_value(df.at[idx, "mdpi_citation_line"])

                    if found_dates or found_citation:
                        status = "ok"
                    else:
                        status = "partial_no_target_fields"

            except Exception as e:
                status = "error"
                error = str(e)[:500]

            df.at[idx, "mdpi_parse_status"] = status
            df.at[idx, "mdpi_parse_error"] = error

            processed += 1

            if processed % args.checkpoint_every == 0:
                checkpoint_path = output_path.with_name(
                    output_path.stem + ".checkpoint" + output_path.suffix
                )
                save_df(df, checkpoint_path, args.sheet)
                print(f"Checkpoint saved: {checkpoint_path}")

            time.sleep(random.uniform(args.min_delay, args.max_delay))
    finally:
        fetcher.close()

    save_df(df, output_path, args.sheet)

    print(f"Done. Saved to: {output_path}")


if __name__ == "__main__":
    main()