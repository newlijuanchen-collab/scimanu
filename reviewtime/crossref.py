from __future__ import annotations

import json
import urllib.parse
import urllib.request
from datetime import date
from typing import Dict, List, Optional


def _date_parts_to_iso(parts: Optional[List[List[int]]]) -> Optional[str]:
    if not parts:
        return None
    p = parts[0]
    if not p:
        return None
    year = p[0]
    month = p[1] if len(p) >= 2 else 1
    day = p[2] if len(p) >= 3 else 1
    return date(year, month, day).isoformat()


def fetch_works_for_issn(
    issn: str,
    from_pub_date: str,
    until_pub_date: str,
    rows: int = 50,
    mailto: Optional[str] = None,
) -> List[Dict]:
    filters = f"from-pub-date:{from_pub_date},until-pub-date:{until_pub_date},issn:{issn},type:journal-article"
    params = {
        "filter": filters,
        "rows": str(rows),
        "select": "DOI,title,container-title,issued,published-online,published-print,created,ISSN",
    }
    if mailto:
        params["mailto"] = mailto

    url = "https://api.crossref.org/works?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "reviewtime-mvp/0.1"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    items = payload.get("message", {}).get("items", [])
    out = []
    for it in items:
        title_list = it.get("title") or []
        journal_list = it.get("container-title") or []

        out.append(
            {
                "doi": it.get("DOI"),
                "title": title_list[0] if title_list else None,
                "journal": journal_list[0] if journal_list else "unknown",
                "issn": (it.get("ISSN") or [None])[0],
                "issued_date": _date_parts_to_iso(it.get("issued", {}).get("date-parts")),
                "published_online_date": _date_parts_to_iso(it.get("published-online", {}).get("date-parts")),
                "published_print_date": _date_parts_to_iso(it.get("published-print", {}).get("date-parts")),
                "created_date": _date_parts_to_iso(it.get("created", {}).get("date-parts")),
            }
        )

    return out
