from __future__ import annotations

import random
import time
from datetime import datetime
from typing import Dict, List, Optional

from .crossref import fetch_works_for_issn
from .mdpi import extract_mdpi_history_dates, fetch_mdpi_article_page_by_doi
from .pmc import extract_pmc_events_from_xml, fetch_pmc_xml
from .pubmed import fetch_pubmed_articles, search_pubmed_ids


EXCLUDE_PUBLICATION_TYPES = {
    "Editorial",
    "Comment",
    "News",
    "Letter",
}


def _days_between_iso(start_iso: Optional[str], end_iso: Optional[str]) -> Optional[int]:
    if not start_iso or not end_iso:
        return None
    try:
        s = datetime.fromisoformat(start_iso).date()
        e = datetime.fromisoformat(end_iso).date()
    except Exception:
        return None
    d = (e - s).days
    return d if d >= 0 else None


def _pubmed_query_for_issn(issn: str, from_pub_date: str, until_pub_date: str) -> str:
    # PubMed date syntax: YYYY/MM/DD:YYYY/MM/DD[pdat]
    a = from_pub_date.replace("-", "/")
    b = until_pub_date.replace("-", "/")
    return f"{issn}[issn] AND ({a}:{b}[pdat])"


def _is_excluded(publication_types: List[str]) -> bool:
    for p in publication_types:
        if p in EXCLUDE_PUBLICATION_TYPES:
            return True
    return False


def _fetch_pmc_with_retry(pmcid: str, max_retries: int = 3) -> Dict:
    last_error = None
    for i in range(max_retries):
        try:
            xml = fetch_pmc_xml(pmcid)
            return {
                "ok": True,
                "xml": xml,
                "retry_count": i,
                "error": None,
            }
        except Exception as e:
            last_error = f"{type(e).__name__}: {e}"
    return {
        "ok": False,
        "xml": None,
        "retry_count": max_retries,
        "error": last_error,
    }


def build_articles_db_for_issns(
    issns: List[Dict[str, str]],
    from_pub_date: str,
    until_pub_date: str,
    retmax_per_journal: int = 100,
    skip_mdpi_fallback: bool = False,
) -> List[Dict]:
    rows: List[Dict] = []

    for journal_item in issns:
        issn = journal_item["issn"]
        label = journal_item.get("label") or issn
        query = _pubmed_query_for_issn(issn, from_pub_date, until_pub_date)
        pmids = search_pubmed_ids(query, retmax=retmax_per_journal)
        articles = fetch_pubmed_articles(pmids)

        # Fallback for journals with zero PubMed hits:
        # fetch article DOIs from Crossref, then rely on MDPI DOI-page parsing
        # for received/revised/accepted when available.
        if not articles:
            try:
                cr_rows = fetch_works_for_issn(
                    issn=issn,
                    from_pub_date=from_pub_date,
                    until_pub_date=until_pub_date,
                    rows=retmax_per_journal,
                )
            except Exception:
                cr_rows = []

            for c in cr_rows:
                articles.append(
                    {
                        "pmid": None,
                        "pmcid": None,
                        "doi": c.get("doi"),
                        "title": c.get("title"),
                        "journal": c.get("journal") or label,
                        "issn": c.get("issn") or issn,
                        "pub_date": c.get("published_online_date")
                        or c.get("issued_date")
                        or c.get("published_print_date"),
                        "publication_types": ["Journal Article"],
                        "received_date": None,
                        "revised_dates": [],
                        "revised_first_date": None,
                        "revised_last_date": None,
                        "accepted_date": None,
                        "_seed_source": "crossref_metadata",
                    }
                )

        for a in articles:
            publication_types = a.get("publication_types") or []
            if _is_excluded(publication_types):
                continue

            _pm_revised = a.get("revised_dates") or []
            _pm_received = a.get("received_date")
            _pm_accepted = a.get("accepted_date")
            _pm_rev_first = a.get("revised_first_date")
            _pm_rev_last = a.get("revised_last_date")
            _pm_r2a = _days_between_iso(_pm_received, _pm_accepted)
            _pm_rev2a = _days_between_iso(_pm_rev_last, _pm_accepted)

            # Decide initial source_type based on whether PubMed already gave us history
            _seed_source = a.get("_seed_source") or "pubmed_metadata"
            _has_pm_history = bool(_pm_received or _pm_accepted)
            _initial_source = "pubmed_history" if _has_pm_history else "pubmed_metadata"
            if _seed_source == "crossref_metadata" and not _has_pm_history:
                _initial_source = "crossref_metadata"
            _initial_status = "ok" if _has_pm_history else "metadata_only"
            _initial_confidence = 0.0
            if _pm_received and _pm_accepted:
                _initial_confidence = 0.8
            elif _pm_received or _pm_accepted:
                _initial_confidence = 0.4

            base = {
                "journal_label": label,
                "journal": a.get("journal"),
                "issn": a.get("issn") or issn,
                "pmid": a.get("pmid"),
                "pmcid": a.get("pmcid"),
                "doi": a.get("doi"),
                "title": a.get("title"),
                "pub_date": a.get("pub_date"),
                "source_type": _initial_source,
                "source_url": None,
                "fetch_status": _initial_status,
                "error_code": None,
                "retry_count": 0,
                "received_date": _pm_received,
                "revised_dates": _pm_revised,
                "revised_first_date": _pm_rev_first,
                "revised_last_date": _pm_rev_last,
                "accepted_date": _pm_accepted,
                "collection_date": None,
                "online_date": None,
                "days_received_to_accepted": _pm_r2a,
                "days_revised_last_to_accepted": _pm_rev2a,
                "parse_method": "pubmed_history_xml" if _has_pm_history else None,
                "confidence_score": _initial_confidence,
                "publication_types": publication_types,
                "fetched_at": datetime.utcnow().isoformat() + "Z",
            }

            pmcid = a.get("pmcid")
            if pmcid:
                pmc_ret = _fetch_pmc_with_retry(pmcid)
                base["retry_count"] = pmc_ret["retry_count"]
                base["source_url"] = f"https://pmc.ncbi.nlm.nih.gov/articles/{pmcid}/"

                if pmc_ret["ok"]:
                    parsed = extract_pmc_events_from_xml(pmc_ret["xml"])
                    base.update(
                        {
                            "source_type": "pmc_xml",
                            "fetch_status": "ok",
                            "received_date": parsed.get("received_date"),
                            "revised_dates": parsed.get("revised_dates") or [],
                            "revised_first_date": parsed.get("revised_first_date"),
                            "revised_last_date": parsed.get("revised_last_date"),
                            "accepted_date": parsed.get("accepted_date"),
                            "collection_date": parsed.get("collection_date"),
                            "parse_method": parsed.get("parse_method"),
                            "confidence_score": parsed.get("confidence_score") or 0.0,
                        }
                    )
                    base["days_received_to_accepted"] = _days_between_iso(
                        base.get("received_date"), base.get("accepted_date")
                    )
                    base["days_revised_last_to_accepted"] = _days_between_iso(
                        base.get("revised_last_date"), base.get("accepted_date")
                    )
                else:
                    base["fetch_status"] = "pmc_fetch_failed"
                    base["error_code"] = pmc_ret["error"]

            doi = (a.get("doi") or "").strip().lower()
            need_mdpi_fallback = (
                not skip_mdpi_fallback
                and doi.startswith("10.3390/")
                and (not base.get("received_date") or not base.get("accepted_date"))
            )
            if need_mdpi_fallback:
                try:
                    html, final_url = fetch_mdpi_article_page_by_doi(doi)
                    parsed = extract_mdpi_history_dates(html)
                    got_any = any(
                        [
                            parsed.get("received_date"),
                            parsed.get("accepted_date"),
                            parsed.get("revised_last_date"),
                            parsed.get("online_date"),
                        ]
                    )
                    if got_any:
                        base.update(
                            {
                                "source_type": "mdpi_article_page",
                                "source_url": final_url,
                                "fetch_status": "ok",
                                "received_date": parsed.get("received_date") or base.get("received_date"),
                                "revised_dates": parsed.get("revised_dates")
                                or base.get("revised_dates")
                                or [],
                                "revised_first_date": parsed.get("revised_first_date")
                                or base.get("revised_first_date"),
                                "revised_last_date": parsed.get("revised_last_date")
                                or base.get("revised_last_date"),
                                "accepted_date": parsed.get("accepted_date") or base.get("accepted_date"),
                                "online_date": parsed.get("online_date") or base.get("online_date"),
                                "collection_date": parsed.get("collection_date") or base.get("collection_date"),
                                "parse_method": parsed.get("parse_method") or base.get("parse_method"),
                                "confidence_score": max(
                                    float(base.get("confidence_score") or 0.0),
                                    float(parsed.get("confidence_score") or 0.0),
                                ),
                                "error_code": None,
                            }
                        )
                        base["days_received_to_accepted"] = _days_between_iso(
                            base.get("received_date"), base.get("accepted_date")
                        )
                        base["days_revised_last_to_accepted"] = _days_between_iso(
                            base.get("revised_last_date"), base.get("accepted_date")
                        )
                except Exception as e:
                    if base.get("error_code") is None:
                        base["error_code"] = f"mdpi_fallback_failed:{type(e).__name__}: {e}"

            rows.append(base)

        # Slow down between journals to reduce request burst risk
        time.sleep(random.uniform(1.0, 30.0))

    return rows
