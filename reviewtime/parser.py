from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from typing import Dict, Optional


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


EVENT_ALIASES = {
    "received": [r"received"],
    "revised": [r"revised", r"revision received"],
    "accepted": [r"accepted"],
    "available_online": [r"available online", r"online", r"published online"],
    "version_of_record": [r"version of record"],
}


@dataclass
class ParsedEvents:
    received: Optional[date] = None
    revised: Optional[date] = None
    accepted: Optional[date] = None
    available_online: Optional[date] = None
    version_of_record: Optional[date] = None

    def to_dict(self) -> Dict[str, Optional[str]]:
        return {
            "received": self.received.isoformat() if self.received else None,
            "revised": self.revised.isoformat() if self.revised else None,
            "accepted": self.accepted.isoformat() if self.accepted else None,
            "available_online": self.available_online.isoformat() if self.available_online else None,
            "version_of_record": self.version_of_record.isoformat() if self.version_of_record else None,
        }


def _normalize_text(text: str) -> str:
    # unify separators and spaces
    cleaned = text.replace(";", ",")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def _parse_date_str(date_str: str) -> Optional[date]:
    s = date_str.strip().replace(".", "")

    # 13 November 2025 / 13 Nov 2025
    m = re.match(r"^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$", s)
    if m:
        d, mon_raw, y = m.groups()
        mon = MONTHS.get(mon_raw.lower())
        if mon:
            return date(int(y), mon, int(d))

    # November 13 2025 / Nov 13 2025
    m = re.match(r"^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$", s)
    if m:
        mon_raw, d, y = m.groups()
        mon = MONTHS.get(mon_raw.lower())
        if mon:
            return date(int(y), mon, int(d))

    # 2025-11-13
    m = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", s)
    if m:
        y, mon, d = m.groups()
        return date(int(y), int(mon), int(d))

    # 2025 Nov 13 / 2025 November 13
    m = re.match(r"^(\d{4})\s+([A-Za-z]+)\s+(\d{1,2})$", s)
    if m:
        y, mon_raw, d = m.groups()
        mon = MONTHS.get(mon_raw.lower())
        if mon:
            return date(int(y), mon, int(d))

    return None


def parse_events(text: str) -> ParsedEvents:
    cleaned = _normalize_text(text)
    events = ParsedEvents()

    # capture chunks like: Received 13 November 2025
    # and stop at next comma or line end
    for event_key, aliases in EVENT_ALIASES.items():
        found_date = None
        for alias in aliases:
            pattern = rf"(?:^|,\s*){alias}\s*[:\-]?\s*([^,]+)"
            match = re.search(pattern, cleaned, flags=re.IGNORECASE)
            if not match:
                continue

            date_candidate = match.group(1).strip()
            parsed = _parse_date_str(date_candidate)
            if parsed:
                found_date = parsed
                break

        if found_date is not None:
            setattr(events, event_key, found_date)

    return events
