#!/usr/bin/env python3
"""
scripts/build_expansion_dataset.py
Fetch PubMed records for 17 new biomedical journals with robust retry + caching,
and create a consolidated re_data run directory (runs/20261112_biomed_expanded).
"""

import csv
import json
import os
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path
import numpy as np

MONTHS = {
    "jan": "01", "feb": "02", "mar": "03", "apr": "04", "may": "05", "jun": "06",
    "jul": "07", "aug": "08", "sep": "09", "oct": "10", "nov": "11", "dec": "12",
}

ROOT = Path(__file__).resolve().parents[1]
RE_DATA = ROOT.parent / "re_data"
ORIGINAL_RUN = RE_DATA / "runs" / "20261107_biomed"
OUTPUT_RUN = RE_DATA / "runs" / "20261112_biomed_expanded"
CACHE_DIR = OUTPUT_RUN / ".cache_fetch"
JOURNALS_CSV = RE_DATA / "derived" / "journals" / "biomed_expanded_37.csv"

START_DATE = "2026/05/07"
END_DATE = "2026/11/07"
WIN_START = date(2026, 5, 7)
WIN_END = date(2026, 11, 7)

# The 17 new journals to fetch
NEW_JOURNALS = [
    ("PLOS One", "101285081", 400),
    ("eClinicalMedicine", "101733727", 350),
    ("Cell Death & Disease", "101524092", 350),
    ("Advanced Science", "101664569", 350),
    ("Theranostics", "101552395", 250),
    ("Microbiome", "101615147", 150),
    ("Journal of Nanobiotechnology", "101152208", 350),
    ("Cell Reports Medicine", "101766894", 350),
    ("Blood Cancer Journal", "101568469", 200),
    ("Acta Pharmaceutica Sinica. B", "101600560", 300),
    ("Journal of Biomedical Science", "9421567", 100),
    ("Journal of Experimental & Clinical Cancer Research : CR", "8308647", 200),
    ("MedComm", "101769925", 350),
    ("Alzheimer's & Dementia", "101231978", 350),
    ("Frontiers in Immunology", "101560960", 400),
    ("Frontiers in Oncology", "101568867", 350),
    ("Frontiers in Pharmacology", "101548923", 350),
]

def urlopen_with_retry(req, timeout=40, max_retries=6, initial_backoff=1.5):
    for attempt in range(max_retries):
        try:
            return urllib.request.urlopen(req, timeout=timeout)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            sleep_time = initial_backoff * (1.8 ** attempt)
            print(f" [Network retry {attempt+1}/{max_retries} after error: {e}. Sleeping {sleep_time:.1f}s...]")
            time.sleep(sleep_time)

def get_text(node):
    if node is None:
        return ""
    return "".join(node.itertext()).strip()

def parse_iso_date(y, m, d):
    if not y:
        return None
    if not m:
        m = "01"
    else:
        m_lower = m.lower()[:3]
        m = MONTHS.get(m_lower, m.zfill(2) if m.isdigit() else "01")
    if not d:
        d = "01"
    else:
        d = d.zfill(2)
    return f"{y}-{m}-{d}"

def quantile_val(vals, q):
    if not vals:
        return None
    return float(np.percentile(vals, q * 100))

def fetch_journal_articles(nlm_id, journal_name, max_articles):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / f"{nlm_id}.json"
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cached = json.load(f)
            print(f"[{journal_name}] Loaded {len(cached['articles'])} articles from cache.")
            return cached["esearch_count"], cached["articles"]
        except Exception:
            pass

    term = f'("{START_DATE}"[dp] : "{END_DATE}"[dp]) AND {nlm_id}[jid]'
    params = {
        'db': 'pubmed',
        'retmode': 'json',
        'retmax': str(max_articles),
        'term': term
    }
    url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': 'scimanu-reviewtime/1.0 (support@scimanu.com)'})
    with urlopen_with_retry(req, timeout=25) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    esearch_count = int(data.get('esearchresult', {}).get('count', 0))
    pmids = data.get('esearchresult', {}).get('idlist', [])
    print(f"[{journal_name}] ESearch hits: {esearch_count}, fetching: {len(pmids)} PMIDs...")

    articles = []
    for i in range(0, len(pmids), 100):
        batch = pmids[i:i+100]
        f_params = {
            'db': 'pubmed',
            'retmode': 'xml',
            'id': ','.join(batch)
        }
        f_url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?' + urllib.parse.urlencode(f_params)
        f_req = urllib.request.Request(f_url, headers={'User-Agent': 'scimanu-reviewtime/1.0 (support@scimanu.com)'})
        with urlopen_with_retry(f_req, timeout=45) as f_resp:
            xml_bytes = f_resp.read()

        root = ET.fromstring(xml_bytes)
        for art in root.findall('.//PubmedArticle'):
            pmid = get_text(art.find('.//MedlineCitation/PMID'))
            journal_title = get_text(art.find('.//Article/Journal/Title')) or journal_name
            journal_iso = get_text(art.find('.//Article/Journal/ISOAbbreviation'))

            doi = ""
            pmcid = ""
            for id_node in art.findall('.//PubmedData/ArticleIdList/ArticleId'):
                id_type = (id_node.attrib.get('IdType') or '').lower()
                val = get_text(id_node)
                if id_type == 'doi' and not doi:
                    doi = val
                elif id_type == 'pmc' and not pmcid:
                    pmcid = val

            art_date_node = art.find('.//Article/ArticleDate[@DateType="Electronic"]')
            pub_date = None
            pub_date_source = ""
            if art_date_node is not None:
                y = get_text(art_date_node.find('Year'))
                m = get_text(art_date_node.find('Month'))
                d = get_text(art_date_node.find('Day'))
                if y and m and d:
                    pub_date = parse_iso_date(y, m, d)
                    pub_date_source = "ArticleDate:Electronic"

            if not pub_date:
                issue_date_node = art.find('.//Article/Journal/JournalIssue/PubDate')
                if issue_date_node is not None:
                    y = get_text(issue_date_node.find('Year'))
                    m = get_text(issue_date_node.find('Month'))
                    d = get_text(issue_date_node.find('Day'))
                    if y and m and d:
                        pub_date = parse_iso_date(y, m, d)
                        pub_date_source = "JournalIssue/PubDate"
                    elif y:
                        pub_date = f"{y}-01-01"
                        pub_date_source = "JournalIssue/PubDate:YearOnly"

            history_events = []
            rec_date = None
            acc_date = None
            rev_dates = []
            for h in art.findall('.//PubmedData/History/PubMedPubDate'):
                status = (h.attrib.get('PubStatus') or '').lower()
                y = get_text(h.find('Year'))
                m = get_text(h.find('Month'))
                d = get_text(h.find('Day'))
                if y and m and d:
                    iso = parse_iso_date(y, m, d)
                    raw_date = f"{y} {int(m) if m.isdigit() else m} {int(d) if d.isdigit() else d}"
                    history_events.append({
                        "status": status,
                        "date": iso,
                        "raw_date": raw_date,
                        "source_path": "PubmedData/History/PubMedPubDate"
                    })
                    if status == "received" and not rec_date:
                        rec_date = iso
                    elif status == "accepted" and not acc_date:
                        acc_date = iso
                    elif status in {"revised", "rev-recd", "revision-received"}:
                        rev_dates.append(iso)

            rev_dates = sorted(set(rev_dates))

            types = [get_text(t) for t in art.findall('.//Article/PublicationTypeList/PublicationType')]
            types_str = " | ".join(t for t in types if t) or "Journal Article"

            diff_days = ""
            timeline_status = "missing_received_and_accepted"
            if rec_date and acc_date:
                try:
                    d_rec = datetime.strptime(rec_date, "%Y-%m-%d").date()
                    d_acc = datetime.strptime(acc_date, "%Y-%m-%d").date()
                    delta = (d_acc - d_rec).days
                    diff_days = str(delta)
                    if 1 <= delta <= 1000:
                        timeline_status = "valid_received_accepted"
                    elif delta > 1000:
                        timeline_status = "interval_over_1000_days_review"
                    elif delta == 0:
                        timeline_status = "same_day_zero_interval"
                    else:
                        timeline_status = "accepted_before_received"
                except Exception:
                    pass

            pub_win_status = "outside_publication_window"
            if pub_date:
                try:
                    d_pub = datetime.strptime(pub_date, "%Y-%m-%d").date()
                    if pub_date_source.endswith("YearOnly"):
                        pub_win_status = "publication_date_precision_insufficient"
                    elif WIN_START <= d_pub <= WIN_END:
                        pub_win_status = "in_publication_window"
                except Exception:
                    pub_win_status = "publication_date_precision_insufficient"
            else:
                pub_win_status = "publication_date_precision_insufficient"

            date_status = timeline_status if pub_win_status == "in_publication_window" else "publication_date_outside_query_window"
            data_used = "yes" if (pub_win_status == "in_publication_window" and timeline_status == "valid_received_accepted") else "no"

            articles.append({
                "pmid": pmid,
                "pmcid": pmcid,
                "doi": doi,
                "nlm_id": nlm_id,
                "journal": journal_name,
                "journal_iso_abbrev": journal_iso,
                "publication_date": pub_date or "",
                "publication_date_source": pub_date_source,
                "received_date": rec_date or "",
                "accepted_date": acc_date or "",
                "received_to_accepted_days": diff_days,
                "date_status": date_status,
                "article_types": types_str,
                "source": "PubMed EFetch",
                "revision_count": str(len(rev_dates)),
                "revision_date_1": rev_dates[0] if len(rev_dates) > 0 else "",
                "revision_date_2": rev_dates[1] if len(rev_dates) > 1 else "",
                "revision_dates_json": json.dumps(rev_dates),
                "pubmed_history_json": json.dumps(history_events),
                "history_source_path": "PubmedData/History/PubMedPubDate",
                "history_fetch_status": "returned",
                "publication_window_status": pub_win_status,
                "timeline_status": timeline_status,
                "data_used_for_statistics": data_used,
            })
        time.sleep(0.4)

    valid_n = sum(1 for a in articles if a['data_used_for_statistics'] == 'yes')
    print(f" -> Fetched {len(articles)} articles, valid received->accepted: {valid_n}")
    
    # Save cache
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump({"esearch_count": esearch_count, "articles": articles}, f, ensure_ascii=False)
    
    return esearch_count, articles

def main():
    OUTPUT_RUN.mkdir(parents=True, exist_ok=True)

    # 1. Load original articles
    print("Loading original articles from 20261107_biomed...")
    orig_articles = []
    with open(ORIGINAL_RUN / "articles.csv", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        orig_articles = list(reader)
    print(f"Original articles count: {len(orig_articles)}")

    with open(ORIGINAL_RUN / "manifest.json", encoding="utf-8") as f:
        orig_manifest = json.load(f)

    all_articles = list(orig_articles)
    new_queries = []

    # 2. Fetch new journals
    for journal_name, nlm_id, max_arts in NEW_JOURNALS:
        esearch_cnt, new_arts = fetch_journal_articles(nlm_id, journal_name, max_arts)
        all_articles.extend(new_arts)
        new_queries.append({
            "nlm_id": nlm_id,
            "journal": journal_name,
            "query": f'("{START_DATE}"[dp] : "{END_DATE}"[dp]) AND {nlm_id}[jid]',
            "count": esearch_cnt,
            "pmids_returned": len(new_arts)
        })

    # Dedup by PMID
    dedup = {}
    for a in all_articles:
        dedup[a["pmid"]] = a
    all_articles = list(dedup.values())
    print(f"\nConsolidated total unique articles: {len(all_articles)}")

    # 3. Write articles.csv
    articles_csv_path = OUTPUT_RUN / "articles.csv"
    with open(articles_csv_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_articles)
    print(f"Saved articles.csv to {articles_csv_path}")

    # 4. Compute Quality Report and Manifest
    total_pmids = len(all_articles)
    pmcid_n = sum(1 for a in all_articles if a.get("pmcid"))

    by_journal = defaultdict(list)
    for a in all_articles:
        by_journal[a["nlm_id"]].append(a)

    journal_stats = []
    cohort_articles = [a for a in all_articles if a.get("publication_window_status") == "in_publication_window"]
    outside_window_n = sum(1 for a in all_articles if a.get("publication_window_status") == "outside_publication_window")
    imprecise_date_n = sum(1 for a in all_articles if a.get("publication_window_status") == "publication_date_precision_insufficient")
    cohort_valid_n = sum(1 for a in cohort_articles if a.get("data_used_for_statistics") == "yes")

    cohort_revision_rows_n = 0
    cohort_2plus_revision_rows_n = 0
    cohort_revision_events_n = 0
    for a in cohort_articles:
        if a.get("data_used_for_statistics") == "yes":
            try:
                revs = json.loads(a.get("revision_dates_json") or "[]")
                if len(revs) > 0:
                    cohort_revision_rows_n += 1
                if len(revs) >= 2:
                    cohort_2plus_revision_rows_n += 1
                cohort_revision_events_n += len(revs)
            except Exception:
                pass

    orig_queries = orig_manifest.get("pubmed", {}).get("journal_queries", [])
    all_queries = list(orig_queries) + new_queries
    query_map = {q["nlm_id"]: q for q in all_queries}

    for nlm_id, arts in by_journal.items():
        q_info = query_map.get(nlm_id, {"count": len(arts), "journal": arts[0]["journal"]})
        j_name = arts[0]["journal"]
        c_arts = [a for a in arts if a.get("publication_window_status") == "in_publication_window"]
        v_arts = [a for a in c_arts if a.get("data_used_for_statistics") == "yes"]

        days_list = []
        for a in v_arts:
            try:
                days_list.append(int(a["received_to_accepted_days"]))
            except Exception:
                pass

        pub_sources = Counter(a.get("publication_date_source") for a in arts if a.get("publication_date_source"))

        j_rev_rows = sum(1 for a in v_arts if int(a.get("revision_count", 0)) > 0)
        j_rev_events = sum(int(a.get("revision_count", 0)) for a in v_arts)

        med = quantile_val(days_list, 0.50) if days_list else None
        p25 = quantile_val(days_list, 0.25) if days_list else None
        p75 = quantile_val(days_list, 0.75) if days_list else None
        p90 = quantile_val(days_list, 0.90) if days_list else None

        journal_stats.append({
            "journal": j_name,
            "nlm_id": nlm_id,
            "pubmed_esearch_count": q_info["count"],
            "pubmed_efetch_count": len(arts),
            "outside_publication_window_excluded": sum(1 for a in arts if a.get("publication_window_status") == "outside_publication_window"),
            "publication_date_precision_insufficient_n": sum(1 for a in arts if a.get("publication_window_status") == "publication_date_precision_insufficient"),
            "publication_window_cohort_n": len(c_arts),
            "valid_received_accepted_n": len(v_arts),
            "timeline_coverage_pct": round((len(v_arts) / len(c_arts) * 100), 1) if c_arts else 0.0,
            "missing_received_or_accepted_n": sum(1 for a in c_arts if a.get("timeline_status") == "missing_received_and_accepted"),
            "over_1000_days_review_flag_n": sum(1 for a in c_arts if a.get("timeline_status") == "interval_over_1000_days_review"),
            "median_days": med,
            "p25_days": p25,
            "p75_days": p75,
            "p90_days": p90,
            "pubmed_history_revised_records_n": j_rev_rows,
            "pubmed_history_2plus_revised_records_n": sum(1 for a in v_arts if int(a.get("revision_count", 0)) >= 2),
            "revision_events_n": j_rev_events,
            "publication_date_source_counts": dict(pub_sources)
        })

    quality_report = {
        "source": "PubMed E-utilities ESearch/EFetch",
        "query_window": {
            "start_inclusive": "2026-05-07",
            "end_inclusive": "2026-11-07"
        },
        "query_fields": {
            "journal": "[jid] NLM Unique ID",
            "publication": "[dp] Publication Date"
        },
        "date_validation_rule": "Prefer PubMed ArticleDate with DateType=Electronic; otherwise use JournalIssue/PubDate. Include only an exact YYYY-MM-DD date inside the inclusive window.",
        "data_saved": [
            "PMID", "PMCID", "DOI", "NLM journal ID", "publication date, precision and source",
            "received date", "accepted date", "all PubMed History events", "all revised dates in source order",
            "revision_date_1", "revision_date_2", "article types"
        ],
        "article_text_saved": False,
        "record_counts": {
            "journal_count": len(by_journal),
            "esearch_total": sum(q["count"] for q in all_queries),
            "efetch_total": total_pmids,
            "unique_pmid_n": total_pmids,
            "duplicate_pmid_n": 0,
            "pmcid_n": pmcid_n,
            "efetch_status_counts_all_before_precision_validation": dict(Counter(a.get("timeline_status") for a in all_articles)),
            "cohort_n_after_date_validation": len(cohort_articles),
            "cohort_status_counts": dict(Counter(a.get("timeline_status") for a in cohort_articles)),
            "publication_date_precision_insufficient_n": imprecise_date_n,
            "outside_publication_window_n": outside_window_n,
            "cohort_valid_received_accepted_n": cohort_valid_n,
            "cohort_revision_rows_n": cohort_revision_rows_n,
            "cohort_2plus_revision_rows_n": cohort_2plus_revision_rows_n,
            "cohort_revision_events_n": cohort_revision_events_n
        },
        "journal_stats": journal_stats
    }

    with open(OUTPUT_RUN / "quality_report.json", "w", encoding="utf-8") as f:
        json.dump(quality_report, f, indent=2, ensure_ascii=False)
    print(f"Saved quality_report.json to {OUTPUT_RUN / 'quality_report.json'}")

    manifest = dict(orig_manifest)
    manifest["run_id"] = "20261112_biomed_expanded"
    manifest["run_date"] = "2026-11-12"
    manifest["pubmed"]["esearch_total"] = sum(q["count"] for q in all_queries)
    manifest["pubmed"]["efetch_total"] = total_pmids
    manifest["pubmed"]["unique_pmids"] = total_pmids
    manifest["pubmed"]["pmcids"] = pmcid_n
    manifest["pubmed"]["exact_publication_date_cohort"] = len(cohort_articles)
    manifest["pubmed"]["valid_received_accepted"] = cohort_valid_n
    manifest["pubmed"]["revision_events_in_cohort"] = cohort_revision_events_n
    manifest["pubmed"]["journal_queries"] = all_queries
    manifest["outputs"] = {
        "article_csv": "runs/20261112_biomed_expanded/articles.csv",
        "quality_report": "runs/20261112_biomed_expanded/quality_report.json"
    }

    with open(OUTPUT_RUN / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"Saved manifest.json to {OUTPUT_RUN / 'manifest.json'}")

if __name__ == "__main__":
    main()
