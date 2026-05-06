from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple


REQUIRED_COLUMNS = [
    "journal_id",
    "journal_name",
    "issn_print",
    "issn_online",
    "publisher",
    "subject",
    "active",
]


def _normalize_issn(raw: str) -> str:
    s = (raw or "").strip().upper()
    s = re.sub(r"[^0-9X]", "", s)
    if len(s) == 8:
        return f"{s[:4]}-{s[4:]}"
    return ""


def _is_active(v: str) -> bool:
    return str(v).strip().lower() in {"1", "true", "yes", "y"}


def _pick_primary_issn(issn_print: str, issn_online: str) -> str:
    return issn_online or issn_print


def prepare_journal_seed_csv(input_csv: Path, output_jsonl: Path, output_report: Path) -> Dict:
    rows: List[Dict] = []
    errors: List[Dict] = []

    with input_csv.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames or []

        missing_cols = [c for c in REQUIRED_COLUMNS if c not in columns]
        if missing_cols:
            raise ValueError(f"missing required columns: {missing_cols}")

        for idx, raw in enumerate(reader, start=2):
            journal_id = (raw.get("journal_id") or "").strip()
            journal_name = (raw.get("journal_name") or "").strip()
            issn_print = _normalize_issn(raw.get("issn_print") or "")
            issn_online = _normalize_issn(raw.get("issn_online") or "")
            publisher = (raw.get("publisher") or "").strip()
            subject = (raw.get("subject") or "").strip()
            active = _is_active(raw.get("active") or "")

            row_errors: List[str] = []
            if not journal_id:
                row_errors.append("missing_journal_id")
            if not journal_name:
                row_errors.append("missing_journal_name")
            if not (issn_print or issn_online):
                row_errors.append("missing_both_issn")

            primary_issn = _pick_primary_issn(issn_print, issn_online)

            if row_errors:
                errors.append({
                    "line": idx,
                    "journal_id": journal_id,
                    "errors": row_errors,
                })
                continue

            rows.append({
                "journal_id": journal_id,
                "journal_name": journal_name,
                "label": journal_name,
                "issn": primary_issn,
                "issn_print": issn_print or None,
                "issn_online": issn_online or None,
                "publisher": publisher or None,
                "subject": subject or None,
                "active": active,
                "source": "journals_seed_csv",
            })

    # dedup by primary ISSN + active only
    deduped: Dict[str, Dict] = {}
    for r in rows:
        if not r.get("active"):
            continue
        deduped[r["issn"]] = r
    normalized = list(deduped.values())

    output_jsonl.parent.mkdir(parents=True, exist_ok=True)
    with output_jsonl.open("w", encoding="utf-8") as f:
        for r in normalized:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    report = {
        "input_file": str(input_csv),
        "total_rows": len(rows) + len(errors),
        "valid_rows": len(rows),
        "active_rows": sum(1 for r in rows if r.get("active")),
        "normalized_unique_issn": len(normalized),
        "invalid_rows": len(errors),
        "invalid_examples": errors[:20],
    }

    output_report.parent.mkdir(parents=True, exist_ok=True)
    with output_report.open("w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    return report
