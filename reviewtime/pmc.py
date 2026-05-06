from __future__ import annotations

import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from typing import Dict, List, Optional


MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}


def _to_iso(y: str, m: str, d: str) -> Optional[str]:
    try:
        mm = MONTHS.get(m.lower(), None)
        if mm is None:
            mm = int(m)
        return date(int(y), int(mm), int(d)).isoformat()
    except Exception:
        return None


def _parse_history_dates(root: ET.Element) -> Dict[str, Optional[str]]:
    out = {
        "received_date": None,
        "revised_dates": [],
        "accepted_date": None,
        "collection_date": None,
    }

    for dnode in root.findall('.//history/date'):
        d_type = (dnode.attrib.get("date-type") or "").lower()
        y = (dnode.findtext("year") or "").strip()
        m = (dnode.findtext("month") or "").strip()
        dd = (dnode.findtext("day") or "").strip()
        if not (y and m and dd):
            continue
        iso = _to_iso(y, m, dd)
        if not iso:
            continue

        if d_type in {"received", "recv"}:
            out["received_date"] = iso
        elif d_type in {"rev-recd", "revised", "revision-received"}:
            out["revised_dates"].append(iso)
        elif d_type in {"accepted", "accept"}:
            out["accepted_date"] = iso

    cnode = root.find('.//pub-date[@pub-type="collection"]')
    if cnode is not None:
        y = (cnode.findtext("year") or "").strip()
        m = (cnode.findtext("month") or "1").strip()
        dd = (cnode.findtext("day") or "1").strip()
        iso = _to_iso(y, m, dd) if y else None
        out["collection_date"] = iso

    out["revised_dates"] = sorted(set(out["revised_dates"]))
    return out


def _parse_text_fallback(text: str) -> Dict[str, Optional[str]]:
    out = {
        "received_date": None,
        "revised_dates": [],
        "accepted_date": None,
        "collection_date": None,
    }
    s = re.sub(r"\s+", " ", text)

    # Received 2023 Apr 18 / Received 18 Apr 2023
    pat_ymd = r"(\d{4})\s+([A-Za-z]+)\s+(\d{1,2})"
    pat_dmy = r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})"

    m = re.search(rf"Received\s+{pat_ymd}", s, flags=re.IGNORECASE)
    if m:
        out["received_date"] = _to_iso(m.group(1), m.group(2), m.group(3))
    else:
        m = re.search(rf"Received\s+{pat_dmy}", s, flags=re.IGNORECASE)
        if m:
            out["received_date"] = _to_iso(m.group(3), m.group(2), m.group(1))

    for m in re.finditer(rf"Revised\s+{pat_ymd}", s, flags=re.IGNORECASE):
        iso = _to_iso(m.group(1), m.group(2), m.group(3))
        if iso:
            out["revised_dates"].append(iso)
    for m in re.finditer(rf"Revised\s+{pat_dmy}", s, flags=re.IGNORECASE):
        iso = _to_iso(m.group(3), m.group(2), m.group(1))
        if iso:
            out["revised_dates"].append(iso)

    m = re.search(rf"Accepted\s+{pat_ymd}", s, flags=re.IGNORECASE)
    if m:
        out["accepted_date"] = _to_iso(m.group(1), m.group(2), m.group(3))
    else:
        m = re.search(rf"Accepted\s+{pat_dmy}", s, flags=re.IGNORECASE)
        if m:
            out["accepted_date"] = _to_iso(m.group(3), m.group(2), m.group(1))

    m = re.search(r"Collection date\s+(\d{4})(?:\s+([A-Za-z]+))?", s, flags=re.IGNORECASE)
    if m:
        y = m.group(1)
        mon = m.group(2) or "1"
        out["collection_date"] = _to_iso(y, mon, "1")

    out["revised_dates"] = sorted(set([d for d in out["revised_dates"] if d]))
    return out


def fetch_pmc_xml(pmcid: str) -> str:
    normalized = pmcid if pmcid.upper().startswith("PMC") else f"PMC{pmcid}"
    url = f"https://pmc.ncbi.nlm.nih.gov/articles/{normalized}/?page=1&format=flat"
    req = urllib.request.Request(url, headers={"User-Agent": "reviewtime-mvp/0.2"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def extract_pmc_events_from_xml(xml_text: str) -> Dict:
    try:
        root = ET.fromstring(xml_text)
        parsed = _parse_history_dates(root)
        method = "pmc_xml_structured"
    except Exception:
        parsed = _parse_text_fallback(xml_text)
        method = "pmc_text_fallback"

    revised_dates = parsed.get("revised_dates") or []
    revised_first = revised_dates[0] if revised_dates else None
    revised_last = revised_dates[-1] if revised_dates else None

    event_count = sum(
        1
        for x in [
            parsed.get("received_date"),
            revised_first,
            parsed.get("accepted_date"),
            parsed.get("collection_date"),
        ]
        if x
    )
    confidence = min(1.0, 0.25 * event_count)
    if parsed.get("received_date") and parsed.get("accepted_date"):
        confidence = max(confidence, 0.8)

    return {
        "received_date": parsed.get("received_date"),
        "revised_dates": revised_dates,
        "revised_first_date": revised_first,
        "revised_last_date": revised_last,
        "accepted_date": parsed.get("accepted_date"),
        "collection_date": parsed.get("collection_date"),
        "parse_method": method,
        "confidence_score": round(confidence, 3),
    }
