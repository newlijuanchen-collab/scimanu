from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parent
XLSX_PATH = ROOT / "data.xlsx"
OUT_DIR = ROOT / "data"

MIN_DAYS = 1
MAX_DAYS = 1000


def parse_date(value: Any) -> str | None:
    if value in (None, ""):
        return None
    if hasattr(value, "strftime"):
        return value.strftime("%Y-%m-%d")
    text = str(value).strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return text[:10]


def percentile(sorted_values: list[float], p: float) -> float:
    if not sorted_values:
        return 0.0
    if len(sorted_values) == 1:
        return float(sorted_values[0])
    idx = (p / 100.0) * (len(sorted_values) - 1)
    lo = int(idx)
    hi = min(lo + 1, len(sorted_values) - 1)
    frac = idx - lo
    return float(sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * frac)


def median(sorted_values: list[float]) -> float:
    return percentile(sorted_values, 50)


def round_num(value: float | None) -> int | None:
    if value is None:
        return None
    return int(round(value))


def slugify(text: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return base or "journal"


def build_unique_slugs(keys: list[str]) -> dict[str, str]:
    used: set[str] = set()
    mapping: dict[str, str] = {}
    for key in keys:
        base = slugify(key)
        slug = base
        n = 2
        while slug in used:
            slug = f"{base}-{n}"
            n += 1
        used.add(slug)
        mapping[key] = slug
    return mapping


def load_rows() -> list[dict[str, Any]]:
    wb = load_workbook(XLSX_PATH, read_only=True, data_only=True)
    ws = wb.active
    rows = ws.iter_rows(values_only=True)
    headers = [str(h) if h is not None else "" for h in next(rows)]
    records: list[dict[str, Any]] = []
    for row in rows:
        record = {headers[i]: row[i] for i in range(len(headers))}
        records.append(record)
    return records


def clean_rows(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    for r in records:
        journal_name = str(r.get("journal_name") or "").strip()
        journal_label = str(r.get("journal_label") or journal_name).strip()
        if not journal_label and not journal_name:
            continue

        status = str(r.get("extraction_status") or "ok").strip()
        days_val = r.get("days_received_to_accepted")
        try:
            days = int(float(days_val))
        except (TypeError, ValueError):
            continue
        if days < MIN_DAYS or days > MAX_DAYS:
            continue

        accepted_date = parse_date(r.get("accepted_date"))
        received_date = parse_date(r.get("received_date"))
        if not accepted_date or not received_date:
            continue

        revised_last = parse_date(r.get("revised_last_date"))
        revised_dates_raw = r.get("revised_dates")
        revision_count = 0
        if revised_dates_raw not in (None, ""):
            if isinstance(revised_dates_raw, str):
                revision_count = revised_dates_raw.count("-") or revised_dates_raw.count(",") + 1
            else:
                revision_count = 1

        rev_days_val = r.get("days_revised_last_to_accepted")
        try:
            rev_days = int(float(rev_days_val)) if rev_days_val not in (None, "") else None
        except (TypeError, ValueError):
            rev_days = None

        cleaned.append(
            {
                "journal_key": journal_label or journal_name,
                "journal_name": journal_name or journal_label,
                "journal_label": journal_label or journal_name,
                "issn": str(r.get("issn") or "").strip().replace(" ", ""),
                "publisher": str(r.get("publisher") or "Unknown").strip() or "Unknown",
                "subject": str(r.get("subject") or "Unknown").strip() or "Unknown",
                "title": str(r.get("title") or "").strip(),
                "doi": str(r.get("doi") or "").strip().lower(),
                "source_channel": str(r.get("source_channel") or "").strip(),
                "source_url": str(r.get("source_url") or "").strip(),
                "extraction_status": status,
                "confidence_score": float(r.get("confidence_score") or 0),
                "received_date": received_date,
                "revised_last_date": revised_last,
                "accepted_date": accepted_date,
                "publication_date": parse_date(r.get("publication_date")),
                "updated_at": str(r.get("updated_at") or "").strip(),
                "days": days,
                "days_revised_last_to_accepted": rev_days,
                "revision_count": revision_count,
                "has_revision": revision_count > 0 and revised_last is not None,
                "ym": accepted_date[:7],
            }
        )

    return cleaned


def build_outputs(rows: list[dict[str, Any]]) -> dict[str, Any]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[row["journal_key"]].append(row)

    slug_map = build_unique_slugs(sorted(grouped.keys()))
    generated_at = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    journals_out: list[dict[str, Any]] = []
    journal_trend: dict[str, list[dict[str, Any]]] = {}
    publisher_map: dict[str, list[dict[str, Any]]] = defaultdict(list)
    subject_map: dict[str, list[dict[str, Any]]] = defaultdict(list)
    global_by_ym: dict[str, list[int]] = defaultdict(list)

    max_accepted = max(a["accepted_date"] for a in rows)
    ref_date = datetime.fromisoformat(max_accepted)

    def cutoff(months: int) -> str:
        month_index = ref_date.month - 1 - months
        year = ref_date.year + month_index // 12
        month = month_index % 12 + 1
        return f"{year:04d}-{month:02d}-01"

    cutoff_3 = cutoff(3)
    cutoff_6 = cutoff(6)
    cutoff_12 = cutoff(12)
    cutoff_24 = cutoff(24)

    for journal_key, articles in grouped.items():
        slug = slug_map[journal_key]
        days_sorted = sorted(a["days"] for a in articles)
        rev_days = sorted(a["days_revised_last_to_accepted"] for a in articles if a["days_revised_last_to_accepted"] is not None)
        confs = sorted(a["confidence_score"] for a in articles if a["confidence_score"] is not None)
        coverage_start = min(a["accepted_date"] for a in articles)
        coverage_end = max(a["accepted_date"] for a in articles)
        publisher = articles[0]["publisher"]
        subject = articles[0]["subject"]
        source_mix_counter = Counter(a["source_channel"] or "unknown" for a in articles)

        by_ym: dict[str, list[int]] = defaultdict(list)
        for a in articles:
            by_ym[a["ym"]].append(a["days"])
            global_by_ym[a["ym"]].append(a["days"])

        time_series = []
        for ym in sorted(by_ym.keys()):
            vals = sorted(by_ym[ym])
            time_series.append(
                {
                    "ym": ym,
                    "count": len(vals),
                    "median": round_num(median(vals)),
                    "p25": round_num(percentile(vals, 25)),
                    "p75": round_num(percentile(vals, 75)),
                }
            )

        recent_3 = sorted(a["days"] for a in articles if a["accepted_date"] >= cutoff_3)
        recent_6 = sorted(a["days"] for a in articles if a["accepted_date"] >= cutoff_6)
        recent_12 = sorted(a["days"] for a in articles if a["accepted_date"] >= cutoff_12)
        recent_24 = sorted(a["days"] for a in articles if a["accepted_date"] >= cutoff_24)

        med3 = round_num(median(recent_3)) if len(recent_3) >= 3 else None
        med6 = round_num(median(recent_6)) if len(recent_6) >= 3 else None
        med12 = round_num(median(recent_12)) if len(recent_12) >= 3 else None
        med24 = round_num(median(recent_24)) if len(recent_24) >= 3 else None
        trend = (med6 - med24) if med6 is not None and med24 is not None else 0

        summary = {
            "slug": slug,
            "label": articles[0]["journal_label"],
            "name": articles[0]["journal_name"],
            "issn": articles[0]["issn"],
            "publisher": publisher,
            "subject": subject,
            "count": len(days_sorted),
            "median": round_num(median(days_sorted)),
            "p25": round_num(percentile(days_sorted, 25)),
            "p75": round_num(percentile(days_sorted, 75)),
            "iqr": round_num(percentile(days_sorted, 75) - percentile(days_sorted, 25)),
            "min": round_num(days_sorted[0]),
            "max": round_num(days_sorted[-1]),
            "med3": med3,
            "med6": med6,
            "med12": med12,
            "med24": med24,
            "trend": trend,
            "revisionShare": round(sum(1 for a in articles if a["has_revision"]) / len(articles), 4),
            "medianRevToAccept": round_num(median(rev_days)) if rev_days else None,
            "coverageStart": coverage_start,
            "coverageEnd": coverage_end,
            "confidenceMedian": round(float(median(confs)), 3) if confs else None,
            "sourceMix": dict(source_mix_counter),
            "generatedAt": generated_at,
        }

        journals_out.append(summary)
        journal_trend[slug] = time_series
        publisher_map[publisher].append(summary)
        subject_map[subject].append(summary)

    journals_out.sort(key=lambda j: (j["median"], -j["count"], j["label"]))

    global_days = sorted(a["days"] for a in rows)
    global_trend = []
    for ym in sorted(global_by_ym.keys()):
        vals = sorted(global_by_ym[ym])
        global_trend.append(
            {
                "ym": ym,
                "count": len(vals),
                "median": round_num(median(vals)),
                "p25": round_num(percentile(vals, 25)),
                "p75": round_num(percentile(vals, 75)),
            }
        )

    publisher_stats = []
    for publisher, items in sorted(publisher_map.items()):
        medians = sorted(j["median"] for j in items if j["median"] is not None)
        publisher_stats.append(
            {
                "publisher": publisher,
                "journalCount": len(items),
                "articleCount": sum(j["count"] for j in items),
                "medianOfMedians": round_num(median(medians)) if medians else None,
            }
        )

    subject_stats = []
    for subject, items in sorted(subject_map.items()):
        medians = sorted(j["median"] for j in items if j["median"] is not None)
        subject_stats.append(
            {
                "subject": subject,
                "journalCount": len(items),
                "articleCount": sum(j["count"] for j in items),
                "medianOfMedians": round_num(median(medians)) if medians else None,
            }
        )

    summary = {
        "generatedAt": generated_at,
        "totalJournals": len(journals_out),
        "totalArticles": len(rows),
        "globalMedian": round_num(median(global_days)),
        "globalP25": round_num(percentile(global_days, 25)),
        "globalP75": round_num(percentile(global_days, 75)),
        "fastestSlug": journals_out[0]["slug"] if journals_out else None,
        "fastestJournal": journals_out[0]["label"] if journals_out else None,
        "publishers": sorted({j["publisher"] for j in journals_out if j["publisher"]}),
        "subjects": sorted({j["subject"] for j in journals_out if j["subject"]}),
    }

    return {
        "global_summary": summary,
        "global_trend": global_trend,
        "journals": journals_out,
        "journal_trend": journal_trend,
        "publisher_stats": publisher_stats,
        "subject_stats": subject_stats,
    }


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main() -> None:
    if not XLSX_PATH.exists():
        raise SystemExit(f"Missing input file: {XLSX_PATH}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    rows = clean_rows(load_rows())
    outputs = build_outputs(rows)

    write_json(OUT_DIR / "global-summary.json", outputs["global_summary"])
    write_json(OUT_DIR / "global-trend.json", outputs["global_trend"])
    write_json(OUT_DIR / "journals.json", outputs["journals"])
    write_json(OUT_DIR / "journal-trend.json", outputs["journal_trend"])
    write_json(OUT_DIR / "publisher-stats.json", outputs["publisher_stats"])
    write_json(OUT_DIR / "subject-stats.json", outputs["subject_stats"])

    print(f"Generated static data in {OUT_DIR}")
    print(f"Journals: {outputs['global_summary']['totalJournals']}")
    print(f"Articles: {outputs['global_summary']['totalArticles']}")


if __name__ == "__main__":
    main()
