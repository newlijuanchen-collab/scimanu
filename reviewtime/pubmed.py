from __future__ import annotations

import json
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional


MONTHS = {
    "jan": "01",
    "feb": "02",
    "mar": "03",
    "apr": "04",
    "may": "05",
    "jun": "06",
    "jul": "07",
    "aug": "08",
    "sep": "09",
    "oct": "10",
    "nov": "11",
    "dec": "12",
}


def _get_text(node: Optional[ET.Element]) -> Optional[str]:
    if node is None:
        return None
    text = "".join(node.itertext()).strip()
    return text or None


def _pub_date_to_iso(pub_date_node: Optional[ET.Element]) -> Optional[str]:
    if pub_date_node is None:
        return None
    year = _get_text(pub_date_node.find("Year"))
    month = _get_text(pub_date_node.find("Month"))
    day = _get_text(pub_date_node.find("Day"))

    if not year:
        medline = _get_text(pub_date_node.find("MedlineDate"))
        if medline and medline[:4].isdigit():
            return f"{medline[:4]}-01-01"
        return None

    if not month:
        return f"{year}-01-01"

    month_num = MONTHS.get(month.lower()[:3], None)
    if month_num is None:
        month_num = month.zfill(2) if month.isdigit() else "01"

    if not day:
        return f"{year}-{month_num}-01"
    return f"{year}-{month_num}-{day.zfill(2)}"


def search_pubmed_ids(term: str, retmax: int = 200) -> List[str]:
    params = {
        "db": "pubmed",
        "retmode": "json",
        "retmax": str(retmax),
        "term": term,
    }
    url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "reviewtime-mvp/0.2"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload.get("esearchresult", {}).get("idlist", [])


def fetch_pubmed_articles(pmids: List[str]) -> List[Dict]:
    if not pmids:
        return []

    params = {
        "db": "pubmed",
        "retmode": "xml",
        "id": ",".join(pmids),
    }
    url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "reviewtime-mvp/0.2"})
    with urllib.request.urlopen(req, timeout=40) as resp:
        xml_bytes = resp.read()

    root = ET.fromstring(xml_bytes)
    out: List[Dict] = []

    for article_node in root.findall(".//PubmedArticle"):
        pmid = _get_text(article_node.find(".//MedlineCitation/PMID"))
        title = _get_text(article_node.find(".//Article/ArticleTitle"))
        journal = _get_text(article_node.find(".//Article/Journal/Title"))
        issn = _get_text(article_node.find(".//Article/Journal/ISSN"))
        pub_date_iso = _pub_date_to_iso(article_node.find(".//Article/Journal/JournalIssue/PubDate"))

        publication_types = [
            _get_text(n) for n in article_node.findall(".//Article/PublicationTypeList/PublicationType")
        ]
        publication_types = [x for x in publication_types if x]

        doi = None
        pmcid = None
        for id_node in article_node.findall(".//PubmedData/ArticleIdList/ArticleId"):
            id_type = (id_node.attrib.get("IdType") or "").lower()
            val = _get_text(id_node)
            if not val:
                continue
            if id_type == "doi":
                doi = val
            elif id_type == "pmc":
                pmcid = val

        # --- Parse PubMed History (received / revised / accepted) ---
        received_date: Optional[str] = None
        revised_dates: list = []
        accepted_date: Optional[str] = None
        for hist_node in article_node.findall(".//PubmedData/History/PubMedPubDate"):
            status = (hist_node.attrib.get("PubStatus") or "").lower()
            y = _get_text(hist_node.find("Year"))
            m = _get_text(hist_node.find("Month"))
            d = _get_text(hist_node.find("Day"))
            if not (y and m and d):
                continue
            m_num = MONTHS.get(m.lower()[:3], None)
            if m_num is None:
                m_num = m.zfill(2) if m.isdigit() else "01"
            else:
                m_num = str(m_num).zfill(2)
            iso = f"{y}-{m_num}-{d.zfill(2)}"
            if status == "received":
                received_date = iso
            elif status in {"revised", "rev-recd", "revision-received"}:
                revised_dates.append(iso)
            elif status == "accepted":
                accepted_date = iso
        revised_dates = sorted(set(revised_dates))

        out.append(
            {
                "pmid": pmid,
                "pmcid": pmcid,
                "doi": doi,
                "title": title,
                "journal": journal,
                "issn": issn,
                "pub_date": pub_date_iso,
                "publication_types": publication_types,
                "received_date": received_date,
                "revised_dates": revised_dates,
                "revised_first_date": revised_dates[0] if revised_dates else None,
                "revised_last_date": revised_dates[-1] if revised_dates else None,
                "accepted_date": accepted_date,
            }
        )

    return out
