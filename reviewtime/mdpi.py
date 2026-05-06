from __future__ import annotations

import re
import urllib.request
from datetime import date
from typing import Dict, List, Optional, Tuple


MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}


def _to_iso(d: str, m: str, y: str) -> Optional[str]:
    try:
        mm = MONTHS.get(m.lower(), None)
        if mm is None:
            mm = int(m)
        return date(int(y), int(mm), int(d)).isoformat()
    except Exception:
        return None


def _extract_all_dates_for_label(text: str, label: str) -> List[str]:
    # Example: "Submission received: 20 March 2026 / Revised: 18 April 2026"
    # allow both "label:" and "label"
    pat = rf"(?:{label})\s*:?[\s\u00a0]*(\d{{1,2}})\s+([A-Za-z]+)\s+(\d{{4}})"
    out: List[str] = []
    for m in re.finditer(pat, text, flags=re.IGNORECASE):
        iso = _to_iso(m.group(1), m.group(2), m.group(3))
        if iso:
            out.append(iso)
    return sorted(set(out))


_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "identity",
    "Referer": "https://www.mdpi.com/",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


def fetch_mdpi_article_page_by_doi(doi: str) -> Tuple[str, str]:
    doi = (doi or "").strip()
    if not doi:
        raise ValueError("doi is required")

    # Try direct MDPI URL first (avoids doi.org redirect that can expose bot UA)
    doi_clean = doi.replace("10.3390/", "")
    parts = doi_clean.split("/")
    # slug is like "cancers18081313" or "accountaudit1020006"
    slug = parts[0] if parts else doi_clean

    # Reconstruct MDPI path: slug is <journal_abbr><vol><issue><article_num>
    # The canonical URL pattern: https://www.mdpi.com/<issn_not_needed>/vol/issue/no
    # Use doi.org as canonical resolver, but with browser headers
    url = f"https://doi.org/{doi}"
    req = urllib.request.Request(url, headers=_BROWSER_HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        final_url = resp.geturl()
        html = resp.read().decode("utf-8", errors="ignore")
    return html, final_url


def extract_mdpi_history_dates(html_text: str) -> Dict:
    text = re.sub(r"<[^>]+>", " ", html_text)
    text = re.sub(r"\s+", " ", text)

    received_candidates = _extract_all_dates_for_label(text, r"Submission\s+received|Received")
    revised_candidates = _extract_all_dates_for_label(text, r"Revised")
    accepted_candidates = _extract_all_dates_for_label(text, r"Accepted")
    published_candidates = _extract_all_dates_for_label(text, r"Published")

    received = received_candidates[0] if received_candidates else None
    accepted = accepted_candidates[-1] if accepted_candidates else None
    revised_first = revised_candidates[0] if revised_candidates else None
    revised_last = revised_candidates[-1] if revised_candidates else None
    online = published_candidates[0] if published_candidates else None

    event_count = sum(1 for x in [received, revised_last, accepted, online] if x)
    confidence = min(1.0, 0.25 * event_count)
    if received and accepted:
        confidence = max(confidence, 0.8)

    return {
        "received_date": received,
        "revised_dates": revised_candidates,
        "revised_first_date": revised_first,
        "revised_last_date": revised_last,
        "accepted_date": accepted,
        "online_date": online,
        "collection_date": None,
        "parse_method": "mdpi_html_history",
        "confidence_score": round(confidence, 3),
    }
