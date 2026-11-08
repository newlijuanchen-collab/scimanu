#!/usr/bin/env python3
"""Rebuild public statistics from PubMed EFetch records only.

The source records stay private in re_data. Only PubMed identifiers, date history,
article types and journal metadata enter the normalized database. Public output
contains PubMed-derived aggregate statistics only.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import statistics
import sqlite3
from calendar import monthrange
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
STATISTICS_DIR = ROOT / "public" / "data" / "statistics"
COMBINED_DIR = ROOT.parent / "re_data" / "db"
COMBINED_DB = COMBINED_DIR / "reviewtime.sqlite"
COMBINED_MANIFEST = COMBINED_DIR / "manifest.json"
DEFAULT_PUBMED_RUN = ROOT.parent / "re_data" / "runs" / "20261107_biomed"
DEFAULT_PUBMED_JOURNALS = ROOT.parent / "re_data" / "derived" / "journals" / "biomed_pilot_20.csv"

RESEARCH_TYPES = {
    "research", "research article", "research paper", "original article", "original paper",
    "original research", "original research article", "regular article", "regular paper", "originalien",
}
STAGES = ("acceptance", "first_revision", "last_revision", "publication")
PUBMED_FIELDS = {
    "pmid", "doi", "nlm_id", "journal", "journal_iso_abbrev", "publication_date",
    "pmcid", "publication_date_source", "article_types", "pubmed_history_json", "history_source_path",
    "date_status", "timeline_status", "data_used_for_statistics", "publication_window_status", "history_fetch_status",
}


def iter_csv(path: Path, selected_fields: set[str] | None = None) -> Iterable[dict[str, str]]:
    """Stream a CSV and only retain the listed fields in each normalized row."""
    with path.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if selected_fields and not selected_fields.issubset(set(reader.fieldnames or [])):
            missing = sorted(selected_fields - set(reader.fieldnames or []))
            raise ValueError(f"{path} is missing required fields: {', '.join(missing)}")
        for row in reader:
            yield {key: row.get(key, "") or "" for key in selected_fields} if selected_fields else row


def parse_date(value: str) -> date | None:
    if not value:
        return None
    value = value.strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}T", value):
        value = value[:10]
    for pattern in ("%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y", "%Y %m %d", "%Y-%m", "%Y/%m", "%Y"):
        try:
            parsed = datetime.strptime(value.strip(), pattern).date()
            if pattern == "%Y-%m":
                return date(parsed.year, parsed.month, 1)
            if pattern == "%Y":
                return date(parsed.year, 1, 1)
            return parsed
        except ValueError:
            continue
    return None


def date_precision(value: str) -> str:
    value = value.strip()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}T.*", value):
        return "day" if parse_date(value) else "invalid"
    if re.fullmatch(r"\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}/\d{1,2}/\d{4}|\d{4}\s+\d{1,2}\s+\d{1,2}", value):
        return "day" if parse_date(value) else "invalid"
    if re.fullmatch(r"\d{4}[-/]\d{1,2}", value):
        return "month" if parse_date(value) else "invalid"
    if re.fullmatch(r"\d{4}", value):
        return "year"
    return "missing" if not value else "invalid"


def make_date_event(date_type: str, ordinal: int, raw_value: str, source_field: str, source_path: str) -> dict[str, Any]:
    return {
        "date_type": date_type,
        "ordinal": ordinal,
        "raw_value": raw_value,
        "date": parse_date(raw_value),
        "precision": date_precision(raw_value),
        "source_field": source_field,
        "source_path": source_path,
    }


def quantile(values: list[int], probability: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    position = (len(ordered) - 1) * probability
    low = int(position)
    high = min(low + 1, len(ordered) - 1)
    fraction = position - low
    return round(ordered[low] * (1 - fraction) + ordered[high] * fraction, 1)


def summarize(values: list[int]) -> dict[str, int | float | None]:
    result: dict[str, int | float | None] = {
        "count": len(values), "median": None, "p25": None, "p75": None, "p90": None,
    }
    if len(values) >= 5:
        result.update({
            "median": round(float(statistics.median(values)), 1),
            "p25": quantile(values, 0.25),
            "p75": quantile(values, 0.75),
            "p90": quantile(values, 0.90),
        })
    return result


def normalize_pubmed(run_dir: Path, journals_path: Path) -> tuple[list[dict[str, Any]], dict[str, Any], dict[str, Any]]:
    run_manifest = json.loads((run_dir / "manifest.json").read_text(encoding="utf-8"))
    quality = json.loads((run_dir / "quality_report.json").read_text(encoding="utf-8"))
    journals = list(iter_csv(journals_path))
    journal_by_id = {row["NLM Unique ID"]: row for row in journals}
    if len(journal_by_id) != len(journals):
        raise ValueError("The biomedical journal selection has duplicate NLM IDs")

    records = []
    pmids: set[str] = set()
    doi_keys: set[str] = set()
    for row in iter_csv(run_dir / "articles.csv", PUBMED_FIELDS):
        pmid = row.get("pmid", "").strip()
        if not pmid or pmid in pmids:
            raise ValueError(f"The PubMed export has a missing or duplicate PMID: {pmid!r}")
        pmids.add(pmid)
        nlm_id = row.get("nlm_id", "").strip()
        journal = journal_by_id.get(nlm_id)
        if journal is None:
            raise ValueError(f"PubMed row has an unselected NLM ID: {nlm_id}")
        doi = row.get("doi", "").strip().lower()
        if doi.startswith("https://doi.org/"):
            doi = doi.removeprefix("https://doi.org/")
        elif doi.startswith("http://doi.org/"):
            doi = doi.removeprefix("http://doi.org/")
        if doi:
            doi_keys.add(doi)

        date_events: list[dict[str, Any]] = []
        history = []
        try:
            history = json.loads(row.get("pubmed_history_json") or "[]")
        except (TypeError, json.JSONDecodeError):
            history = []
        status_ordinals: dict[str, int] = defaultdict(int)
        for event in history:
            status = str(event.get("status", "history_event"))
            status_ordinals[status] += 1
            raw_value = str(event.get("raw_date") or event.get("date") or "")
            date_events.append(make_date_event(
                status, status_ordinals[status], raw_value,
                "PubmedData/History/PubMedPubDate", str(event.get("source_path") or row.get("history_source_path") or ""),
            ))

        publication_event = make_date_event(
            "publication", 1, row.get("publication_date", ""), "publication_date",
            f"PubMed CSV:{row.get('publication_date_source', '')}",
        )
        date_events.append(publication_event)
        revisions = [event["date"] for event in date_events if event["date_type"] == "revised" and event["precision"] == "day"]
        received_event = next((event for event in date_events if event["date_type"] == "received"), None)
        accepted_event = next((event for event in date_events if event["date_type"] == "accepted"), None)
        received = received_event["date"] if received_event and received_event["precision"] == "day" else None
        accepted = accepted_event["date"] if accepted_event and accepted_event["precision"] == "day" else None
        publication = publication_event["date"] if publication_event["precision"] == "day" else None
        print_issn = journal.get("ISSN (print)", "").strip()
        online_issn = journal.get("ISSN (online)", "").strip()
        records.append({
            "source_key": "pubmed_biomed",
            "source_record_id": pmid,
            "doi": doi,
            "pmid": pmid,
            "pmcid": row.get("pmcid", "").strip(),
            "journal_key": f"pubmed_biomed:{nlm_id}",
            "journal_title": journal["Journal Title"],
            "article_type": row.get("article_types", ""),
            "received_date": received,
            "received_precision": received_event["precision"] if received_event else "missing",
            "accepted_date": accepted,
            "accepted_precision": accepted_event["precision"] if accepted_event else "missing",
            "revised_dates": revisions,
            "publication_date": publication,
            "publication_precision": publication_event["precision"],
            "publication_date_source": row.get("publication_date_source", ""),
            "cohort_date": publication,
            "cohort_basis": "publication_date",
            "issn": " / ".join(value for value in (print_issn, online_issn) if value),
            "url": None,
            "nlm_id": nlm_id,
            "date_events": date_events,
            "fetched_at": run_manifest.get("run_date", ""),
            "timeline_status": row.get("timeline_status", row.get("date_status", "")),
            "source_metadata": {
                "doi_raw": row.get("doi", ""),
                "date_status": row.get("date_status", ""),
                "timeline_status": row.get("timeline_status", ""),
                "data_used_for_statistics": row.get("data_used_for_statistics", ""),
                "publication_window_status": row.get("publication_window_status", ""),
                "history_fetch_status": row.get("history_fetch_status", ""),
                "history_source_path": row.get("history_source_path", ""),
            },
        })

    expected = quality["record_counts"]
    if len(pmids) != expected["unique_pmid_n"]:
        raise ValueError("The unique PMID count does not match the quality report")
    return records, run_manifest, {
        "rows": len(pmids),
        "unique_pmid_n": len(pmids),
        "doi_keys": doi_keys,
        "quality": expected,
        "journals": journals,
    }


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_combined_database(
    path: Path,
    records: list[dict[str, Any]],
    pubmed_path: Path,
    pubmed_audit: dict[str, Any],
    pubmed_manifest: dict[str, Any],
) -> dict[str, Any]:
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as connection:
        connection.executescript("""
            PRAGMA foreign_keys = ON;
            CREATE TABLE articles (
                article_key TEXT PRIMARY KEY,
                source_key TEXT NOT NULL,
                source_record_id TEXT NOT NULL,
                doi TEXT,
                pmid TEXT,
                pmcid TEXT,
                journal_key TEXT NOT NULL,
                journal_label TEXT NOT NULL,
                nlm_id TEXT,
                issn TEXT,
                article_type TEXT,
                cohort_basis TEXT NOT NULL,
                cohort_date TEXT,
                publication_date_source TEXT,
                fetched_at TEXT,
                timeline_status TEXT,
                source_file TEXT NOT NULL,
                source_metadata_json TEXT NOT NULL DEFAULT '{}',
                UNIQUE(source_key, source_record_id)
            );
            CREATE TABLE article_dates (
                article_key TEXT NOT NULL REFERENCES articles(article_key),
                event_type TEXT NOT NULL,
                event_ordinal INTEGER NOT NULL,
                source_order INTEGER NOT NULL,
                raw_date TEXT,
                normalized_date TEXT,
                date_precision TEXT NOT NULL,
                source_field TEXT NOT NULL,
                source_path TEXT NOT NULL,
                PRIMARY KEY(article_key, source_order)
            );
            CREATE TABLE journals (
                source_key TEXT NOT NULL,
                journal_key TEXT NOT NULL,
                nlm_id TEXT,
                journal_label TEXT NOT NULL,
                issn TEXT,
                PRIMARY KEY(source_key, journal_key)
            );
            CREATE TABLE source_runs (
                source_key TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                source_file TEXT NOT NULL,
                source_sha256 TEXT NOT NULL,
                source_rows INTEGER NOT NULL,
                normalized_rows INTEGER NOT NULL,
                retrieved_at TEXT
            );
            CREATE INDEX idx_articles_source_cohort ON articles(source_key, cohort_date);
            CREATE INDEX idx_articles_doi ON articles(doi);
            CREATE INDEX idx_article_dates_type_date ON article_dates(event_type, normalized_date);
            CREATE VIEW article_milestones AS
            SELECT
                a.article_key,
                a.source_key,
                a.source_record_id,
                a.doi,
                a.pmid,
                a.pmcid,
                a.journal_key,
                a.journal_label,
                a.cohort_basis,
                a.cohort_date,
                MAX(CASE WHEN d.event_type = 'received' AND d.date_precision = 'day' THEN d.normalized_date END) AS submitted_date,
                MAX(CASE WHEN d.event_type = 'accepted' AND d.date_precision = 'day' THEN d.normalized_date END) AS accepted_date,
                MAX(CASE WHEN d.event_type = 'publication' AND d.date_precision = 'day' THEN d.normalized_date END) AS publication_date,
                MAX(CASE WHEN d.event_type = 'revised' AND d.event_ordinal = 1 AND d.date_precision = 'day' THEN d.normalized_date END) AS revision_date_1,
                MAX(CASE WHEN d.event_type = 'revised' AND d.event_ordinal = 2 AND d.date_precision = 'day' THEN d.normalized_date END) AS revision_date_2,
                MIN(CASE WHEN d.event_type = 'revised' AND d.date_precision = 'day' THEN d.normalized_date END) AS first_revision_date,
                MAX(CASE WHEN d.event_type = 'revised' AND d.date_precision = 'day' THEN d.normalized_date END) AS last_revision_date,
                SUM(CASE WHEN d.event_type = 'revised' AND d.date_precision = 'day' THEN 1 ELSE 0 END) AS revision_event_count
            FROM articles a
            LEFT JOIN article_dates d ON d.article_key = a.article_key
            GROUP BY a.article_key;
        """)

        source_files = {"pubmed_biomed": os_relpath(pubmed_path)}
        source_run_values = {
            "pubmed_biomed": (
                str(pubmed_manifest.get("run_id", "")),
                source_files["pubmed_biomed"],
                sha256_file(pubmed_path),
                pubmed_audit["rows"],
                sum(record["source_key"] == "pubmed_biomed" for record in records),
                str(pubmed_manifest.get("run_date", "")),
            ),
        }
        connection.executemany(
            "INSERT INTO source_runs VALUES (?, ?, ?, ?, ?, ?, ?)",
            [(source_key, *values) for source_key, values in source_run_values.items()],
        )

        journal_rows: dict[tuple[str, str], tuple[str, str, str, str]] = {}
        for row in records:
            source_key = row["source_key"]
            source_file = source_files[source_key]
            source_record_id = row["source_record_id"]
            article_key = f"{source_key}:{source_record_id}"
            nlm_id = row.get("nlm_id", "")
            metadata = row.get("source_metadata", {})
            connection.execute(
                """INSERT INTO articles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    article_key, source_key, source_record_id, row.get("doi") or None,
                    row.get("pmid") or None, row.get("pmcid") or None,
                    row["journal_key"], row["journal_title"], nlm_id or None,
                    row.get("issn") or None, row.get("article_type") or None,
                    row["cohort_basis"], row["cohort_date"].isoformat() if row.get("cohort_date") else None,
                    row.get("publication_date_source") or None, row.get("fetched_at") or None,
                    row.get("timeline_status") or None, source_file,
                    json.dumps(metadata, ensure_ascii=False, sort_keys=True),
                ),
            )
            journal_rows[(source_key, row["journal_key"])] = (
                nlm_id, row["journal_title"], row.get("issn", ""), source_key,
            )
            for source_order, event in enumerate(row["date_events"], start=1):
                normalized = event["date"].isoformat() if event.get("date") else None
                connection.execute(
                    "INSERT INTO article_dates VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        article_key, event["date_type"], event["ordinal"], source_order, event.get("raw_value") or None,
                        normalized, event["precision"], event["source_field"], event["source_path"],
                    ),
                )
        connection.executemany(
            "INSERT INTO journals VALUES (?, ?, ?, ?, ?)",
            [(source, key, nlm_id or None, label, issn or None)
             for (source, key), (nlm_id, label, issn, source) in journal_rows.items()],
        )
        connection.execute("CREATE TABLE dataset_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        connection.executemany(
            "INSERT INTO dataset_metadata VALUES (?, ?)",
            [
                ("schema_version", "3"),
                ("generated_at", datetime.now(timezone.utc).isoformat()),
                ("article_rows", str(len(records))),
                ("source_policy", "PubMed EFetch only; exact publication-date cohort; no legacy crawler records"),
            ],
        )
        connection.commit()

    with sqlite3.connect(path) as connection:
        article_rows = connection.execute("SELECT count(*) FROM articles").fetchone()[0]
        event_rows = connection.execute("SELECT count(*) FROM article_dates").fetchone()[0]
        source_rows = dict(connection.execute("SELECT source_key, count(*) FROM articles GROUP BY source_key"))
        precision_rows = dict(connection.execute("SELECT date_precision, count(*) FROM article_dates GROUP BY date_precision"))
        doi_rows = connection.execute("SELECT count(*) FROM articles WHERE doi IS NOT NULL").fetchone()[0]
        doi_distinct = connection.execute("SELECT count(DISTINCT doi) FROM articles WHERE doi IS NOT NULL").fetchone()[0]

    return {
        "schema_version": 3,
        "database": "reviewtime.sqlite",
        "database_sha256": sha256_file(path),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "article_rows": article_rows,
        "date_event_rows": event_rows,
        "doi_rows": doi_rows,
        "distinct_doi_values": doi_distinct,
        "date_precision_counts": precision_rows,
        "source_rows": source_rows,
        "sources": {
            "pubmed_biomed": {
                "source_file": source_files["pubmed_biomed"],
                "source_sha256": source_run_values["pubmed_biomed"][2],
                "run_id": pubmed_manifest.get("run_id"),
                "input_rows": pubmed_audit["rows"],
                "normalized_rows": source_rows.get("pubmed_biomed", 0),
                "publication_window": {
                    "start": pubmed_manifest["pubmed"]["query_date_start_inclusive"],
                    "end": pubmed_manifest["pubmed"]["query_date_end_inclusive"],
                },
            },
        },
    }


def classify_timeline_status(record: dict[str, Any], as_of: date) -> str:
    received = record.get("received_date")
    accepted = record.get("accepted_date")
    received_precision = record.get("received_precision", "missing")
    accepted_precision = record.get("accepted_precision", "missing")
    if received is None or accepted is None:
        if received_precision in {"month", "year", "invalid"} or accepted_precision in {"month", "year", "invalid"}:
            return "date_precision_insufficient"
        return "missing_received_or_accepted"
    if accepted < received:
        return "accepted_before_received"
    if accepted == received:
        return "same_day_zero_interval"
    if (accepted - received).days > 1000:
        return "interval_over_1000_days_review"
    if received > as_of or accepted > as_of:
        return "future_received_or_accepted_date"
    return "valid"


def os_relpath(path: Path) -> str:
    relative = path.resolve().relative_to(ROOT.parent.resolve())
    return Path("..", *relative.parts).as_posix()


def load_combined_records(path: Path) -> list[dict[str, Any]]:
    with sqlite3.connect(path) as connection:
        connection.row_factory = sqlite3.Row
        articles = connection.execute("SELECT * FROM articles ORDER BY source_key, source_record_id").fetchall()
        events_by_key: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for event in connection.execute("SELECT * FROM article_dates ORDER BY article_key, source_order"):
            events_by_key[event["article_key"]].append({
                "date_type": event["event_type"],
                "ordinal": event["event_ordinal"],
                "source_order": event["source_order"],
                "raw_value": event["raw_date"] or "",
                "date": date.fromisoformat(event["normalized_date"]) if event["normalized_date"] else None,
                "precision": event["date_precision"],
                "source_field": event["source_field"],
                "source_path": event["source_path"],
            })
        records = []
        for article in articles:
            events = events_by_key[article["article_key"]]
            source_key = article["source_key"]
            publication_type = "publication"
            received_event = next((event for event in events if event["date_type"] == "received"), None)
            accepted_event = next((event for event in events if event["date_type"] == "accepted"), None)
            publication_event = next((event for event in events if event["date_type"] == publication_type), None)
            records.append({
                "source_key": source_key,
                "source_record_id": article["source_record_id"],
                "doi": article["doi"] or "",
                "pmid": article["pmid"] or "",
                "pmcid": article["pmcid"] or "",
                "journal_key": article["journal_key"],
                "journal_title": article["journal_label"],
                "nlm_id": article["nlm_id"] or "",
                "issn": article["issn"] or "",
                "article_type": article["article_type"] or "",
                "cohort_basis": article["cohort_basis"],
                "cohort_date": date.fromisoformat(article["cohort_date"]) if article["cohort_date"] else None,
                "received_date": received_event["date"] if received_event and received_event["precision"] == "day" else None,
                "received_precision": received_event["precision"] if received_event else "missing",
                "accepted_date": accepted_event["date"] if accepted_event and accepted_event["precision"] == "day" else None,
                "accepted_precision": accepted_event["precision"] if accepted_event else "missing",
                "revised_dates": [event["date"] for event in events if event["date_type"] == "revised" and event["precision"] == "day" and event["date"]],
                "publication_date": publication_event["date"] if publication_event and publication_event["precision"] == "day" else None,
                "publication_precision": publication_event["precision"] if publication_event else "missing",
                "publication_date_source": article["publication_date_source"] or "",
                "url": "/journals/plos-one-review-time" if source_key == "plos" else None,
                "date_events": events,
                "timeline_status": article["timeline_status"] or "",
                "fetched_at": article["fetched_at"] or "",
                "source_metadata": json.loads(article["source_metadata_json"]),
            })
        return records


def valid_article_type(record: dict[str, Any], selection: str) -> bool:
    if selection == "all":
        return True
    if record["source_key"] == "plos":
        return record["article_type"].strip().lower() in RESEARCH_TYPES
    # PubMed's type list is intentionally strict: generic Journal Article is not research proof.
    return any(value.strip().lower() in RESEARCH_TYPES for value in record["article_type"].split("|"))


def stage_values(record: dict[str, Any], as_of: date) -> dict[str, int | None]:
    received = record["received_date"]
    accepted = record["accepted_date"]
    published = record["publication_date"]
    values: dict[str, int | None] = {stage: None for stage in STAGES}
    acceptance_valid = False

    if received is not None and accepted is not None and received <= as_of and accepted <= as_of:
        interval = (accepted - received).days
        if 1 <= interval <= 1000:
            values["acceptance"] = interval
            acceptance_valid = True

    if acceptance_valid and received is not None and accepted is not None:
        usable_revisions = [value for value in record["revised_dates"] if received <= value <= accepted]
        if usable_revisions:
            values["first_revision"] = (min(usable_revisions) - received).days
            values["last_revision"] = (accepted - max(usable_revisions)).days

    if record["publication_date_source"] == "ArticleDate:Electronic" and published is not None and accepted is not None and published <= as_of and accepted <= as_of:
        interval = (published - accepted).days
        if 0 <= interval <= 1000:
            values["publication"] = interval
    return values


def is_future(record: dict[str, Any], as_of: date) -> bool:
    return any(value is not None and value > as_of for value in (record["received_date"], record["accepted_date"]))


def month_start_offset(as_of: date, months: int) -> date:
    cutoff = as_of + timedelta(days=1)
    absolute_month = cutoff.year * 12 + cutoff.month - 1 - months
    year, zero_month = divmod(absolute_month, 12)
    month = zero_month + 1
    return date(year, month, min(cutoff.day, monthrange(year, month)[1]))


def build_scope(
    records: list[dict[str, Any]],
    source: str,
    window: str,
    article_type: str,
    as_of: date,
    pubmed_start: date,
    pubmed_end: date,
) -> dict[str, Any]:
    source_records = [row for row in records if row["source_key"] == source]
    if source == "pubmed_biomed":
        start, end, basis = pubmed_start, pubmed_end, "publication_date"
        selected = [row for row in source_records if row["cohort_date"] is not None
                    and start <= row["cohort_date"] <= end and not is_future(row, as_of)
                    and valid_article_type(row, article_type)]
    else:
        basis = "accepted_date"
        accepted_cohort = [row for row in source_records if row["accepted_date"] is not None
                           and row["accepted_date"] <= as_of and not is_future(row, as_of)
                           and valid_article_type(row, article_type)]
        if window == "all":
            start = min((row["accepted_date"] for row in accepted_cohort), default=None)
        else:
            months = int(window[:-1])
            start = month_start_offset(as_of, months)
        end = as_of
        selected = [row for row in accepted_cohort if start is not None and row["accepted_date"] >= start]

    journal_meta: dict[str, dict[str, str | None]] = {}
    if source == "plos":
        journal_meta["plos:plosone"] = {"issn": "", "url": "/journals/plos-one-review-time"}
    else:
        for row in source_records:
            journal_meta[row["journal_key"]] = {"issn": row["issn"], "url": row["url"]}

    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in selected:
        grouped[row["journal_key"]].append(row)

    all_values: dict[str, list[int]] = {stage: [] for stage in STAGES}
    monthly_values: dict[str, dict[str, list[int]]] = defaultdict(lambda: {stage: [] for stage in STAGES})
    per_journal: dict[str, dict[str, list[int]]] = defaultdict(lambda: {stage: [] for stage in STAGES})
    for row in selected:
        values = stage_values(row, as_of)
        month = row["cohort_date"].strftime("%Y-%m")
        for stage, value in values.items():
            if value is not None:
                all_values[stage].append(value)
                monthly_values[month][stage].append(value)
                per_journal[row["journal_key"]][stage].append(value)

    if start is None:
        months: list[str] = []
    else:
        months = []
        year, month = start.year, start.month
        while (year, month) <= (end.year, end.month):
            months.append(f"{year:04d}-{month:02d}")
            month += 1
            if month == 13:
                year += 1
                month = 1

    monthly = [{"month": month, "stages": {stage: summarize(monthly_values[month][stage]) for stage in STAGES}}
               for month in months]
    journals = []
    for key, cohort in grouped.items():
        metrics = {stage: summarize(per_journal[key][stage]) for stage in STAGES}
        if all(metrics[stage]["count"] < 5 for stage in STAGES):
            continue
        journals.append({
            "key": key,
            "label": cohort[0]["journal_title"],
            "source": source,
            "url": journal_meta.get(key, {}).get("url"),
            "issn": journal_meta.get(key, {}).get("issn") or "",
            "stages": metrics,
            "latest_month": max(row["cohort_date"].strftime("%Y-%m") for row in cohort),
        })
    journals.sort(key=lambda row: (-row["stages"]["acceptance"]["count"], row["label"].casefold()))
    return {
        "window": window,
        "source": source,
        "article_type": article_type,
        "cohort_basis": basis,
        "data_as_of": (pubmed_end if source == "pubmed_biomed" else as_of).isoformat(),
        "start": start.isoformat() if start else None,
        "end": end.isoformat(),
        "cohort_rows": len(selected),
        "journal_groups": len(grouped),
        "stages": {stage: summarize(all_values[stage]) for stage in STAGES},
        "monthly": monthly,
        "journals": journals,
    }


def summarize_observed(values: list[int]) -> dict[str, int | float | None]:
    if not values:
        return {"count": 0, "median": None, "p25": None, "p75": None, "p90": None}
    return {
        "count": len(values),
        "median": round(float(statistics.median(values)), 1),
        "p25": quantile(values, 0.25),
        "p75": quantile(values, 0.75),
        "p90": quantile(values, 0.90),
    }


def build_compatibility_snapshot(
    records: list[dict[str, Any]],
    scope: dict[str, Any],
    journal_count: int,
    run_date: str,
    output_dir: Path,
) -> None:
    """Write PubMed-only aggregates for older app routes; omit article and revision detail."""
    start = date.fromisoformat(scope["start"])
    end = date.fromisoformat(scope["end"])
    selected = [
        row for row in records
        if row["source_key"] == "pubmed_biomed"
        and row["cohort_date"] is not None
        and start <= row["cohort_date"] <= end
    ]
    by_journal: dict[str, list[tuple[dict[str, Any], int]]] = defaultdict(list)
    by_month: dict[str, list[int]] = defaultdict(list)
    all_values: list[int] = []
    for row in selected:
        value = stage_values(row, end)["acceptance"]
        if value is None:
            continue
        by_journal[row["journal_key"]].append((row, value))
        by_month[row["cohort_date"].strftime("%Y-%m")].append(value)
        all_values.append(value)

    journals: list[dict[str, Any]] = []
    for journal_key, pairs in by_journal.items():
        values = [value for _, value in pairs]
        if len(values) < 5:
            continue
        sample = pairs[0][0]
        series_values: dict[str, list[int]] = defaultdict(list)
        for row, value in pairs:
            series_values[row["cohort_date"].strftime("%Y-%m")].append(value)
        series = [
            {"ym": ym, **summarize_observed(month_values)}
            for ym, month_values in sorted(series_values.items())
        ]
        by_ym = {
            item["ym"]: {key: item[key] for key in ("count", "median", "p25", "p75")}
            for item in series
        }
        stats = summarize_observed(values)
        journals.append({
            "journal_key": journal_key,
            "source_key": "pubmed_biomed",
            "source_display": "PubMed",
            "label": sample["journal_title"],
            "name": sample["journal_title"],
            "issn": sample["issn"],
            "publisher": "PubMed indexed journal",
            "subject": "Biomedical",
            "count": stats["count"],
            "median": stats["median"],
            "p25": stats["p25"],
            "p75": stats["p75"],
            "p90": stats["p90"],
            "min": min(values),
            "max": max(values),
            "timeline_coverage": round(len(values) / sum(1 for row in selected if row["journal_key"] == journal_key), 4),
            "coverage_start": min(row["cohort_date"].isoformat() for row, _ in pairs),
            "coverage_end": max(row["cohort_date"].isoformat() for row, _ in pairs),
            "latest_fetched_at": run_date,
            "latest_sample_month": max(series_values),
            "byYM": by_ym,
            "timeSeries": series,
            "trend": 0,
            "trend_eligible": False,
            "med6": stats["median"],
            "med24": None,
            "articles": [],
            "trust_label": "medium",
            "is_public": True,
            "is_indexable": False,
            "leaderboard_eligible": len(values) >= 10,
            "reliable_ranking_eligible": len(values) >= 20,
        })
    journals.sort(key=lambda row: (row["median"], -row["count"], row["label"].casefold()))

    global_series = [
        {"ym": ym, **summarize_observed(month_values)}
        for ym, month_values in sorted(by_month.items())
    ]
    global_summary = summarize_observed(all_values)
    fastest = journals[0] if journals else None
    stats = {
        "totalJournals": len(journals),
        "totalArticles": len(all_values),
        "globalMedian": global_summary["median"] or 0,
        "globalP25": global_summary["p25"] or 0,
        "globalP75": global_summary["p75"] or 0,
        "publishers": ["PubMed"],
        "subjects": ["Biomedical"],
        "globalTimeSeries": global_series,
        "fastest": fastest,
    }
    monthly_valid = sum(item["count"] for item in global_series)
    manifest = {
        "snapshot_kind": "public_aggregate",
        "month": end.strftime("%Y-%m"),
        "as_of": end.isoformat(),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_kind": "pubmed_efetch",
        "source_attribution": "PubMed, U.S. National Library of Medicine (NLM), retrieved via NCBI E-utilities EFetch",
        "source_url": "https://pubmed.ncbi.nlm.nih.gov/",
        "source_month": end.strftime("%Y-%m"),
        "raw_data_policy": {
            "raw_master_uploaded": False,
            "article_titles_uploaded": False,
            "abstracts_uploaded": False,
            "authors_uploaded": False,
            "article_level_calendar_dates_uploaded": False,
            "article_level_timeline_points_uploaded": False,
            "crawler_derived_revision_fields_uploaded": False,
            "public_outputs": "PubMed-derived journal-level timing aggregates only.",
        },
        "eligibility": {
            "min_public_samples": 5,
            "min_leaderboard_samples": 10,
            "min_reliable_samples": 20,
            "no_timeline_journals_excluded": True,
        },
        "counts": {
            "input_journal_groups": journal_count,
            "public_journals": len(journals),
            "public_sources": 1,
            "valid_timeline_rows": monthly_valid,
            "source_rows_after_dedup": len(records),
        },
        "sources": ["pubmed_biomed"],
    }

    output_dir.mkdir(parents=True, exist_ok=False)
    (output_dir / "review-data.json").write_text(json.dumps({"rows": [], "journals": journals, "stats": stats}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    (output_dir / "journals.json").write_text(json.dumps(journals, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    (output_dir / "sources.json").write_text(json.dumps([{
        "source_key": "pubmed_biomed", "source_display": "PubMed",
        "url_path": "/statistics?source=pubmed_biomed&window=6m&type=all",
        "timeline_journals": len(journals), "timeline_samples": len(all_values),
        "timeline_coverage": round(len(all_values) / max(len(selected), 1), 4),
        "is_public": True, "is_indexable": False,
    }], ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    (output_dir / "leaderboards.json").write_text(json.dumps({
        "fast_reliable": journals[:10],
        "fastest": journals[:10],
        "slowest": list(reversed(journals[-10:])),
        "most_evidence": sorted(journals, key=lambda row: row["count"], reverse=True)[:10],
        "recently_faster": [],
        "recently_slower": [],
    }, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    (output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_scope(path: Path, value: dict[str, Any]) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n", encoding="utf-8")


def build(args: argparse.Namespace) -> str:
    pubmed_records, pubmed_manifest, pubmed_audit = normalize_pubmed(args.pubmed_run_dir, args.pubmed_journals)
    pubmed_start = date.fromisoformat(pubmed_manifest["pubmed"]["query_date_start_inclusive"])
    pubmed_end = date.fromisoformat(pubmed_manifest["pubmed"]["query_date_end_inclusive"])

    COMBINED_DIR.mkdir(parents=True, exist_ok=True)
    database_build_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    combined_temp = COMBINED_DIR / f".{database_build_id}.tmp.sqlite"
    for row in pubmed_records:
        row["timeline_status"] = classify_timeline_status(row, pubmed_end)
    combined_manifest = write_combined_database(
        combined_temp, pubmed_records, args.pubmed_run_dir / "articles.csv", pubmed_audit, pubmed_manifest,
    )
    # Calculate all published statistics from the persisted PubMed-only dataset.
    all_records = load_combined_records(combined_temp)
    pubmed_records = [row for row in all_records if row["source_key"] == "pubmed_biomed"]

    if len(pubmed_records) != pubmed_audit["quality"]["unique_pmid_n"]:
        raise ValueError("A PubMed record lacked a date needed for normalization")

    pubmed_exact = [row for row in pubmed_records if row["cohort_date"] is not None
                    and pubmed_start <= row["cohort_date"] <= pubmed_end]
    if len(pubmed_exact) != pubmed_audit["quality"]["cohort_n_after_date_validation"]:
        raise ValueError("Exact PubMed publication-date cohort does not match the quality report")
    source_valid_count = pubmed_audit["quality"]["cohort_valid_received_accepted_n"]
    common_valid_count = sum(stage_values(row, pubmed_end)["acceptance"] is not None for row in pubmed_exact)
    same_day_excluded = source_valid_count - common_valid_count
    if same_day_excluded < 0:
        raise ValueError("Common date rule produced more valid rows than PubMed quality validation")
    revision_events = sum(
        len(row["revised_dates"])
        for row in pubmed_exact
        if stage_values(row, pubmed_end)["acceptance"] is not None
    )
    if revision_events != pubmed_audit["quality"]["cohort_revision_events_n"]:
        raise ValueError("PubMed revision-event count does not match the quality report")

    stats_root = STATISTICS_DIR
    old_manifest = json.loads((stats_root / "index.json").read_text(encoding="utf-8"))

    generated = datetime.now(timezone.utc)
    version = generated.strftime("%Y%m%dT%H%M%S%fZ")
    temp_dir = stats_root / f".{version}.tmp"
    version_dir = stats_root / version
    temp_dir.mkdir(parents=True, exist_ok=False)
    try:
        pubmed_scope = build_scope(all_records, "pubmed_biomed", "6m", "all", pubmed_end, pubmed_start, pubmed_end)
        write_scope(temp_dir / "6m-pubmed_biomed-all.json", pubmed_scope)
        temp_dir.replace(version_dir)
    except Exception:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise

    sources = [
        {
            "key": "pubmed_biomed", "label": "PubMed · biomedical pilot",
            "windows": ["6m"], "article_types": ["all"],
            "default_window": "6m", "default_article_type": "all",
            "cohort_basis": "publication_date", "status": "pilot",
        },
    ]
    retired = sorted(set(old_manifest.get("retired_sources", [])) | {"plos"} | {
        item["key"] for item in old_manifest["sources"] if item["key"] != "pubmed_biomed"
    })
    manifest = {
        "version": version,
        "as_of": pubmed_end.isoformat(),
        "generated_at": generated.isoformat(),
        "minimum_samples": 5,
        "sources": sources,
        "audit": {
            "latest_fetched_at": pubmed_end.isoformat(),
            "same_day_pubmed_acceptance_excluded_by_common_rule": same_day_excluded,
            "pubmed_revision_events_in_valid_cohort": revision_events,
            "by_source": [
                {
                    "key": "pubmed_biomed", "label": "PubMed biomedical pilot", "rows": pubmed_audit["rows"],
                    "valid_acceptance_rows": common_valid_count, "status": "pilot",
                    "latest_fetched_at": pubmed_end.isoformat(),
                },
            ],
        },
        "retired_sources": retired,
        "combined_article_dataset": {
            "schema_version": combined_manifest["schema_version"],
            "article_rows": combined_manifest["article_rows"],
            "date_event_rows": combined_manifest["date_event_rows"],
            "database_sha256": combined_manifest["database_sha256"],
        },
        "cohort_basis": "publication_date",
        "publication_basis": "PubMed ArticleDate Electronic; exact day only",
        "source_attribution": "PubMed, U.S. National Library of Medicine (NLM), retrieved via NCBI E-utilities EFetch",
        "source_url": "https://pubmed.ncbi.nlm.nih.gov/",
        "crawler_revision_data_included": False,
        "cadence": "on_pipeline_run",
    }
    combined_manifest["statistics_version"] = version
    combined_manifest["source_status"] = {"pubmed_biomed": "pilot"}
    combined_temp.replace(COMBINED_DB)
    combined_manifest_temp = COMBINED_MANIFEST.with_name(f".{COMBINED_MANIFEST.name}.{version}.tmp")
    combined_manifest_temp.write_text(json.dumps(combined_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    combined_manifest_temp.replace(COMBINED_MANIFEST)

    public_data_root = ROOT / "public" / "data"
    compat_temp = public_data_root / f".current.{version}.tmp"
    build_compatibility_snapshot(
        all_records, pubmed_scope, len(pubmed_audit["journals"]), pubmed_end.isoformat(), compat_temp,
    )
    legacy_current = public_data_root / "current"
    archive_root = ROOT / "data" / "archive"
    if legacy_current.exists():
        archived_current = archive_root / "legacy-public-current" / version
        archived_current.parent.mkdir(parents=True, exist_ok=True)
        import shutil
        shutil.move(str(legacy_current), str(archived_current))
    compat_temp.replace(legacy_current)

    pointer = stats_root / "index.json"
    temp_pointer = pointer.with_suffix(".tmp")
    temp_pointer.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp_pointer.replace(pointer)

    retired_stats = archive_root / "statistics" / "retired-pubmed-transition" / version
    retired_stats.mkdir(parents=True, exist_ok=True)
    import shutil
    for item in list(stats_root.iterdir()):
        if item.is_dir() and item.name != version and re.fullmatch(r"\d{8}T\d{12}Z", item.name):
            shutil.move(str(item), str(retired_stats / item.name))
    (retired_stats.parent / "README.md").write_text(
        "# Retired pre-PubMed-only statistics\n\n"
        "These snapshots were removed from `public/data/statistics` when the active product switched to PubMed EFetch only. "
        "They include the retired PLOS crawler baseline and earlier mixed-source data. They remain local for audit and are not served by the site.\n",
        encoding="utf-8",
    )
    return version


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pubmed-run-dir", type=Path, default=DEFAULT_PUBMED_RUN)
    parser.add_argument("--pubmed-journals", type=Path, default=DEFAULT_PUBMED_JOURNALS)
    args = parser.parse_args()
    print(json.dumps({"version": build(args)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
