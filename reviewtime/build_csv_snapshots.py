from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional

import pandas as pd


MIN_DAYS = 1
MAX_DAYS = 1000


def _parse_date(value) -> Optional[pd.Timestamp]:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None

    # Excel serial number
    if isinstance(value, (int, float)):
        try:
            dt = pd.to_datetime(value, unit="D", origin="1899-12-30", errors="coerce")
            return None if pd.isna(dt) else dt
        except Exception:
            return None

    dt = pd.to_datetime(value, errors="coerce")
    return None if pd.isna(dt) else dt


def _percentile(sorted_values: List[float], p: float) -> Optional[float]:
    if not sorted_values:
        return None
    if len(sorted_values) == 1:
        return float(sorted_values[0])
    idx = (len(sorted_values) - 1) * p
    lo = int(idx)
    hi = min(lo + 1, len(sorted_values) - 1)
    frac = idx - lo
    return sorted_values[lo] * (1 - frac) + sorted_values[hi] * frac


def _summarize_days(values: Iterable[float]) -> Dict[str, Optional[float]]:
    sorted_vals = sorted(float(v) for v in values if v is not None)
    if not sorted_vals:
        return {
            "count": 0,
            "median": None,
            "p25": None,
            "p75": None,
            "min": None,
            "max": None,
        }

    return {
        "count": len(sorted_vals),
        "median": round(_percentile(sorted_vals, 0.50) or 0),
        "p25": round(_percentile(sorted_vals, 0.25) or 0),
        "p75": round(_percentile(sorted_vals, 0.75) or 0),
        "min": round(sorted_vals[0]),
        "max": round(sorted_vals[-1]),
    }


def _pick_first_existing(row: pd.Series, cols: List[str], default=""):
    for c in cols:
        if c in row and pd.notna(row[c]):
            v = str(row[c]).strip()
            if v:
                return v
    return default


def _to_ym(ts: Optional[pd.Timestamp]) -> Optional[str]:
    if ts is None:
        return None
    return f"{ts.year:04d}-{ts.month:02d}"


def load_and_clean_rows(input_excel: Path, min_days: int, max_days: int) -> pd.DataFrame:
    df = pd.read_excel(input_excel)

    cleaned_rows = []
    for _, r in df.iterrows():
        days_raw = r.get("days_received_to_accepted", r.get("Days Received→Accepted", r.get("days_review", None)))
        days = pd.to_numeric(days_raw, errors="coerce")
        if pd.isna(days):
            continue
        days = int(round(float(days)))
        if not (min_days <= days <= max_days):
            continue

        accepted = _parse_date(r.get("accepted_date", r.get("Accepted Date", r.get("accepted", None))))
        received = _parse_date(r.get("received_date", r.get("Received Date", r.get("received", None))))
        online = _parse_date(r.get("online_date", r.get("Online Date", r.get("published", None))))
        anchor = accepted or received or online
        ym = _to_ym(anchor)

        cleaned_rows.append(
            {
                "journal_name": _pick_first_existing(r, ["journal_name", "Journal Name", "journal"], "Unknown Journal"),
                "journal_label": _pick_first_existing(r, ["journal_label", "Journal Label", "journal_abbr", "journal_name", "Journal Name"], "Unknown Journal"),
                "issn": _pick_first_existing(r, ["issn", "ISSN"], ""),
                "publisher": _pick_first_existing(r, ["publisher", "Publisher"], "Unknown"),
                "subject": _pick_first_existing(r, ["subject", "Subject", "category"], "General"),
                "days": days,
                "accepted_date": accepted.date().isoformat() if accepted else "",
                "received_date": received.date().isoformat() if received else "",
                "online_date": online.date().isoformat() if online else "",
                "ym": ym or "",
                "doi": _pick_first_existing(r, ["doi", "DOI"], ""),
                "title": _pick_first_existing(r, ["title", "Title"], ""),
                "confidence_score": pd.to_numeric(r.get("confidence_score", r.get("Confidence", 1.0)), errors="coerce"),
            }
        )

    out = pd.DataFrame(cleaned_rows)
    if out.empty:
        raise ValueError("No valid rows after cleaning. Please check input columns and day range.")
    return out


def build_snapshots(df: pd.DataFrame, months: int, min_count: int) -> Dict[str, pd.DataFrame]:
    now = datetime.now()
    cutoff_6 = pd.Timestamp(datetime(now.year, now.month, 1)) - pd.DateOffset(months=6)
    cutoff_24 = pd.Timestamp(datetime(now.year, now.month, 1)) - pd.DateOffset(months=24)

    # journal stats
    journal_rows = []
    for label, g in df.groupby("journal_label"):
        values = g["days"].astype(float).tolist()
        s = _summarize_days(values)
        if s["count"] < min_count:
            continue

        accepted_dt = pd.to_datetime(g["accepted_date"], errors="coerce")
        g6 = g.loc[accepted_dt >= cutoff_6, "days"].astype(float).tolist()
        g24 = g.loc[accepted_dt >= cutoff_24, "days"].astype(float).tolist()
        med6 = _summarize_days(g6)["median"] if len(g6) >= 3 else None
        med24 = _summarize_days(g24)["median"] if len(g24) >= 3 else None
        trend = (med6 - med24) if (med6 is not None and med24 is not None) else 0

        first = g.iloc[0]
        journal_rows.append(
            {
                "journal_label": label,
                "journal_name": first["journal_name"],
                "issn": first["issn"],
                "publisher": first["publisher"],
                "subject": first["subject"],
                "count": int(s["count"]),
                "median": int(s["median"]),
                "p25": int(s["p25"]),
                "p75": int(s["p75"]),
                "min": int(s["min"]),
                "max": int(s["max"]),
                "med6": int(med6) if med6 is not None else None,
                "med24": int(med24) if med24 is not None else None,
                "trend": int(trend) if trend is not None else 0,
            }
        )

    journal_stats = pd.DataFrame(journal_rows).sort_values(by=["median", "count"], ascending=[True, False])

    # journal trend (month x journal)
    journal_trend_rows = []
    trend_df = df[df["ym"].astype(str) != ""].copy()
    if not trend_df.empty:
        yms = sorted(trend_df["ym"].unique())
        yms = yms[-months:] if months > 0 else yms
        trend_df = trend_df[trend_df["ym"].isin(yms)]

        for (label, ym), g in trend_df.groupby(["journal_label", "ym"]):
            s = _summarize_days(g["days"].astype(float).tolist())
            if s["count"] < min_count:
                continue
            first = g.iloc[0]
            journal_trend_rows.append(
                {
                    "journal_label": label,
                    "issn": first["issn"],
                    "publisher": first["publisher"],
                    "subject": first["subject"],
                    "ym": ym,
                    "count": int(s["count"]),
                    "median": int(s["median"]),
                    "p25": int(s["p25"]),
                    "p75": int(s["p75"]),
                }
            )

    journal_trend = pd.DataFrame(journal_trend_rows).sort_values(by=["journal_label", "ym"]) if journal_trend_rows else pd.DataFrame()

    # global trend
    global_trend_rows = []
    if not trend_df.empty:
        for ym, g in trend_df.groupby("ym"):
            s = _summarize_days(g["days"].astype(float).tolist())
            if s["count"] < min_count:
                continue
            global_trend_rows.append(
                {
                    "ym": ym,
                    "count": int(s["count"]),
                    "median": int(s["median"]),
                    "p25": int(s["p25"]),
                    "p75": int(s["p75"]),
                }
            )
    global_trend = pd.DataFrame(global_trend_rows).sort_values(by=["ym"]) if global_trend_rows else pd.DataFrame()

    # publisher stats
    publisher_rows = []
    for pub, g in df.groupby("publisher"):
        s = _summarize_days(g["days"].astype(float).tolist())
        if s["count"] < min_count:
            continue
        publisher_rows.append({
            "publisher": pub,
            "count": int(s["count"]),
            "median": int(s["median"]),
            "p25": int(s["p25"]),
            "p75": int(s["p75"]),
            "journals": int(g["journal_label"].nunique()),
        })
    publisher_stats = pd.DataFrame(publisher_rows).sort_values(by=["median", "count"], ascending=[True, False]) if publisher_rows else pd.DataFrame()

    # subject stats
    subject_rows = []
    for sub, g in df.groupby("subject"):
        s = _summarize_days(g["days"].astype(float).tolist())
        if s["count"] < min_count:
            continue
        subject_rows.append({
            "subject": sub,
            "count": int(s["count"]),
            "median": int(s["median"]),
            "p25": int(s["p25"]),
            "p75": int(s["p75"]),
            "journals": int(g["journal_label"].nunique()),
        })
    subject_stats = pd.DataFrame(subject_rows).sort_values(by=["median", "count"], ascending=[True, False]) if subject_rows else pd.DataFrame()

    # global summary (single row)
    g_all = _summarize_days(df["days"].astype(float).tolist())
    fastest = journal_stats.iloc[0]["journal_label"] if not journal_stats.empty else ""
    global_summary = pd.DataFrame(
        [
            {
                "total_journals": int(df["journal_label"].nunique()),
                "total_articles": int(len(df)),
                "global_median": int(g_all["median"]),
                "global_p25": int(g_all["p25"]),
                "global_p75": int(g_all["p75"]),
                "fastest_journal": fastest,
                "generated_at": datetime.now().isoformat(timespec="seconds"),
            }
        ]
    )

    return {
        "review_rows_clean": df,
        "snapshot_journal_stats": journal_stats,
        "snapshot_journal_trend": journal_trend,
        "snapshot_global_trend": global_trend,
        "snapshot_publisher_stats": publisher_stats,
        "snapshot_subject_stats": subject_stats,
        "snapshot_global_summary": global_summary,
    }


def write_snapshots(snapshots: Dict[str, pd.DataFrame], outdir: Path) -> Dict[str, int]:
    outdir.mkdir(parents=True, exist_ok=True)
    summary = {}
    for name, frame in snapshots.items():
        path = outdir / f"{name}.csv"
        frame.to_csv(path, index=False, encoding="utf-8")
        summary[name] = int(len(frame))
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Build pre-aggregated CSV snapshots from review data Excel")
    parser.add_argument("--input", default="web/data.xlsx", help="Input Excel path (default: web/data.xlsx)")
    parser.add_argument("--outdir", default="out/snapshots", help="Output directory for snapshot CSV files")
    parser.add_argument("--months", type=int, default=24, help="Trailing months kept in trend snapshots")
    parser.add_argument("--min-count", type=int, default=3, help="Minimum samples required per aggregated row")
    parser.add_argument("--min-days", type=int, default=MIN_DAYS, help="Minimum valid days_received_to_accepted")
    parser.add_argument("--max-days", type=int, default=MAX_DAYS, help="Maximum valid days_received_to_accepted")
    parser.add_argument("--output-report", default="out/snapshots_report.json", help="Path to write build report JSON")
    args = parser.parse_args()

    input_path = Path(args.input)
    outdir = Path(args.outdir)
    report_path = Path(args.output_report)

    cleaned = load_and_clean_rows(input_path, min_days=args.min_days, max_days=args.max_days)
    snapshots = build_snapshots(cleaned, months=args.months, min_count=args.min_count)
    row_counts = write_snapshots(snapshots, outdir)

    report = {
        "input": str(input_path),
        "outdir": str(outdir),
        "months": args.months,
        "min_count": args.min_count,
        "min_days": args.min_days,
        "max_days": args.max_days,
        "row_counts": row_counts,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print("[build_csv_snapshots] done")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
