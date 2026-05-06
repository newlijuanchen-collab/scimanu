"""manual_patch.py – parse free-text article snippets dropped into a folder.

Workflow:
  1. Copy text from a publisher page (e.g. MDPI) and paste into a .txt file
     under  data/manual_patches/  – one or more articles per file, blocks
     separated by blank lines.
  2. Run:
       python -m reviewtime.cli ingest-manual \\
           --input-dir data/manual_patches \\
           --output-sqlite out/articles_master.db \\
           --output-articles out/articles_master.jsonl

Expected text format (MDPI example)::

    Can the Accrual Anomaly Be Explained by Credit Risk?
    by Foong Soon Cheong
    Account. Audit. 2025, 1(2), 6; https://doi.org/10.3390/accountaudit1020006
    Submission received: 19 May 2025 / Revised: 25 June 2025 / Accepted: 2 July 2025 / Published: 14 July 2025

Multiple articles in the same file are separated by one or more blank lines.
"""

from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from .parser import parse_events


# ---------------------------------------------------------------------------
# Regex helpers
# ---------------------------------------------------------------------------

_DOI_URL_RE = re.compile(r"https?://doi\.org/(10\.\S+)", re.IGNORECASE)
_DOI_BARE_RE = re.compile(r"\b(10\.\d{4,}/\S+)", re.IGNORECASE)
_PUB_YEAR_RE = re.compile(r"\b(\d{4}),\s*\d+\(")
_JOURNAL_CITE_RE = re.compile(r"^(.+?)\s+\d{4},\s*\d+\(", re.MULTILINE)


def _clean_doi(raw: str) -> str:
    """Strip trailing punctuation that might be captured by broad regex."""
    return raw.rstrip(".,;)")


def _extract_doi(block: str) -> Optional[str]:
    m = _DOI_URL_RE.search(block)
    if m:
        return _clean_doi(m.group(1))
    m = _DOI_BARE_RE.search(block)
    if m:
        return _clean_doi(m.group(1))
    return None


def _extract_pub_date(block: str) -> Optional[str]:
    m = _PUB_YEAR_RE.search(block)
    if m:
        return f"{m.group(1)}-01-01"
    return None


def _extract_journal_label(block: str) -> Optional[str]:
    m = _JOURNAL_CITE_RE.search(block)
    if m:
        return m.group(1).strip()
    return None


def _extract_title(block: str) -> Optional[str]:
    """Return the first line that doesn't look like metadata."""
    _skip = re.compile(
        r"^(https?://|by |Submission|Received|Revised|Accepted|Published|10\.\d|\d{4},)",
        re.IGNORECASE,
    )
    for ln in block.strip().splitlines():
        ln = ln.strip()
        if ln and not _skip.match(ln):
            return ln
    return None


def _extract_source_url(block: str, doi: str) -> Optional[str]:
    """Prefer an explicit publisher URL in the block; fall back to doi.org."""
    # e.g. https://www.mdpi.com/3042-6618/1/2/6
    m = re.search(r"https://www\.mdpi\.com/\S+", block)
    if m:
        return _clean_doi(m.group(0))
    # Generic publisher URL (not doi.org)
    m = re.search(r"https?://(?!doi\.org)\S+", block)
    if m:
        return _clean_doi(m.group(0))
    return f"https://doi.org/{doi}"


def _preprocess_date_line(text: str) -> str:
    """Normalise the MDPI-style 'A / B / C' date line for parse_events().

    parse_events() expects comma-separated tokens and knows labels like
    'Received', 'Revised', 'Accepted', 'Available online'.
    """
    # "Submission received:" -> "Received:"
    text = re.sub(r"Submission\s+received", "Received", text, flags=re.IGNORECASE)
    # "Published:" -> "Available online:" (maps to available_online field)
    text = re.sub(r"\bPublished\b", "Available online", text, flags=re.IGNORECASE)
    # " / " -> ", "  so parse_events sees comma-separated chunks
    text = text.replace(" / ", ", ")
    return text


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_HISTORY_LINE_RE = re.compile(
    r"(?:Submission\s+received|Received|Revised|Accepted|Published).+",
    re.IGNORECASE,
)


def _extract_history_line(block: str) -> str:
    """Pull out the history date line(s) and normalise for parse_events().

    parse_events() expects comma-separated label:date chunks and the first
    token must appear at start-of-string or after a comma.  We therefore
    extract only the history line, pre-process it, and ensure it starts the
    string that is fed to the parser.
    """
    for line in block.splitlines():
        if _HISTORY_LINE_RE.match(line.strip()):
            return _preprocess_date_line(line.strip())
    # Fallback: pre-process the whole block
    return _preprocess_date_line(block)


def parse_manual_patch_block(block: str) -> Optional[Dict]:
    """Parse a single free-text block (one article) into a raw record dict.

    Returns None if no DOI can be found (block is treated as non-article content).
    """
    block = block.strip()
    if not block:
        return None

    doi = _extract_doi(block)
    if not doi:
        return None  # DOI is the dedup key – skip if absent

    doi = doi.lower()
    history_line = _extract_history_line(block)
    events = parse_events(history_line)

    received   = events.received.isoformat()        if events.received        else None
    revised    = events.revised.isoformat()         if events.revised         else None
    accepted   = events.accepted.isoformat()        if events.accepted        else None
    online     = events.available_online.isoformat() if events.available_online else None

    revised_dates = sorted({d for d in [revised] if d})

    # publication_date: prefer Published > Accepted > year-only fallback
    pub_date = online or accepted or _extract_pub_date(block)

    return {
        "doi":                        doi,
        "pmid":                       None,
        "pmcid":                      None,
        "title":                      _extract_title(block),
        "journal":                    _extract_journal_label(block),
        "journal_label":              _extract_journal_label(block),
        "issn":                       None,
        "pub_date":                   pub_date,
        "publication_types":          ["Journal Article"],
        "received_date":              received,
        "revised_dates":              revised_dates,
        "revised_first_date":         revised_dates[0] if revised_dates else None,
        "revised_last_date":          revised_dates[-1] if revised_dates else None,
        "accepted_date":              accepted,
        "online_date":                online,
        "collection_date":            None,
        "source_type":                "manual_patch",
        "source_url":                 _extract_source_url(block, doi),
        "fetch_status":               "ok",
        "error_code":                 None,
        "retry_count":                0,
        "confidence_score":           0.9,
        "parse_method":               "manual_patch_text",
        "fetched_at":                 datetime.utcnow().isoformat() + "Z",
    }


def load_patches_from_dir(patch_dir: Path) -> List[Dict]:
    """Scan *patch_dir* for *.txt files and parse every article block found.

    Blocks inside a file are separated by one or more blank lines.
    Files are processed in alphabetical order.
    """
    results: List[Dict] = []
    txt_files = sorted(patch_dir.glob("*.txt"))
    for fpath in txt_files:
        text = fpath.read_text(encoding="utf-8", errors="replace")
        blocks = re.split(r"\n[ \t]*\n", text)
        for block in blocks:
            raw = parse_manual_patch_block(block)
            if raw is not None:
                results.append(raw)
    return results
