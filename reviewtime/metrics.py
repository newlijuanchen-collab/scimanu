from __future__ import annotations

from datetime import date
from typing import Dict, Optional


def _days_between(start: Optional[date], end: Optional[date]) -> Optional[int]:
    if not start or not end:
        return None
    delta = (end - start).days
    if delta < 0:
        return None
    return delta


def compute_durations(events: Dict[str, Optional[date]]) -> Dict[str, Optional[int]]:
    received = events.get("received")
    revised = events.get("revised")
    accepted = events.get("accepted")
    online = events.get("available_online")
    vor = events.get("version_of_record")

    return {
        "days_received_to_revised": _days_between(received, revised),
        "days_received_to_accepted": _days_between(received, accepted),
        "days_revised_to_accepted": _days_between(revised, accepted),
        "days_accepted_to_online": _days_between(accepted, online),
        "days_online_to_vor": _days_between(online, vor),
    }
