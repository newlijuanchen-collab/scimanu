from __future__ import annotations

from collections import defaultdict
from datetime import date
from statistics import median
from typing import Dict, Iterable, List, Optional


def _month_delta(base: date, months: int) -> date:
    # move back N months, day clamped to 1 for stable window start
    year = base.year
    month = base.month - months
    while month <= 0:
        year -= 1
        month += 12
    return date(year, month, 1)


def _percentile(values: List[int], p: float) -> Optional[float]:
    if not values:
        return None
    if len(values) == 1:
        return float(values[0])
    values_sorted = sorted(values)
    idx = (len(values_sorted) - 1) * p
    lo = int(idx)
    hi = min(lo + 1, len(values_sorted) - 1)
    frac = idx - lo
    return values_sorted[lo] * (1 - frac) + values_sorted[hi] * frac


def in_window(anchor: Optional[date], as_of: date, window_months: int) -> bool:
    if anchor is None:
        return False
    start = _month_delta(as_of, window_months)
    return start <= anchor <= as_of


def _summarize_rows(rows: List[Dict]) -> Dict:
    r2a_values = [
        r["durations"]["days_received_to_accepted"]
        for r in rows
        if r["durations"].get("days_received_to_accepted") is not None
    ]
    a2o_values = [
        r["durations"]["days_accepted_to_online"]
        for r in rows
        if r["durations"].get("days_accepted_to_online") is not None
    ]

    return {
        "article_count": len(rows),
        "received_to_accepted": {
            "count": len(r2a_values),
            "median": float(median(r2a_values)) if r2a_values else None,
            "p25": _percentile(r2a_values, 0.25),
            "p75": _percentile(r2a_values, 0.75),
        },
        "accepted_to_online": {
            "count": len(a2o_values),
            "median": float(median(a2o_values)) if a2o_values else None,
            "p25": _percentile(a2o_values, 0.25),
            "p75": _percentile(a2o_values, 0.75),
        },
    }


def aggregate_by_journal(records: Iterable[Dict], as_of: date, window_months: int = 24) -> Dict:
    grouped: Dict[str, List[Dict]] = defaultdict(list)

    for row in records:
        events = row.get("events", {})
        accepted = events.get("accepted")
        online = events.get("available_online")
        anchor = accepted or online
        if in_window(anchor, as_of, window_months):
            grouped[row["journal"]].append(row)

    output = {
        "as_of": as_of.isoformat(),
        "window_months": window_months,
        "journals": {},
    }

    for journal, rows in grouped.items():
        output["journals"][journal] = _summarize_rows(rows)

    return output


def aggregate_with_trends(
    records: Iterable[Dict],
    as_of: date,
    primary_window_months: int = 24,
    trend_window_months: int = 6,
) -> Dict:
    records_list = list(records)
    primary = aggregate_by_journal(records_list, as_of=as_of, window_months=primary_window_months)
    recent = aggregate_by_journal(records_list, as_of=as_of, window_months=trend_window_months)

    output = {
        "as_of": as_of.isoformat(),
        "primary_window_months": primary_window_months,
        "trend_window_months": trend_window_months,
        "journals": {},
    }

    journal_names = set(primary["journals"].keys()) | set(recent["journals"].keys())
    for journal in sorted(journal_names):
        p = primary["journals"].get(journal, _summarize_rows([]))
        r = recent["journals"].get(journal, _summarize_rows([]))

        p_med = p["received_to_accepted"]["median"]
        r_med = r["received_to_accepted"]["median"]
        if p_med is None or r_med is None:
            trend = None
        else:
            trend = r_med - p_med

        output["journals"][journal] = {
            "window_primary": p,
            "window_recent": r,
            "trend_days_received_to_accepted_recent_minus_primary": trend,
        }

    return output
