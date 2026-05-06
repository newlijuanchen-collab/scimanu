from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Tuple


def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def dedup_key(record: Dict) -> str:
    doi = (record.get("doi") or "").strip().lower()
    if doi:
        return f"doi:{doi}"
    pmcid = (record.get("pmcid") or "").strip().upper()
    if pmcid:
        return f"pmcid:{pmcid}"
    pmid = (record.get("pmid") or "").strip()
    if pmid:
        return f"pmid:{pmid}"
    title = (record.get("title") or "").strip().lower()
    journal = (record.get("journal_name") or "").strip().lower()
    pub_date = (record.get("publication_date") or "").strip()
    return f"fallback:{journal}|{title}|{pub_date}"


def item_id_from_key(key: str) -> str:
    h = hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]
    return f"itm_{h}"


def _days_between_iso(start_iso: Optional[str], end_iso: Optional[str]) -> Optional[int]:
    if not start_iso or not end_iso:
        return None
    try:
        s = datetime.fromisoformat(start_iso).date()
        e = datetime.fromisoformat(end_iso).date()
    except Exception:
        return None
    d = (e - s).days
    return d if d >= 0 else None


def normalize_article_record(raw: Dict) -> Dict:
    key = dedup_key(raw)
    now = _now_iso()

    revised_dates = raw.get("revised_dates") or []
    revised_dates = [x for x in revised_dates if x]
    revised_dates = sorted(set(revised_dates))

    received_date = raw.get("received_date")
    accepted_date = raw.get("accepted_date")
    revised_first = raw.get("revised_first_date") or (revised_dates[0] if revised_dates else None)
    revised_last = raw.get("revised_last_date") or (revised_dates[-1] if revised_dates else None)

    days_r2a = raw.get("days_received_to_accepted")
    if days_r2a is None:
        days_r2a = _days_between_iso(received_date, accepted_date)

    days_rev2a = raw.get("days_revised_last_to_accepted")
    if days_rev2a is None:
        days_rev2a = _days_between_iso(revised_last, accepted_date)

    record = {
        "item_id": item_id_from_key(key),
        "dedup_key": key,
        "pmid": raw.get("pmid"),
        "pmcid": raw.get("pmcid"),
        "doi": raw.get("doi"),
        "title": raw.get("title"),
        "journal_name": raw.get("journal") or raw.get("journal_name"),
        "journal_label": raw.get("journal_label"),
        "issn": raw.get("issn"),
        "publisher": raw.get("publisher"),
        "subject": raw.get("subject"),
        "article_type": (raw.get("publication_types") or [None])[0],
        "publication_types": raw.get("publication_types") or [],
        "publication_date": raw.get("pub_date") or raw.get("publication_date"),
        "received_date": received_date,
        "revised_dates": revised_dates,
        "revised_first_date": revised_first,
        "revised_last_date": revised_last,
        "accepted_date": accepted_date,
        "collection_date": raw.get("collection_date"),
        "online_date": raw.get("online_date"),
        "days_received_to_accepted": days_r2a,
        "days_revised_last_to_accepted": days_rev2a,
        "source_channel": raw.get("source_type") or raw.get("source_channel"),
        "source_url": raw.get("source_url"),
        "extraction_status": raw.get("fetch_status") or raw.get("extraction_status") or "unknown",
        "error_code": raw.get("error_code"),
        "retry_count": raw.get("retry_count") or 0,
        "confidence_score": float(raw.get("confidence_score") or 0.0),
        "parse_method": raw.get("parse_method"),
        "parser_version": "v0.3",
        "fetched_at": raw.get("fetched_at") or now,
        "updated_at": now,
    }
    return record


def validate_article_record(record: Dict) -> Tuple[bool, List[str]]:
    errors: List[str] = []
    for f in ["item_id", "dedup_key", "journal_name", "extraction_status", "fetched_at"]:
        if not record.get(f):
            errors.append(f"missing_required:{f}")

    d = record.get("days_received_to_accepted")
    if d is not None and d < 0:
        errors.append("invalid_days_received_to_accepted")

    c = record.get("confidence_score")
    if c is None or c < 0 or c > 1:
        errors.append("invalid_confidence_score")

    return (len(errors) == 0, errors)
