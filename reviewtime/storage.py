from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Dict, Iterable, List


ARTICLE_COLUMNS = [
    "item_id",
    "dedup_key",
    "pmid",
    "pmcid",
    "doi",
    "title",
    "journal_name",
    "journal_label",
    "issn",
    "publisher",
    "subject",
    "article_type",
    "publication_types",
    "publication_date",
    "received_date",
    "revised_dates",
    "revised_first_date",
    "revised_last_date",
    "accepted_date",
    "collection_date",
    "online_date",
    "days_received_to_accepted",
    "days_revised_last_to_accepted",
    "source_channel",
    "source_url",
    "extraction_status",
    "error_code",
    "retry_count",
    "confidence_score",
    "parse_method",
    "parser_version",
    "fetched_at",
    "updated_at",
]


def write_jsonl(path: Path, rows: Iterable[Dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def init_sqlite(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS articles_master (
            item_id TEXT PRIMARY KEY,
            dedup_key TEXT UNIQUE,
            pmid TEXT,
            pmcid TEXT,
            doi TEXT,
            title TEXT,
            journal_name TEXT,
            journal_label TEXT,
            issn TEXT,
            publisher TEXT,
            subject TEXT,
            article_type TEXT,
            publication_types TEXT,
            publication_date TEXT,
            received_date TEXT,
            revised_dates TEXT,
            revised_first_date TEXT,
            revised_last_date TEXT,
            accepted_date TEXT,
            collection_date TEXT,
            online_date TEXT,
            days_received_to_accepted INTEGER,
            days_revised_last_to_accepted INTEGER,
            source_channel TEXT,
            source_url TEXT,
            extraction_status TEXT,
            error_code TEXT,
            retry_count INTEGER,
            confidence_score REAL,
            parse_method TEXT,
            parser_version TEXT,
            fetched_at TEXT,
            updated_at TEXT
        )
        """
    )
    cur.execute("CREATE INDEX IF NOT EXISTS idx_articles_journal ON articles_master(journal_name)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_articles_dates ON articles_master(received_date, accepted_date)")
    conn.commit()
    return conn


def upsert_articles(conn: sqlite3.Connection, rows: List[Dict]) -> None:
    cur = conn.cursor()
    placeholders = ",".join(["?"] * len(ARTICLE_COLUMNS))
    sql = f"""
    INSERT INTO articles_master ({','.join(ARTICLE_COLUMNS)})
    VALUES ({placeholders})
    ON CONFLICT(item_id) DO UPDATE SET
        dedup_key=excluded.dedup_key,
        pmid=excluded.pmid,
        pmcid=excluded.pmcid,
        doi=excluded.doi,
        title=excluded.title,
        journal_name=excluded.journal_name,
        journal_label=excluded.journal_label,
        issn=excluded.issn,
        publisher=excluded.publisher,
        subject=excluded.subject,
        article_type=excluded.article_type,
        publication_types=excluded.publication_types,
        publication_date=excluded.publication_date,
        received_date=excluded.received_date,
        revised_dates=excluded.revised_dates,
        revised_first_date=excluded.revised_first_date,
        revised_last_date=excluded.revised_last_date,
        accepted_date=excluded.accepted_date,
        collection_date=excluded.collection_date,
        online_date=excluded.online_date,
        days_received_to_accepted=excluded.days_received_to_accepted,
        days_revised_last_to_accepted=excluded.days_revised_last_to_accepted,
        source_channel=excluded.source_channel,
        source_url=excluded.source_url,
        extraction_status=excluded.extraction_status,
        error_code=excluded.error_code,
        retry_count=excluded.retry_count,
        confidence_score=excluded.confidence_score,
        parse_method=excluded.parse_method,
        parser_version=excluded.parser_version,
        fetched_at=excluded.fetched_at,
        updated_at=excluded.updated_at
    """

    values = []
    for r in rows:
        rr = dict(r)
        rr["publication_types"] = json.dumps(rr.get("publication_types") or [], ensure_ascii=False)
        rr["revised_dates"] = json.dumps(rr.get("revised_dates") or [], ensure_ascii=False)
        values.append(tuple(rr.get(c) for c in ARTICLE_COLUMNS))

    cur.executemany(sql, values)
    conn.commit()


def summarize_ingestion(rows: List[Dict], invalid_rows: List[Dict]) -> Dict:
    total = len(rows) + len(invalid_rows)
    ok = len(rows)
    invalid = len(invalid_rows)

    by_status: Dict[str, int] = {}
    by_source: Dict[str, int] = {}
    for r in rows:
        s = r.get("extraction_status") or "unknown"
        by_status[s] = by_status.get(s, 0) + 1
        src = r.get("source_channel") or "unknown"
        by_source[src] = by_source.get(src, 0) + 1

    have_r2a = sum(1 for r in rows if r.get("days_received_to_accepted") is not None)

    return {
        "total_input": total,
        "valid_records": ok,
        "invalid_records": invalid,
        "coverage_days_received_to_accepted": (have_r2a / ok) if ok else 0,
        "by_extraction_status": by_status,
        "by_source_channel": by_source,
        "invalid_examples": invalid_rows[:10],
    }
