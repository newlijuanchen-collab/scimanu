#!/usr/bin/env python3
"""
scripts/validate_33_journals.py
Pure Python validator checking all 33 public journals have complete, valid metrics.
"""

import json
import re
from pathlib import Path

METRICS_FILE = Path("lib/data/journal-official-metrics.ts")
JOURNALS_FILE = Path("public/data/current/journals.json")

def main():
    content = METRICS_FILE.read_text(encoding="utf-8")
    journals = json.loads(JOURNALS_FILE.read_text(encoding="utf-8"))

    print(f"Validating {len(journals)} public journals against OFFICIAL_JOURNAL_METRICS...")

    # Extract all journal blocks by nlm_id
    # Format: 'NLM_ID': { ... }
    blocks = re.findall(r"'(\d+)':\s*\{(.*?)\n  \},", content, re.DOTALL)
    block_dict = {nlm_id: block for nlm_id, block in blocks}

    print(f"Found {len(block_dict)} parsed metric blocks in TS file.")

    required_patterns = [
        ("official_name", r"official_name:\s*'[^']+'"),
        ("publisher", r"publisher:\s*'[^']+'"),
        ("homepage_url", r"homepage_url:\s*'https?://[^']+'"),
        ("issn", r"issn:\s*\{[^}]*\}"),
        ("summary.zh", r"zh:\s*'[^']{20,}'"),
        ("summary.en", r"en:\s*'[^']{20,}'"),
        ("impact_factor.value", r"value:\s*'\d+\.?\d*'"),
        ("impact_factor.quartile", r"quartile:\s*'Q[1-4]"),
        ("citescore", r"citescore:\s*'\d+\.?\d*'"),
        ("scimago.sjr", r"sjr:\s*'\d+\.?\d*'"),
        ("scimago.quartile", r"quartile:\s*'Q[1-4]'"),
        ("scimago.h_index", r"h_index:\s*\d+"),
        ("scimago.url", r"url:\s*'https://www\.scimagojr\.com/journalsearch\.php\?q=[^']+'"),
        ("publisher_reported_speed.first_decision", r"first_decision:\s*'[^']+'"),
        ("acceptance_rate.rate", r"rate:\s*(\{[^}]*\}|'[^']+')"),
        ("publishing_model.type", r"type:\s*'[^']+'"),
        ("publishing_model.apc_usd", r"apc_usd:\s*(\d+|null)"),
        ("publishing_model.apc_details.zh", r"zh:\s*'[^']+'"),
        ("publishing_model.apc_details.en", r"en:\s*'[^']+'"),
    ]

    errors = 0
    for j in journals:
        nlm_id = j["journal_key"].split(":")[-1]
        label = j["label"]
        if nlm_id not in block_dict:
            print(f"[FAIL] {label} ({nlm_id}): Missing from OFFICIAL_JOURNAL_METRICS")
            errors += 1
            continue

        block = block_dict[nlm_id]
        failed_patterns = []
        for name, pat in required_patterns:
            if not re.search(pat, block):
                failed_patterns.append(name)

        if failed_patterns:
            print(f"[FAIL] {label} ({nlm_id}): Failed checks -> {', '.join(failed_patterns)}")
            errors += 1
        else:
            print(f" [PASS] {label} ({nlm_id}) - all 19 checks OK")

    if errors == 0:
        print(f"\n🎉 ALL {len(journals)} JOURNALS PASSED 100% OF VALIDATION CHECKS (0 errors, 0 missing fields)!")
    else:
        print(f"\n❌ Total failures: {errors}")
        exit(1)

if __name__ == "__main__":
    main()
