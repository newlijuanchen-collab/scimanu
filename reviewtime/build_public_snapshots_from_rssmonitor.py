#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import shutil
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import pandas as pd


MIN_DAYS = 1
MAX_DAYS = 1000
DEFAULT_MIN_PUBLIC_SAMPLES = 3
DEFAULT_MIN_LEADERBOARD_SAMPLES = 10
DEFAULT_MIN_RELIABLE_SAMPLES = 20
DEFAULT_MIN_PERIOD_SAMPLES = 5
DEFAULT_MIN_PATH_SAMPLES = 5


def _read_csv(path: Path) -> pd.DataFrame:
    return pd.read_csv(path, encoding="utf-8-sig", low_memory=False).fillna("")


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _norm_key(value: str) -> str:
    return re.sub(r"\s+", " ", _clean_str(value).lower()).strip()


def _load_issn_map(paths: List[Path]) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for path in paths:
        if not path.exists():
            continue
        if path.suffix.lower() == ".csv":
            df = pd.read_csv(path, encoding="utf-8-sig", low_memory=False).fillna("")
            for _, row in df.iterrows():
                label = _clean_str(row.get("journal_name") or row.get("label") or row.get("journal_title"))
                issns = [
                    _clean_str(row.get("issn")),
                    _clean_str(row.get("issn_print")),
                    _clean_str(row.get("issn_online")),
                ]
                joined = " / ".join([x for x in issns if x])
                if label and joined:
                    out.setdefault(_norm_key(label), joined)
        elif path.suffix.lower() in {".jsonl", ".ndjson"}:
            with path.open("r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    try:
                        row = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    label = _clean_str(row.get("label") or row.get("journal_name") or row.get("journal_title"))
                    issn = _clean_str(row.get("issn") or row.get("issn_print") or row.get("issn_online"))
                    if label and issn:
                        out.setdefault(_norm_key(label), issn)
    return out


def _clean_str(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and pd.isna(value):
        return ""
    text = str(value).strip()
    return "" if text.lower() == "nan" else text


def _num(value: Any, default: Optional[float] = None) -> Optional[float]:
    if value is None or value == "":
        return default
    try:
        out = float(value)
    except (TypeError, ValueError):
        return default
    if pd.isna(out):
        return default
    return out


def _int(value: Any, default: int = 0) -> int:
    n = _num(value)
    if n is None:
        return default
    return int(round(n))


def _round_or_none(value: Any) -> Optional[int]:
    n = _num(value)
    if n is None:
        return None
    return int(round(n))


def _pct(value: Any) -> float:
    n = _num(value, 0)
    return round(float(n or 0), 4)


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", normalized.lower()).strip("-")
    return slug or "unknown"


def _json_dump(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def _to_datetime(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, errors="coerce", utc=True, format="mixed")


def _to_timestamp(value: Any) -> pd.Timestamp:
    if not _clean_str(value):
        return pd.NaT
    return pd.to_datetime(value, errors="coerce", utc=True, format="mixed")


def _first_non_empty(df: pd.DataFrame, cols: List[str]) -> pd.Series:
    out = pd.Series([""] * len(df), index=df.index, dtype="object")
    for col in cols:
        if col not in df.columns:
            continue
        cur = df[col].map(_clean_str)
        mask = (out == "") & (cur != "")
        out.loc[mask] = cur.loc[mask]
    return out


def _percentile(sorted_values: List[float], p: float) -> Optional[float]:
    if not sorted_values:
        return None
    if len(sorted_values) == 1:
        return sorted_values[0]
    idx = (len(sorted_values) - 1) * p
    lo = int(idx)
    hi = min(lo + 1, len(sorted_values) - 1)
    frac = idx - lo
    return sorted_values[lo] * (1 - frac) + sorted_values[hi] * frac


def _summarize_days(values: Iterable[Any]) -> Dict[str, Optional[int]]:
    sorted_vals = sorted(float(v) for v in values if _num(v) is not None)
    if not sorted_vals:
        return {"count": 0, "median": None, "p25": None, "p75": None, "p90": None, "min": None, "max": None}
    return {
        "count": len(sorted_vals),
        "median": _round_or_none(_percentile(sorted_vals, 0.50)),
        "p25": _round_or_none(_percentile(sorted_vals, 0.25)),
        "p75": _round_or_none(_percentile(sorted_vals, 0.75)),
        "p90": _round_or_none(_percentile(sorted_vals, 0.90)),
        "min": _round_or_none(sorted_vals[0]),
        "max": _round_or_none(sorted_vals[-1]),
    }


def _summarize_numeric(values: Iterable[Any]) -> Dict[str, Optional[int]]:
    return _summarize_days(values)


def _range_label(summary: Dict[str, Optional[int]], unit: str = "days") -> str:
    count = int(summary.get("count") or 0)
    p25 = summary.get("p25")
    p75 = summary.get("p75")
    median = summary.get("median")
    if count <= 0:
        return "—"
    if p25 is None or p75 is None:
        return f"{median} {unit}" if median is not None else "—"
    if p25 == p75:
        return f"{p25} {unit}"
    return f"{p25}-{p75} {unit}"


def _day_window_label(summary: Dict[str, Optional[int]]) -> str:
    label = _range_label(summary, "")
    if label == "—":
        return label
    return f"Day {label.strip()}"


def _period_sort_key(period: str) -> tuple[int, int]:
    match = re.match(r"^(\d{4})\s+H([12])$", period)
    if not match:
        return (0, 0)
    return (int(match.group(1)), int(match.group(2)))


def _date_tokens(value: Any) -> List[str]:
    text = _clean_str(value)
    if not text:
        return []
    patterns = [
        r"\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b",
        r"\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b",
        r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b",
        r"\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b",
    ]
    tokens: List[str] = []
    for pattern in patterns:
        tokens.extend(match.group(0) for match in re.finditer(pattern, text, flags=re.IGNORECASE))
    return tokens


def _revision_dates(row: pd.Series, received: pd.Timestamp, accepted: pd.Timestamp) -> List[pd.Timestamp]:
    candidates: List[pd.Timestamp] = []
    for col in ["revised_dates", "revised_first_date", "revised_last_date"]:
        for token in _date_tokens(row.get(col, "")):
            ts = _to_timestamp(token)
            if pd.notna(ts):
                candidates.append(ts.normalize())

    unique = sorted({ts for ts in candidates if pd.notna(ts)})
    if pd.notna(received):
        unique = [ts for ts in unique if ts >= received.normalize()]
    if pd.notna(accepted):
        unique = [ts for ts in unique if ts <= accepted.normalize()]
    return unique


def _period_half(ts: pd.Timestamp) -> str:
    half = "H1" if ts.month <= 6 else "H2"
    return f"{ts.year} {half}"


def _period_from_date_text(value: str) -> str:
    ts = _to_timestamp(value)
    if pd.isna(ts):
        return ""
    return _period_half(ts)


def _rounds_bucket(rounds: int) -> str:
    if rounds <= 0:
        return "no_revision_recorded"
    if rounds == 1:
        return "one_revision"
    if rounds == 2:
        return "two_revisions"
    return "three_plus"


def _rounds_label(bucket: str) -> str:
    return {
        "no_revision_recorded": "No revision recorded",
        "one_revision": "One recorded revision",
        "two_revisions": "Two recorded revisions",
        "three_plus": "Three or more revisions",
    }.get(bucket, bucket)


def _article_type_label(value: Any) -> str:
    text = re.sub(r"\s+", " ", _clean_str(value)).strip()
    return text or "Unspecified"


def _derive_journal_identity(master: pd.DataFrame) -> pd.DataFrame:
    work = master.copy()
    for col in ["source_key", "journal_id", "journal_title", "source_name", "feed_title", "received_date", "accepted_date"]:
        if col not in work.columns:
            work[col] = ""

    journal_title = _first_non_empty(work, ["journal_title", "source_name", "feed_title", "journal_id"])
    journal_id = _first_non_empty(work, ["journal_id", "journal_title", "source_name", "feed_title"])
    work["journal_title_final"] = journal_title
    work["journal_key"] = [
        f"{source}:{_slugify(jid or title)}"
        for source, jid, title in zip(work["source_key"].astype(str), journal_id, journal_title)
    ]
    return work


def _prepare_timeline_rows(master: pd.DataFrame, as_of: str, min_days: int, max_days: int) -> pd.DataFrame:
    work = _derive_journal_identity(master)
    for col in ["revised_dates", "revised_first_date", "revised_last_date", "article_type"]:
        if col not in work.columns:
            work[col] = ""

    as_of_ts = pd.Timestamp(as_of).tz_localize("UTC")
    received = _to_datetime(work["received_date"])
    accepted = _to_datetime(work["accepted_date"])
    days = (accepted - received).dt.total_seconds() / 86400.0

    valid = (
        days.between(min_days, max_days, inclusive="both")
        & received.notna()
        & accepted.notna()
        & (received <= as_of_ts)
        & (accepted <= as_of_ts)
    )

    out = work.loc[valid, ["source_key", "journal_key", "journal_title_final", "article_type"]].copy()
    out["article_type"] = out["article_type"].map(_article_type_label)
    out["days"] = days.loc[valid]
    out["accepted_month"] = accepted.loc[valid].dt.strftime("%Y-%m")
    out["accepted_period"] = [_period_half(ts) for ts in accepted.loc[valid]]
    out["accepted_date"] = accepted.loc[valid]

    revision_counts: List[int] = []
    first_feedback_days: List[Optional[float]] = []
    final_tail_days: List[Optional[float]] = []

    for idx, row in work.loc[valid].iterrows():
        received_ts = received.loc[idx]
        accepted_ts = accepted.loc[idx]
        revised = _revision_dates(row, received_ts, accepted_ts)
        revision_counts.append(len(revised))

        if revised and pd.notna(received_ts):
            first_feedback_days.append((revised[0] - received_ts.normalize()).days)
        else:
            first_feedback_days.append(None)

        if revised and pd.notna(accepted_ts):
            final_tail_days.append((accepted_ts.normalize() - revised[-1]).days)
        else:
            final_tail_days.append(None)

    out["revision_count"] = revision_counts
    out["first_feedback_days"] = first_feedback_days
    out["final_tail_days"] = final_tail_days
    out["review_path_bucket"] = [_rounds_bucket(count) for count in revision_counts]
    return out


def _build_monthly_series(timeline: pd.DataFrame, months: int, min_month_samples: int) -> Dict[str, List[Dict[str, int | str]]]:
    if timeline.empty:
        return {}

    yms = sorted(x for x in timeline["accepted_month"].dropna().unique() if x)
    if months > 0:
        yms = yms[-months:]
    scoped = timeline[timeline["accepted_month"].isin(yms)].copy()

    by_journal: Dict[str, List[Dict[str, int | str]]] = {}
    for (journal_key, ym), group in scoped.groupby(["journal_key", "accepted_month"]):
        summary = _summarize_days(group["days"])
        if int(summary["count"] or 0) < min_month_samples:
            continue
        by_journal.setdefault(str(journal_key), []).append(
            {
                "ym": str(ym),
                "count": int(summary["count"] or 0),
                "median": int(summary["median"] or 0),
                "p25": int(summary["p25"] or 0),
                "p75": int(summary["p75"] or 0),
            }
        )

    for rows in by_journal.values():
        rows.sort(key=lambda x: str(x["ym"]))
    return by_journal


def _build_timeline_points(timeline: pd.DataFrame, months: int) -> Dict[str, List[Dict[str, int | str]]]:
    if timeline.empty:
        return {}

    yms = sorted(x for x in timeline["accepted_month"].dropna().unique() if x)
    if months > 0:
        yms = yms[-months:]
    scoped = timeline[timeline["accepted_month"].isin(yms)].copy()

    by_journal: Dict[str, List[Dict[str, int | str]]] = {}
    for journal_key, group in scoped.groupby("journal_key"):
        rows = [
            {"ym": str(row.accepted_month), "days": int(round(float(row.days)))}
            for row in group[["accepted_month", "days"]].itertuples(index=False)
            if _num(row.days) is not None and _clean_str(row.accepted_month)
        ]
        rows.sort(key=lambda x: (str(x["ym"]), int(x["days"])))
        by_journal[str(journal_key)] = rows
    return by_journal


def _build_global_series(timeline: pd.DataFrame, months: int, min_month_samples: int) -> List[Dict[str, int | str]]:
    if timeline.empty:
        return []
    yms = sorted(x for x in timeline["accepted_month"].dropna().unique() if x)
    if months > 0:
        yms = yms[-months:]
    rows: List[Dict[str, int | str]] = []
    for ym, group in timeline[timeline["accepted_month"].isin(yms)].groupby("accepted_month"):
        summary = _summarize_days(group["days"])
        if int(summary["count"] or 0) < min_month_samples:
            continue
        rows.append(
            {
                "ym": str(ym),
                "count": int(summary["count"] or 0),
                "median": int(summary["median"] or 0),
                "p25": int(summary["p25"] or 0),
                "p75": int(summary["p75"] or 0),
            }
        )
    return sorted(rows, key=lambda x: str(x["ym"]))


def _build_process_series(timeline: pd.DataFrame, min_period_samples: int) -> Dict[str, List[Dict[str, Any]]]:
    if timeline.empty:
        return {}

    by_journal: Dict[str, List[Dict[str, Any]]] = {}
    for (journal_key, period), group in timeline.groupby(["journal_key", "accepted_period"]):
        total = _summarize_days(group["days"])
        if int(total["count"] or 0) < min_period_samples:
            continue

        first_feedback = _summarize_days(group["first_feedback_days"])
        final_tail = _summarize_days(group["final_tail_days"])
        revision_rounds = _summarize_numeric(group["revision_count"])
        by_journal.setdefault(str(journal_key), []).append(
            {
                "period": str(period),
                "count": int(total["count"] or 0),
                "total_wait": total,
                "first_feedback": first_feedback,
                "revision_rounds": revision_rounds,
                "final_acceptance_tail": final_tail,
            }
        )

    for rows in by_journal.values():
        rows.sort(key=lambda row: _period_sort_key(str(row["period"])))
    return by_journal


def _build_process_summary(timeline: pd.DataFrame, journal_key: str, min_path_samples: int) -> Dict[str, Any]:
    scoped = timeline[timeline["journal_key"] == journal_key].copy()
    if scoped.empty:
        return {
            "total_wait": _summarize_days([]),
            "first_feedback": _summarize_days([]),
            "revision_rounds": _summarize_numeric([]),
            "final_acceptance_tail": _summarize_days([]),
            "no_revision_recorded_rate": 0,
            "common_paths": [],
        }

    total = _summarize_days(scoped["days"])
    first_feedback = _summarize_days(scoped["first_feedback_days"])
    final_tail = _summarize_days(scoped["final_tail_days"])
    revision_rounds = _summarize_numeric(scoped["revision_count"])
    row_count = max(1, len(scoped))
    no_revision_rate = round(float((scoped["revision_count"] == 0).sum()) / row_count, 4)

    common_paths: List[Dict[str, Any]] = []
    order = ["no_revision_recorded", "one_revision", "two_revisions", "three_plus"]
    for bucket in order:
        group = scoped[scoped["review_path_bucket"] == bucket]
        if len(group) < min_path_samples:
            continue
        path_total = _summarize_days(group["days"])
        path_first = _summarize_days(group["first_feedback_days"])
        path_tail = _summarize_days(group["final_tail_days"])
        common_paths.append(
            {
                "path": bucket,
                "label": _rounds_label(bucket),
                "count": int(len(group)),
                "share": round(float(len(group)) / row_count, 4),
                "first_feedback_window": _day_window_label(path_first),
                "final_acceptance_window": _day_window_label(path_total),
                "total_wait_window": _range_label(path_total),
                "final_tail_window": _range_label(path_tail),
                "rounds": "3+" if bucket == "three_plus" else str(int(group["revision_count"].median())),
            }
        )

    return {
        "total_wait": total,
        "first_feedback": first_feedback,
        "revision_rounds": revision_rounds,
        "final_acceptance_tail": final_tail,
        "no_revision_recorded_rate": no_revision_rate,
        "common_paths": common_paths,
    }


def _article_type_payload(group: pd.DataFrame, total_count: int, min_period_samples: int) -> Dict[str, Any]:
    label = str(group["article_type"].iloc[0])
    total = _summarize_days(group["days"])
    first_feedback = _summarize_days(group["first_feedback_days"])
    final_tail = _summarize_days(group["final_tail_days"])
    revision_rounds = _summarize_numeric(group["revision_count"])
    periods: List[Dict[str, Any]] = []

    for period, period_group in group.groupby("accepted_period"):
        period_total = _summarize_days(period_group["days"])
        if int(period_total["count"] or 0) < min_period_samples:
            continue
        periods.append(
            {
                "period": str(period),
                "count": int(period_total["count"] or 0),
                "total_wait": period_total,
                "first_feedback": _summarize_days(period_group["first_feedback_days"]),
                "revision_rounds": _summarize_numeric(period_group["revision_count"]),
                "final_acceptance_tail": _summarize_days(period_group["final_tail_days"]),
            }
        )

    periods.sort(key=lambda row: _period_sort_key(str(row["period"])))
    return {
        "article_type": label,
        "count": int(total["count"] or 0),
        "share": round(float(total["count"] or 0) / max(1, total_count), 4),
        "total_wait": total,
        "first_feedback": first_feedback,
        "revision_rounds": revision_rounds,
        "final_acceptance_tail": final_tail,
        "no_revision_recorded_rate": round(float((group["revision_count"] == 0).sum()) / max(1, len(group)), 4),
        "periods": periods,
    }


def _build_article_type_breakdown(timeline: pd.DataFrame, journal_key: str, min_period_samples: int) -> List[Dict[str, Any]]:
    scoped = timeline[timeline["journal_key"] == journal_key].copy()
    if scoped.empty:
        return []

    total_count = len(scoped)
    rows = [
        _article_type_payload(group.copy(), total_count, min_period_samples)
        for _, group in scoped.groupby("article_type", sort=False)
    ]
    rows.sort(key=lambda row: (-int(row["count"]), str(row["article_type"]).lower()))
    return rows


def _rolling_summary(timeline: pd.DataFrame, journal_key: str, months: int, as_of: str) -> Dict[str, Optional[int]]:
    scoped = timeline[timeline["journal_key"] == journal_key]
    if scoped.empty:
        return {"count": 0, "median": None, "p25": None, "p75": None, "p90": None}

    cutoff = (pd.Timestamp(as_of).tz_localize("UTC") - pd.DateOffset(months=months)).normalize()
    recent = scoped[scoped["accepted_date"] >= cutoff]
    summary = _summarize_days(recent["days"])
    return {
        "count": int(summary["count"] or 0),
        "median": summary["median"],
        "p25": summary["p25"],
        "p75": summary["p75"],
        "p90": summary["p90"],
    }


def _trust_label(rows_with_timeline: int, latest_month: str, as_of: str) -> str:
    latest = pd.to_datetime(latest_month + "-01", errors="coerce", utc=True) if latest_month else pd.NaT
    if pd.isna(latest):
        return "low"
    as_of_ts = pd.Timestamp(as_of).tz_localize("UTC")
    month_gap = (as_of_ts.year - latest.year) * 12 + (as_of_ts.month - latest.month)
    if month_gap > 24:
        return "stale"
    if rows_with_timeline >= 200 and month_gap <= 12:
        return "high"
    if rows_with_timeline >= 80:
        return "medium"
    return "low"


def _journal_slug(journal_key: str, journal_title: str) -> str:
    source, _, key_tail = journal_key.partition(":")
    title_slug = _slugify(journal_title)
    tail = _slugify(key_tail)
    if title_slug and title_slug != "unknown":
        return f"{title_slug}-review-time"
    return f"{source}-{tail}-review-time"


def _source_display(source_key: str) -> str:
    labels = {
        "cell": "Cell Press",
        "elife": "eLife",
        "elsevier": "Elsevier",
        "frontier": "Frontiers",
        "mdpi": "MDPI",
        "nature": "Nature Portfolio",
        "plos": "PLOS",
        "springerlink": "SpringerLink",
    }
    return labels.get(source_key, source_key)


def _journal_payload(
    row: pd.Series,
    timeline: pd.DataFrame,
    series_by_journal: Dict[str, List[Dict[str, int | str]]],
    process_series_by_journal: Dict[str, List[Dict[str, Any]]],
    issn_map: Dict[str, str],
    args: argparse.Namespace,
) -> Dict[str, Any]:
    journal_key = _clean_str(row["journal_key"])
    source_key = _clean_str(row["source_key"])
    title = _clean_str(row["journal_title_final"]) or "Unknown Journal"
    count = _int(row["rows_with_timeline"])
    median = _int(row["median_days_received_to_accepted"])
    p25 = _int(row["p25_days_received_to_accepted"])
    p75 = _int(row["p75_days_received_to_accepted"])
    p90 = _int(row["p90_days_received_to_accepted"])
    coverage_start = _clean_str(row.get("coverage_start", ""))
    coverage_end = _clean_str(row.get("coverage_end", ""))
    latest_fetched_at = _clean_str(row.get("latest_fetched_at", ""))
    latest_month = coverage_end[:7] if coverage_end else ""
    latest_period = _period_from_date_text(coverage_end)
    rolling_24m = _rolling_summary(timeline, journal_key, 24, args.as_of)
    rolling_60m = _rolling_summary(timeline, journal_key, 60, args.as_of)
    rolling_6m = _rolling_summary(timeline, journal_key, 6, args.as_of)
    trend = 0
    trend_eligible = (
        int(rolling_6m["count"] or 0) >= args.min_period_samples
        and int(rolling_24m["count"] or 0) >= args.min_reliable_samples
        and rolling_6m["median"] is not None
        and rolling_24m["median"] is not None
    )
    if trend_eligible:
        trend = int(rolling_6m["median"] - rolling_24m["median"])

    slug = _journal_slug(journal_key, title)
    is_indexable = count >= args.min_public_samples and median > 0
    source_display = _source_display(source_key)

    return {
        "journal_key": journal_key,
        "url_slug": slug,
        "url_path": f"/journals/{slug}",
        "source_key": source_key,
        "source_display": source_display,
        "label": title,
        "name": title,
        "issn": issn_map.get(_norm_key(title), ""),
        "publisher": source_display,
        "subject": "General",
        "count": count,
        "median": median,
        "p25": p25,
        "p75": p75,
        "p90": p90,
        "min": _int(row["min_days_received_to_accepted"]),
        "max": _int(row["max_days_received_to_accepted"]),
        "timeline_coverage": _pct(row.get("timeline_coverage", 0)),
        "coverage_start": _period_from_date_text(coverage_start),
        "coverage_end": latest_period,
        "latest_fetched_at": latest_fetched_at,
        "latest_sample_month": latest_period,
        "rolling_24m": rolling_24m,
        "rolling_60m": rolling_60m,
        "trend": trend,
        "trend_eligible": trend_eligible,
        "med6": rolling_6m["median"],
        "med24": rolling_24m["median"],
        "byYM": {},
        "timeSeries": series_by_journal.get(journal_key, []),
        "review_process": _build_process_summary(timeline, journal_key, args.min_path_samples),
        "review_process_series": process_series_by_journal.get(journal_key, []),
        "article_type_breakdown": _build_article_type_breakdown(timeline, journal_key, args.min_period_samples),
        "articles": [],
        "trust_label": _trust_label(count, latest_month, args.as_of),
        "is_public": is_indexable,
        "is_indexable": is_indexable,
        "leaderboard_eligible": count >= args.min_leaderboard_samples,
        "reliable_ranking_eligible": count >= args.min_reliable_samples,
        "primary_keyword": f"{title} review time",
        "seo_title": f"{title} Review Time: Median {median} Days | ReviewTime",
        "seo_description": (
            f"See {title} review time from {count} article timelines: median {median} days "
            f"received to accepted, P25-P75 {p25}-{p75} days, based on real published articles."
        ),
    }


def _build_sources(journals: List[Dict[str, Any]], quality: Dict[str, Any]) -> List[Dict[str, Any]]:
    source_quality = {item.get("source_key"): item for item in quality.get("by_source", [])}
    rows = []
    for source_key in sorted({j["source_key"] for j in journals}):
        source_journals = [j for j in journals if j["source_key"] == source_key]
        timeline_samples = sum(int(j["count"]) for j in source_journals)
        eligible = len(source_journals) >= 1 and timeline_samples >= 100
        q = source_quality.get(source_key, {})
        rows.append(
            {
                "source_key": source_key,
                "source_display": _source_display(source_key),
                "url_path": f"/sources/{source_key}/review-time",
                "timeline_journals": len(source_journals),
                "timeline_samples": timeline_samples,
                "timeline_coverage": _pct(q.get("timeline_coverage", 0)),
                "is_public": eligible,
                "is_indexable": eligible,
            }
        )
    return rows


def _build_leaderboards(journals: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    eligible = [j for j in journals if j["leaderboard_eligible"]]
    reliable = [j for j in journals if j["reliable_ranking_eligible"]]

    def pick(fields: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [
            {
                "journal_key": j["journal_key"],
                "url_slug": j["url_slug"],
                "label": j["label"],
                "source_display": j["source_display"],
                "median": j["median"],
                "p25": j["p25"],
                "p75": j["p75"],
                "p90": j["p90"],
                "count": j["count"],
                "trend": j["trend"],
                "trust_label": j["trust_label"],
            }
            for j in fields
        ]

    return {
        "fast_reliable": pick(sorted(reliable, key=lambda j: (j["median"], j["p75"], -j["count"]))[:100]),
        "fastest": pick(sorted(eligible, key=lambda j: (j["median"], j["p75"], -j["count"]))[:100]),
        "slowest": pick(sorted(eligible, key=lambda j: (-j["median"], -j["p75"], -j["count"]))[:100]),
        "most_evidence": pick(sorted(eligible, key=lambda j: (-j["count"], j["median"]))[:100]),
        "recently_faster": pick(sorted([j for j in eligible if j.get("trend_eligible") and j["trend"] < 0], key=lambda j: (j["trend"], -j["count"]))[:100]),
        "recently_slower": pick(sorted([j for j in eligible if j.get("trend_eligible") and j["trend"] > 0], key=lambda j: (-j["trend"], -j["count"]))[:100]),
    }


def _summary_journal(journal: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(journal)
    if "review_process" in out:
        review_process = dict(out["review_process"])
        review_process.pop("common_paths", None)
        out["review_process"] = review_process
    out.pop("review_process_series", None)
    if "article_type_breakdown" in out:
        out["article_type_breakdown"] = [
            {
                "article_type": row["article_type"],
                "count": row["count"],
                "share": row["share"],
                "total_wait": row["total_wait"],
                "first_feedback": row["first_feedback"],
                "revision_rounds": row["revision_rounds"],
                "final_acceptance_tail": row["final_acceptance_tail"],
                "no_revision_recorded_rate": row["no_revision_recorded_rate"],
            }
            for row in out["article_type_breakdown"]
        ]
    return out


def _ensure_unique_slugs(journals: List[Dict[str, Any]]) -> None:
    seen: Dict[str, int] = {}
    original_slugs = [str(journal["url_slug"]) for journal in journals]
    duplicate_slugs = {slug for slug in original_slugs if original_slugs.count(slug) > 1}

    for journal in journals:
        base_slug = str(journal["url_slug"])
        if base_slug in duplicate_slugs:
            source = _slugify(str(journal["source_key"]))
            key_tail = _slugify(str(journal["journal_key"]).split(":", 1)[-1])
            base_slug = f"{source}-{key_tail}-review-time"

        count = seen.get(base_slug, 0)
        seen[base_slug] = count + 1
        slug = base_slug if count == 0 else f"{base_slug}-{count + 1}"
        journal["url_slug"] = slug
        journal["url_path"] = f"/journals/{slug}"


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Build public JSON snapshots from rssmonitor monthly outputs")
    ap.add_argument("--run-dir", required=True, help="rssmonitor/monthly_runs/<YYYY-MM>")
    ap.add_argument("--out", default="reviewtime-next/public/data/current", help="Public current snapshot output directory")
    ap.add_argument("--archive", default="", help="Optional archive directory, e.g. reviewtime-next/public/data/snapshots/<YYYY-MM-DD>")
    ap.add_argument("--as-of", default=datetime.now().date().isoformat(), help="Stats cutoff date, YYYY-MM-DD")
    ap.add_argument("--months", type=int, default=60, help="Trailing months kept in public monthly series")
    ap.add_argument("--min-days", type=int, default=MIN_DAYS)
    ap.add_argument("--max-days", type=int, default=MAX_DAYS)
    ap.add_argument("--min-public-samples", type=int, default=DEFAULT_MIN_PUBLIC_SAMPLES)
    ap.add_argument("--min-month-samples", type=int, default=3)
    ap.add_argument("--min-period-samples", type=int, default=DEFAULT_MIN_PERIOD_SAMPLES)
    ap.add_argument("--min-path-samples", type=int, default=DEFAULT_MIN_PATH_SAMPLES)
    ap.add_argument("--min-leaderboard-samples", type=int, default=DEFAULT_MIN_LEADERBOARD_SAMPLES)
    ap.add_argument("--min-reliable-samples", type=int, default=DEFAULT_MIN_RELIABLE_SAMPLES)
    ap.add_argument("--journal-seed-csv", default="data/journals_seed.csv")
    ap.add_argument("--journal-issn-jsonl", default="data/journals_issn.jsonl")
    return ap.parse_args()


def main() -> None:
    args = parse_args()
    run_dir = Path(args.run_dir).resolve()
    out_dir = Path(args.out).resolve()
    tmp_dir = out_dir.with_name(out_dir.name + ".tmp")

    stats_path = run_dir / "stats_by_journal.csv"
    master_path = run_dir / "master_long.csv"
    global_path = run_dir / "stats_global_summary.csv"
    quality_path = run_dir / "quality_report.json"
    manifest_path = run_dir / "run_manifest.json"

    for path in [stats_path, master_path, global_path, quality_path, manifest_path]:
        if not path.exists():
            raise FileNotFoundError(path)

    journal_stats = _read_csv(stats_path)
    master = _read_csv(master_path)
    global_summary = _read_csv(global_path)
    quality = _read_json(quality_path, {})
    run_manifest = _read_json(manifest_path, {})
    issn_map = _load_issn_map([Path(args.journal_seed_csv), Path(args.journal_issn_jsonl)])
    timeline = _prepare_timeline_rows(master, args.as_of, args.min_days, args.max_days)
    series_by_journal = _build_monthly_series(timeline, args.months, args.min_month_samples)
    process_series_by_journal = _build_process_series(timeline, args.min_period_samples)
    global_series = _build_global_series(timeline, args.months, args.min_month_samples)

    public_rows = journal_stats[
        (pd.to_numeric(journal_stats["rows_with_timeline"], errors="coerce").fillna(0) >= args.min_public_samples)
        & pd.to_numeric(journal_stats["median_days_received_to_accepted"], errors="coerce").notna()
    ].copy()

    journals = [
        _journal_payload(row, timeline, series_by_journal, process_series_by_journal, issn_map, args)
        for _, row in public_rows.iterrows()
    ]
    journals.sort(key=lambda j: (j["median"], j["p75"], -j["count"], j["label"]))
    _ensure_unique_slugs(journals)
    for journal in journals:
        journal["byYM"] = {
            str(point["ym"]): {
                "count": point["count"],
                "median": point["median"],
                "p25": point["p25"],
                "p75": point["p75"],
            }
            for point in journal["timeSeries"]
        }

    summary_journals = [_summary_journal(journal) for journal in journals]
    sources = _build_sources(journals, quality)
    summary_row = global_summary.iloc[0] if not global_summary.empty else {}
    total_articles = int(quality.get("rows_with_timeline", 0) or sum(j["count"] for j in journals))
    global_data = {
        "totalJournals": len(journals),
        "totalArticles": total_articles,
        "globalMedian": _int(summary_row.get("median_days_received_to_accepted", 0)),
        "globalP25": _int(summary_row.get("p25_days_received_to_accepted", 0)),
        "globalP75": _int(summary_row.get("p75_days_received_to_accepted", 0)),
        "publishers": sorted({j["publisher"] for j in journals if j["publisher"]}),
        "subjects": sorted({j["subject"] for j in journals if j["subject"]}),
        "globalTimeSeries": global_series,
        "fastest": summary_journals[0] if summary_journals else None,
    }

    month = _clean_str(run_manifest.get("month")) or run_dir.name
    generated_at = datetime.now().isoformat(timespec="seconds")
    public_manifest = {
        "snapshot_kind": "public_aggregate",
        "month": month,
        "as_of": args.as_of,
        "generated_at": generated_at,
        "source_kind": "rssmonitor_monthly_run",
        "source_month": month,
        "raw_data_policy": {
            "raw_master_uploaded": False,
            "article_titles_uploaded": False,
            "abstracts_uploaded": False,
            "authors_uploaded": False,
            "article_level_calendar_dates_uploaded": False,
            "article_level_timeline_points_uploaded": False,
            "public_outputs": "Aggregated journal metrics, half-year process trends, and anonymized relative review-path ranges only.",
        },
        "eligibility": {
            "min_public_samples": args.min_public_samples,
            "min_leaderboard_samples": args.min_leaderboard_samples,
            "min_reliable_samples": args.min_reliable_samples,
            "no_timeline_journals_excluded": True,
        },
        "counts": {
            "input_journal_groups": int(len(journal_stats)),
            "public_journals": int(len(journals)),
            "public_sources": int(sum(1 for s in sources if s["is_public"])),
            "valid_timeline_rows": int(quality.get("rows_with_timeline", total_articles)),
            "source_rows_after_dedup": int(run_manifest.get("rows_after_dedup", quality.get("total_rows", 0))),
        },
        "sources": sorted(_clean_str(x) for x in journal_stats["source_key"].dropna().unique()),
    }

    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    _json_dump(tmp_dir / "manifest.json", public_manifest)
    _json_dump(tmp_dir / "global-summary.json", global_data)
    _json_dump(tmp_dir / "journals.json", summary_journals)
    _json_dump(tmp_dir / "journal-trends.json", series_by_journal)
    _json_dump(tmp_dir / "sources.json", sources)
    _json_dump(tmp_dir / "leaderboards.json", _build_leaderboards(journals))
    _json_dump(
        tmp_dir / "quality-report.json",
        {
            "as_of": quality.get("as_of", args.as_of),
            "total_rows": quality.get("total_rows"),
            "rows_with_timeline": quality.get("rows_with_timeline"),
            "timeline_coverage": quality.get("timeline_coverage"),
            "future_accepted_date_rows": quality.get("future_accepted_date_rows"),
            "future_received_date_rows": quality.get("future_received_date_rows"),
            "missing_received_date_rows": quality.get("missing_received_date_rows"),
            "missing_accepted_date_rows": quality.get("missing_accepted_date_rows"),
            "by_source": quality.get("by_source", []),
        },
    )
    _json_dump(tmp_dir / "review-data.json", {"rows": [], "journals": summary_journals, "stats": global_data})

    journal_dir = tmp_dir / "journals"
    for journal in journals:
        _json_dump(journal_dir / f"{journal['url_slug']}.json", journal)

    if out_dir.exists():
        shutil.rmtree(out_dir)
    tmp_dir.replace(out_dir)

    if args.archive:
        archive_dir = Path(args.archive).resolve()
        if archive_dir.exists():
            shutil.rmtree(archive_dir)
        shutil.copytree(out_dir, archive_dir)

    print("[public-snapshots] done")
    print(json.dumps(public_manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
