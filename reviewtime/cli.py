from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path
from typing import Dict, List, Optional

from .aggregate import aggregate_by_journal
from .aggregate import aggregate_with_trends
from .crossref import fetch_works_for_issn
from .input_prep import prepare_journal_seed_csv
from .manual_patch import load_patches_from_dir
from .metrics import compute_durations
from .parser import parse_events
from .pipeline import build_articles_db_for_issns
from .schema import normalize_article_record, validate_article_record
from .storage import init_sqlite, summarize_ingestion, upsert_articles, write_jsonl


def _load_jsonl(path: Path) -> List[Dict]:
    rows: List[Dict] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def _to_date_or_none(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    return date.fromisoformat(s)


def _write_jsonl(path: Path, rows: List[Dict]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def _write_json(path: Path, obj: Dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def _load_issn_list(path: Path) -> List[Dict[str, str]]:
    rows = _load_jsonl(path)
    out = []
    for r in rows:
        issn = (r.get("issn") or "").strip()
        if not issn:
            continue
        out.append({
            "issn": issn,
            "label": r.get("label") or issn,
        })
    return out


def analyze(input_path: Path, output_dir: Path, as_of: date, window_months: int) -> None:
    raw_rows = _load_jsonl(input_path)
    processed = []

    for row in raw_rows:
        text = row.get("text", "")
        parsed = parse_events(text)

        events_date = {
            "received": parsed.received,
            "revised": parsed.revised,
            "accepted": parsed.accepted,
            "available_online": parsed.available_online,
            "version_of_record": parsed.version_of_record,
        }
        durations = compute_durations(events_date)

        processed_row = {
            "article_id": row.get("article_id"),
            "journal": row.get("journal", "unknown"),
            "events": parsed.to_dict(),
            "durations": durations,
        }
        processed.append(processed_row)

    # convert event strings -> date for aggregation
    agg_input = []
    for p in processed:
        event_dates = {k: _to_date_or_none(v) for k, v in p["events"].items()}
        agg_input.append({
            "journal": p["journal"],
            "events": event_dates,
            "durations": p["durations"],
        })

    stats = aggregate_by_journal(agg_input, as_of=as_of, window_months=window_months)
    trend_stats = aggregate_with_trends(
        agg_input,
        as_of=as_of,
        primary_window_months=window_months,
        trend_window_months=6,
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    _write_jsonl(output_dir / "extracted_articles.jsonl", processed)
    with (output_dir / "journal_stats.json").open("w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    with (output_dir / "journal_trends.json").open("w", encoding="utf-8") as f:
        json.dump(trend_stats, f, ensure_ascii=False, indent=2)


def fetch_crossref(
    journals_path: Path,
    output_path: Path,
    from_pub_date: str,
    until_pub_date: str,
    rows_per_journal: int,
    mailto: Optional[str] = None,
) -> None:
    journal_list = _load_issn_list(journals_path)
    all_rows: List[Dict] = []

    for item in journal_list:
        works = fetch_works_for_issn(
            issn=item["issn"],
            from_pub_date=from_pub_date,
            until_pub_date=until_pub_date,
            rows=rows_per_journal,
            mailto=mailto,
        )
        for w in works:
            all_rows.append({
                "source": "crossref",
                "journal_label": item["label"],
                **w,
            })

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(all_rows, f, ensure_ascii=False, indent=2)


def _build_leaderboard_from_articles(rows: List[Dict]) -> Dict:
    by_journal: Dict[str, List[int]] = {}
    for r in rows:
        j = r.get("journal_name") or r.get("journal") or r.get("journal_label") or "unknown"
        d = r.get("days_received_to_accepted")
        if d is None:
            continue
        by_journal.setdefault(j, []).append(d)

    def _median(vals: List[int]) -> Optional[float]:
        if not vals:
            return None
        vals = sorted(vals)
        n = len(vals)
        if n % 2 == 1:
            return float(vals[n // 2])
        return float(vals[n // 2 - 1] + vals[n // 2]) / 2.0

    out = {"journals": {}}
    for j, vals in by_journal.items():
        out["journals"][j] = {
            "sample_size": len(vals),
            "median_days_received_to_accepted": _median(vals),
            "min": min(vals),
            "max": max(vals),
        }
    return out


def ingest_manual(
    input_dir: Path,
    output_articles: Path,
    output_sqlite: Path,
    no_overwrite_ok: bool = False,
) -> None:
    """Parse manual patch .txt files and upsert into the master DB."""
    raw_patches = load_patches_from_dir(input_dir)
    if not raw_patches:
        print(f"[ingest-manual] No article blocks found in {input_dir}")
        return

    # Load existing records from JSONL so we can honour no_overwrite_ok
    existing: Dict[str, Dict] = {}
    if output_articles.exists():
        for rec in _load_jsonl(output_articles):
            k = rec.get("dedup_key")
            if k:
                existing[k] = rec

    deduped: Dict[str, Dict] = dict(existing)  # start with everything already in DB
    invalid_rows: List[Dict] = []
    new_count = 0
    skip_count = 0

    for raw in raw_patches:
        rec = normalize_article_record(raw)
        ok, errs = validate_article_record(rec)
        if not ok:
            invalid_rows.append({"record": rec, "errors": errs})
            continue
        key = rec["dedup_key"]
        existing_rec = existing.get(key)
        if no_overwrite_ok and existing_rec and existing_rec.get("extraction_status") == "ok":
            skip_count += 1
            continue
        deduped[key] = rec
        new_count += 1

    master_rows = list(deduped.values())

    output_articles.parent.mkdir(parents=True, exist_ok=True)
    write_jsonl(output_articles, master_rows)

    conn = init_sqlite(output_sqlite)
    try:
        upsert_articles(conn, master_rows)
    finally:
        conn.close()

    print(
        f"[ingest-manual] parsed={len(raw_patches)}  "
        f"new/updated={new_count}  skipped={skip_count}  "
        f"invalid={len(invalid_rows)}  total_in_db={len(master_rows)}"
    )
    if invalid_rows:
        print("[ingest-manual] invalid examples:", json.dumps(invalid_rows[:3], ensure_ascii=False, indent=2))


def build_db(
    journals_path: Path,
    output_articles: Path,
    output_sqlite: Path,
    output_report: Path,
    output_schema: Path,
    output_leaderboard: Path,
    from_pub_date: str,
    until_pub_date: str,
    retmax_per_journal: int,
    skip_mdpi_fallback: bool = False,
    output_missing_journals: Optional[Path] = None,
) -> None:
    journal_list = _load_issn_list(journals_path)
    rows = build_articles_db_for_issns(
        issns=journal_list,
        from_pub_date=from_pub_date,
        until_pub_date=until_pub_date,
        retmax_per_journal=retmax_per_journal,
        skip_mdpi_fallback=skip_mdpi_fallback,
    )

    deduped: Dict[str, Dict] = {}
    invalid_rows: List[Dict] = []
    for raw in rows:
        rec = normalize_article_record(raw)
        ok, errs = validate_article_record(rec)
        if not ok:
            invalid_rows.append({"record": rec, "errors": errs})
            continue
        deduped[rec["dedup_key"]] = rec

    master_rows = list(deduped.values())

    output_articles.parent.mkdir(parents=True, exist_ok=True)
    write_jsonl(output_articles, master_rows)

    conn = init_sqlite(output_sqlite)
    try:
        upsert_articles(conn, master_rows)
    finally:
        conn.close()

    report = summarize_ingestion(master_rows, invalid_rows)
    _write_json(output_report, report)

    schema = {
        "table": "articles_master",
        "description": "Article-level master dataset for any downstream analytics",
        "key_fields": ["item_id", "dedup_key", "pmid", "pmcid", "doi"],
        "time_fields": [
            "publication_date",
            "received_date",
            "revised_first_date",
            "revised_last_date",
            "accepted_date",
            "collection_date",
            "online_date",
        ],
        "metric_fields": ["days_received_to_accepted", "days_revised_last_to_accepted"],
        "quality_fields": [
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
        ],
    }
    _write_json(output_schema, schema)

    leaderboard = _build_leaderboard_from_articles(master_rows)
    _write_json(output_leaderboard, leaderboard)

    # Identify journals that got zero ok articles (manual patch candidates)
    if output_missing_journals is not None:
        issns_with_ok: set = set()
        for r in master_rows:
            if r.get("extraction_status") == "ok":
                issn_val = r.get("issn") or ""
                if issn_val:
                    issns_with_ok.add(issn_val)
        missing = [j for j in journal_list if j["issn"] not in issns_with_ok]
        output_missing_journals.parent.mkdir(parents=True, exist_ok=True)
        with output_missing_journals.open("w", encoding="utf-8") as f:
            f.write("issn,label\n")
            for j in missing:
                f.write(f"{j['issn']},{j.get('label','')}\n")
        print(
            f"[build-db] missing-journals (0 ok articles): {len(missing)} → {output_missing_journals}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Journal review time extractor MVP")
    sub = parser.add_subparsers(dest="command", required=True)

    p_analyze = sub.add_parser("analyze", help="Extract events and aggregate by journal")
    p_analyze.add_argument("--input", required=True, help="Input JSONL file path")
    p_analyze.add_argument("--output-dir", required=True, help="Output directory")
    p_analyze.add_argument("--as-of", required=True, help="As-of date, e.g. 2026-05-01")
    p_analyze.add_argument("--window-months", type=int, default=24, help="Rolling window months")

    p_fetch = sub.add_parser("fetch-crossref", help="Fetch article metadata from Crossref by ISSN list")
    p_fetch.add_argument("--journals", required=True, help="Journal ISSN list JSONL path")
    p_fetch.add_argument("--output", required=True, help="Output JSON path")
    p_fetch.add_argument("--from-pub-date", required=True, help="Start pub date, e.g. 2024-01-01")
    p_fetch.add_argument("--until-pub-date", required=True, help="End pub date, e.g. 2026-04-30")
    p_fetch.add_argument("--rows-per-journal", type=int, default=50, help="Max rows per ISSN")
    p_fetch.add_argument("--mailto", default=None, help="Contact email for polite pool")

    p_prepare = sub.add_parser("prepare-input", help="Validate/normalize journals_seed.csv")
    p_prepare.add_argument("--input-csv", required=True, help="Input journals_seed CSV")
    p_prepare.add_argument("--output-jsonl", required=True, help="Output normalized JSONL")
    p_prepare.add_argument("--output-report", required=True, help="Output validation report JSON")

    p_db = sub.add_parser("build-db", help="Build article-level DB via PubMed/PMC (PMC-first)")
    p_db.add_argument(
        "--journals",
        default="out/journals_normalized.jsonl",
        help=(
            "Journal list JSONL path (default: out/journals_normalized.jsonl). "
            "Compatible with both normalized input and legacy journals_issn JSONL"
        ),
    )
    p_db.add_argument("--output-articles", required=True, help="Output JSONL path for articles_master")
    p_db.add_argument("--output-sqlite", required=True, help="Output SQLite DB path")
    p_db.add_argument("--output-report", required=True, help="Output ingestion report JSON path")
    p_db.add_argument("--output-schema", required=True, help="Output schema JSON path")
    p_db.add_argument("--output-leaderboard", required=True, help="Output JSON path for leaderboard")
    p_db.add_argument("--from-pub-date", required=True, help="Start pub date, e.g. 2024-01-01")
    p_db.add_argument("--until-pub-date", required=True, help="End pub date, e.g. 2026-04-30")
    p_db.add_argument("--retmax-per-journal", type=int, default=100, help="Max PubMed IDs per journal")
    p_db.add_argument(
        "--skip-mdpi-page-fallback",
        action="store_true",
        default=False,
        help=(
            "Skip MDPI article-page HTTP fallback (recommended for large batch runs: "
            "MDPI pages return 403 and wasting time on retries)"
        ),
    )
    p_db.add_argument(
        "--output-missing-journals",
        default=None,
        help="Output path for journals with zero ok articles (CSV, for manual patch follow-up)",
    )

    p_manual = sub.add_parser(
        "ingest-manual",
        help="Parse free-text article snippets from a folder and upsert into the master DB",
    )
    p_manual.add_argument(
        "--input-dir",
        default="data/manual_patches",
        help="Directory containing .txt patch files (default: data/manual_patches)",
    )
    p_manual.add_argument("--output-articles", required=True, help="Output JSONL path for articles_master")
    p_manual.add_argument("--output-sqlite", required=True, help="Output SQLite DB path")
    p_manual.add_argument(
        "--no-overwrite-ok",
        action="store_true",
        default=False,
        help="Skip records that already have extraction_status=ok in the DB",
    )

    args = parser.parse_args()

    if args.command == "analyze":
        analyze(
            input_path=Path(args.input),
            output_dir=Path(args.output_dir),
            as_of=date.fromisoformat(args.as_of),
            window_months=args.window_months,
        )
    elif args.command == "fetch-crossref":
        fetch_crossref(
            journals_path=Path(args.journals),
            output_path=Path(args.output),
            from_pub_date=args.from_pub_date,
            until_pub_date=args.until_pub_date,
            rows_per_journal=args.rows_per_journal,
            mailto=args.mailto,
        )
    elif args.command == "prepare-input":
        prepare_journal_seed_csv(
            input_csv=Path(args.input_csv),
            output_jsonl=Path(args.output_jsonl),
            output_report=Path(args.output_report),
        )
    elif args.command == "build-db":
        build_db(
            journals_path=Path(args.journals),
            output_articles=Path(args.output_articles),
            output_sqlite=Path(args.output_sqlite),
            output_report=Path(args.output_report),
            output_schema=Path(args.output_schema),
            output_leaderboard=Path(args.output_leaderboard),
            from_pub_date=args.from_pub_date,
            until_pub_date=args.until_pub_date,
            retmax_per_journal=args.retmax_per_journal,
            skip_mdpi_fallback=args.skip_mdpi_page_fallback,
            output_missing_journals=Path(args.output_missing_journals) if args.output_missing_journals else None,
        )
    elif args.command == "ingest-manual":
        ingest_manual(
            input_dir=Path(args.input_dir),
            output_articles=Path(args.output_articles),
            output_sqlite=Path(args.output_sqlite),
            no_overwrite_ok=args.no_overwrite_ok,
        )


if __name__ == "__main__":
    main()
