from __future__ import annotations

import argparse
import re
from pathlib import Path

import pandas as pd


def _normalize_issn(raw: str) -> str:
    s = (raw or "").strip().upper()
    s = re.sub(r"[^0-9X]", "", s)
    if len(s) == 8:
        return f"{s[:4]}-{s[4:]}"
    return ""


def _build_journal_meta(seed_csv: Path) -> pd.DataFrame:
    seed = pd.read_csv(seed_csv, dtype=str).fillna("")
    for c in ["issn_print", "issn_online", "journal_name", "publisher", "subject"]:
        if c not in seed.columns:
            seed[c] = ""

    seed["issn_print_norm"] = seed["issn_print"].map(_normalize_issn)
    seed["issn_online_norm"] = seed["issn_online"].map(_normalize_issn)
    seed["journal_name_norm"] = seed["journal_name"].astype(str).str.strip().str.lower()

    by_issn = []
    for _, r in seed.iterrows():
        for issn in [r["issn_online_norm"], r["issn_print_norm"]]:
            if issn:
                by_issn.append({
                    "issn_norm": issn,
                    "publisher_seed": (r.get("publisher") or "").strip(),
                    "subject_seed": (r.get("subject") or "").strip(),
                })

    meta_issn = pd.DataFrame(by_issn).drop_duplicates(subset=["issn_norm"], keep="first") if by_issn else pd.DataFrame(columns=["issn_norm", "publisher_seed", "subject_seed"])
    meta_name = seed[["journal_name_norm", "publisher", "subject"]].rename(columns={"publisher": "publisher_seed_name", "subject": "subject_seed_name"}).drop_duplicates(subset=["journal_name_norm"], keep="first")
    return meta_issn, meta_name


def export_web_data(
    input_excel: Path,
    output_excel: Path,
    journals_seed_csv: Path,
    min_days: int = 1,
    max_days: int = 1000,
) -> None:
    df = pd.read_excel(input_excel)

    if "days_received_to_accepted" not in df.columns:
        raise ValueError("input excel missing required column: days_received_to_accepted")

    df["days_received_to_accepted"] = pd.to_numeric(df["days_received_to_accepted"], errors="coerce")
    df = df[df["days_received_to_accepted"].between(min_days, max_days, inclusive="both")].copy()

    if "issn" not in df.columns:
        df["issn"] = ""
    if "journal_label" not in df.columns:
        df["journal_label"] = ""

    df["issn_norm"] = df["issn"].astype(str).map(_normalize_issn)
    df["journal_label_norm"] = df["journal_label"].astype(str).str.strip().str.lower()

    meta_issn, meta_name = _build_journal_meta(journals_seed_csv)
    if not meta_issn.empty:
        df = df.merge(meta_issn, how="left", on="issn_norm")
    else:
        df["publisher_seed"] = ""
        df["subject_seed"] = ""

    if not meta_name.empty:
        df = df.merge(meta_name, how="left", left_on="journal_label_norm", right_on="journal_name_norm")
    else:
        df["publisher_seed_name"] = ""
        df["subject_seed_name"] = ""

    if "publisher" not in df.columns:
        df["publisher"] = ""
    if "subject" not in df.columns:
        df["subject"] = ""

    df["publisher"] = (
        df["publisher"].fillna("").astype(str).str.strip()
        .mask(lambda s: s == "", df["publisher_seed"].fillna("").astype(str).str.strip())
        .mask(lambda s: s == "", df["publisher_seed_name"].fillna("").astype(str).str.strip())
        .replace("", "Unknown")
    )
    df["subject"] = (
        df["subject"].fillna("").astype(str).str.strip()
        .mask(lambda s: s == "", df["subject_seed"].fillna("").astype(str).str.strip())
        .mask(lambda s: s == "", df["subject_seed_name"].fillna("").astype(str).str.strip())
        .replace("", "General")
    )

    # Compatibility column expected by some downstream ad-hoc workflows.
    df["subcategory"] = df["subject"]

    drop_cols = [
        "issn_norm",
        "journal_label_norm",
        "journal_name_norm",
        "publisher_seed",
        "subject_seed",
        "publisher_seed_name",
        "subject_seed_name",
    ]
    for c in drop_cols:
        if c in df.columns:
            df.drop(columns=[c], inplace=True)

    output_excel.parent.mkdir(parents=True, exist_ok=True)
    df.to_excel(output_excel, index=False)

    pub_unknown = int((df["publisher"] == "Unknown").sum())
    sub_general = int((df["subject"] == "General").sum())
    print(f"[export-web-data] rows={len(df)} -> {output_excel}")
    print(f"[export-web-data] publisher=Unknown: {pub_unknown}")
    print(f"[export-web-data] subject=General: {sub_general}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build web/data.xlsx from articles_master.xlsx with metadata backfill")
    parser.add_argument("--input", default="out/articles_master.xlsx", help="Input Excel (default: out/articles_master.xlsx)")
    parser.add_argument("--output", default="web/data.xlsx", help="Output Excel (default: web/data.xlsx)")
    parser.add_argument("--journals-seed", default="data/journals_seed.csv", help="Journal seed CSV for publisher/subject backfill")
    parser.add_argument("--min-days", type=int, default=1, help="Minimum valid days_received_to_accepted")
    parser.add_argument("--max-days", type=int, default=1000, help="Maximum valid days_received_to_accepted")
    args = parser.parse_args()

    export_web_data(
        input_excel=Path(args.input),
        output_excel=Path(args.output),
        journals_seed_csv=Path(args.journals_seed),
        min_days=args.min_days,
        max_days=args.max_days,
    )


if __name__ == "__main__":
    main()
