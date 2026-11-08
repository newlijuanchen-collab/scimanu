#!/usr/bin/env python3
"""Build small, aggregate-only acceptance-cohort statistics. No network access."""
from __future__ import annotations

import argparse
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from reviewtime.build_public_snapshots_from_rssmonitor import _derive_journal_identity, _revision_dates

SOURCES = {"cell": "Cell Press", "elife": "eLife", "elsevier": "Elsevier", "frontier": "Frontiers",
           "mdpi": "MDPI", "nature": "Nature Portfolio", "plos": "PLOS", "springerlink": "SpringerLink"}
STAGES = ["acceptance", "first_revision", "last_revision", "publication"]
# Generic "Article" and "Journal Article" do not establish a research article type.
RESEARCH_TYPES = {"research", "research article", "research paper", "original article", "original paper",
                  "original research", "original research article", "regular article", "regular paper",
                  "originalien"}
COLUMNS = ["source_key", "journal_id", "journal_title", "source_name", "feed_title", "doi",
           "article_type", "received_date", "accepted_date", "revised_dates", "revised_first_date",
           "revised_last_date", "online_date", "fetched_at"]


def prepare(raw: pd.DataFrame, as_of: str) -> tuple[pd.DataFrame, dict]:
    cutoff = pd.Timestamp(as_of, tz="UTC") + pd.Timedelta(days=1)
    work = raw.copy().fillna("")
    for col in COLUMNS:
        if col not in work:
            work[col] = ""
    input_rows = len(work)
    doi = work.doi.astype(str).str.strip().str.lower().str.replace(r"^https?://(?:dx\.)?doi.org/", "", regex=True)
    duplicate = doi.ne("") & doi.duplicated(keep="first")
    work = _derive_journal_identity(work.loc[~duplicate].copy()).reset_index(drop=True)
    for field in ["received_date", "accepted_date", "online_date"]:
        work[field] = pd.to_datetime(work[field], errors="coerce", utc=True, format="mixed").dt.normalize()
    received, accepted, online = work.received_date, work.accepted_date, work.online_date
    future = (received >= cutoff) | (accepted >= cutoff)
    acceptance = (accepted - received).dt.days
    valid = acceptance.between(1, 1000) & ~future
    work["acceptance"] = acceptance.where(valid)
    first, last = [], []
    for _, row in work.iterrows():
        revised = _revision_dates(row, row.received_date, row.accepted_date)
        usable = bool(revised) and pd.notna(row.received_date) and pd.notna(row.accepted_date)
        first.append((revised[0] - row.received_date).days if usable else None)
        last.append((row.accepted_date - revised[-1]).days if usable else None)
    work["first_revision"] = pd.Series(first).where(valid)
    work["last_revision"] = pd.Series(last).where(valid)
    pub_days = (online - accepted).dt.days
    work["publication"] = pub_days.where(pub_days.between(0, 1000) & (online < cutoff) & ~future)
    work["research"] = work.article_type.astype(str).str.strip().str.lower().isin(RESEARCH_TYPES)
    work["month"] = accepted.dt.strftime("%Y-%m")
    # A missing received date does not invalidate an observable acceptance-to-online interval.
    cohort = accepted.notna() & (accepted < cutoff) & ~future
    audit = {
        "input_rows": input_rows, "deduplicated_rows": len(work), "duplicate_doi_rows": int(duplicate.sum()),
        "accepted_cohort_rows": int(cohort.sum()), "valid_acceptance_rows": int(valid.sum()),
        "future_timeline_rows": int(future.sum()),
        "invalid_acceptance_rows": int((received.notna() & accepted.notna() & ~valid).sum()),
        "explicit_research_rows": int(work.research.sum()),
        "latest_fetched_at": None,
        "article_types": {str(k): int(v) for k, v in work.article_type.value_counts().head(20).items()},
        "by_source": [{"key": str(key), "label": SOURCES.get(str(key), str(key)), "rows": len(g),
                       "valid_acceptance_rows": int(g.acceptance.notna().sum())}
                      for key, g in work.groupby("source_key")],
    }
    fetched = pd.to_datetime(work.fetched_at, errors="coerce", utc=True, format="mixed")
    latest_fetched = fetched[fetched < cutoff].max()
    if pd.notna(latest_fetched):
        audit["latest_fetched_at"] = latest_fetched.strftime("%Y-%m-%d")
    return work.loc[cohort].copy(), audit


def summary(values: pd.Series, minimum: int = 5) -> dict:
    values = values.dropna()
    result = {"count": len(values), "median": None, "p25": None, "p75": None, "p90": None}
    if len(values) >= minimum:
        for key, q in [("median", .5), ("p25", .25), ("p75", .75), ("p90", .9)]:
            result[key] = round(float(values.quantile(q)), 1)
    return result


def metrics(frame: pd.DataFrame) -> dict:
    return {key: summary(frame[key]) for key in STAGES}


def build_scope(frame: pd.DataFrame, as_of: str, window: str, source: str, article_type: str,
                identities: dict) -> dict:
    selected = frame
    if window != "all":
        start = pd.Timestamp(as_of, tz="UTC") + pd.Timedelta(days=1) - pd.DateOffset(months=int(window[:-1]))
        selected = selected[selected.accepted_date >= start]
    else:
        start = selected.accepted_date.min()
    if source != "all":
        selected = selected[selected.source_key == source]
    if article_type == "research":
        selected = selected[selected.research]
    journals = []
    for key, group in selected.groupby("journal_key"):
        stages = metrics(group)
        if all(stage["count"] < 5 for stage in stages.values()):
            continue
        identity = identities.get(str(key), {})
        journals.append({"key": str(key), "label": str(group.journal_title_final.iloc[0]),
                         "source": str(group.source_key.iloc[0]), "url": identity.get("url_path"),
                         "issn": identity.get("issn", ""), "stages": stages,
                         "latest_month": str(group.month.max())})
    journals.sort(key=lambda row: (-row["stages"]["acceptance"]["count"], row["label"]))
    # Keep calendar gaps; the UI must not join a missing month as if it were observed.
    monthly = []
    if not selected.empty:
        groups = {str(key): g for key, g in selected.groupby("month")}
        for month in pd.period_range(selected.month.min(), as_of[:7], freq="M"):
            key = str(month)
            group = groups.get(key, selected.iloc[:0])
            monthly.append({"month": key, "stages": metrics(group)})
    return {"window": window, "source": source, "article_type": article_type,
            "start": start.strftime("%Y-%m-%d") if pd.notna(start) else None, "end": as_of,
            "cohort_rows": len(selected), "journal_groups": int(selected.journal_key.nunique()),
            "stages": metrics(selected), "monthly": monthly, "journals": journals}


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n", encoding="utf-8")
    os.replace(temp, path)


def build(input_path: Path, out: Path, as_of: str, identities_path: Path | None = None) -> dict:
    # Read only factual identifiers and dates, never abstracts, authors or page text.
    raw = pd.read_csv(input_path, usecols=lambda col: col in COLUMNS, encoding="utf-8-sig", low_memory=False)
    frame, audit = prepare(raw, as_of)
    identities = {}
    if identities_path and identities_path.exists():
        identities = {j["journal_key"]: j for j in json.loads(identities_path.read_text(encoding="utf-8"))}
    generated = datetime.now(timezone.utc)
    version = generated.strftime("%Y%m%dT%H%M%S%fZ")
    source_keys = sorted(str(s) for s in raw.source_key.dropna().unique())
    for window in ["12m", "24m", "all"]:
        for source in ["all", *source_keys]:
            if not re.fullmatch(r"[a-z0-9_-]+", source):
                raise ValueError("Invalid source key")
            for article_type in ["research", "all"]:
                data = build_scope(frame, as_of, window, source, article_type, identities)
                write_json(out / version / f"{window}-{source}-{article_type}.json", data)
    manifest = {"version": version, "as_of": as_of, "generated_at": generated.isoformat(),
                "minimum_samples": 5, "audit": audit,
                "sources": [{"key": key, "label": SOURCES.get(key, key)} for key in source_keys],
                "research_types": sorted(RESEARCH_TYPES), "cohort_basis": "accepted_date",
                "publication_basis": "online_date", "cadence": "on_pipeline_run"}
    # Publish this pointer last: every scope in a generation is complete before readers can see it.
    write_json(out / "index.json", manifest)
    return manifest


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--as-of", required=True, help="Dataset cutoff YYYY-MM-DD; do not substitute build time")
    ap.add_argument("--identities", type=Path)
    args = ap.parse_args()
    pd.Timestamp(args.as_of)  # Reject invalid cutoffs before writing.
    result = build(args.input, args.out, args.as_of, args.identities)
    print(json.dumps({"version": result["version"], "as_of": result["as_of"], "audit": result["audit"]}))
