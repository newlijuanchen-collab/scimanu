/**
 * data-loader.ts
 * Data cleaning and aggregation utilities.
 */

import type { RawRow, CleanRow, JournalStats, GlobalStats, LoadedData, JournalFilter } from './types'

const MIN_DAYS = 1
const MAX_DAYS = 1000

// ─── Utility functions ───────────────────────────────────────────────────────

/** Linear interpolation percentile (matches numpy default) */
export function percentile(sorted: number[], p: number): number {
  if (!sorted || sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo])
}

export function median(sorted: number[]): number {
  return percentile(sorted, 50)
}

export function toYM(dateVal: Date | number | string | null | undefined): string | null {
  if (!dateVal) return null
  let d: Date
  if (dateVal instanceof Date) {
    d = dateVal
  } else if (typeof dateVal === 'number') {
    d = new Date(Math.round((dateVal - 25569) * 86400 * 1000))
  } else {
    d = new Date(dateVal)
  }
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function parseDate(val: Date | number | string | null | undefined): Date | null {
  if (!val) return null
  if (val instanceof Date) return val
  if (typeof val === 'number') {
    return new Date(Math.round((val - 25569) * 86400 * 1000))
  }
  const d = new Date(val as string)
  return isNaN(d.getTime()) ? null : d
}

// ─── Cleaning ────────────────────────────────────────────────────────────────

export function cleanRows(rows: RawRow[]): CleanRow[] {
  return rows
    .map(r => {
      const days = Number(
        r.days_received_to_accepted ??
        r['Days Received→Accepted'] ??
        r.days_review ??
        0
      )
      const journalName = String(r.journal_name ?? r['Journal Name'] ?? r.journal ?? '').trim()
      const journalLabel = String(
        r.journal_label ?? r['Journal Label'] ?? r.journal_abbr ?? journalName
      ).trim()

      return {
        journal_name:   journalName,
        journal_label:  journalLabel || journalName,
        issn:           String(r.issn ?? r['ISSN'] ?? '').trim(),
        publisher:      String(r.publisher ?? r['Publisher'] ?? 'Unknown').trim(),
        subject:        String(r.subject ?? r['Subject'] ?? r.category ?? 'General').trim(),
        received_date:  parseDate(r.received_date ?? r['Received Date'] ?? r.received),
        accepted_date:  parseDate(r.accepted_date ?? r['Accepted Date'] ?? r.accepted),
        online_date:    parseDate(r.online_date ?? r['Online Date'] ?? r.published),
        days,
        status:         String(r.extraction_status ?? r['Status'] ?? 'ok').trim(),
        confidence:     Number(r.confidence_score ?? r['Confidence'] ?? 1.0),
        doi:            String(r.doi ?? r['DOI'] ?? '').trim(),
        title:          String(r.title ?? r['Title'] ?? '').trim(),
      } as CleanRow
    })
    .filter(r => {
      if (!r.journal_label && !r.journal_name) return false
      if (r.days < MIN_DAYS || r.days > MAX_DAYS) return false
      return true
    })
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

export function aggregateByJournal(rows: CleanRow[]): JournalStats[] {
  const map = new Map<string, {
    label: string; name: string; issn: string; publisher: string; subject: string
    days: number[]; byYM: Record<string, number[]>; articles: CleanRow[]
  }>()

  rows.forEach(r => {
    const key = r.journal_label || r.journal_name
    if (!map.has(key)) {
      map.set(key, {
        label: key,
        name: r.journal_name || key,
        issn: r.issn,
        publisher: r.publisher,
        subject: r.subject,
        days: [],
        byYM: {},
        articles: [],
      })
    }
    const entry = map.get(key)!
    entry.days.push(r.days)
    entry.articles.push(r)

    const ym = toYM(r.accepted_date) || toYM(r.received_date)
    if (ym) {
      if (!entry.byYM[ym]) entry.byYM[ym] = []
      entry.byYM[ym].push(r.days)
    }
  })

  const result: JournalStats[] = []
  map.forEach((entry) => {
    const sorted = [...entry.days].sort((a, b) => a - b)
    const byYMStats: Record<string, { count: number; median: number; p25: number; p75: number }> = {}

    Object.entries(entry.byYM).forEach(([ym, vals]) => {
      const s = [...vals].sort((a, b) => a - b)
      byYMStats[ym] = {
        count:  s.length,
        median: Math.round(median(s)),
        p25:    Math.round(percentile(s, 25)),
        p75:    Math.round(percentile(s, 75)),
      }
    })

    const now = new Date()
    const cutoff6  = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const cutoff24 = new Date(now.getFullYear(), now.getMonth() - 24, 1)
    const recent6  = entry.articles
      .filter(a => a.accepted_date && a.accepted_date >= cutoff6)
      .map(a => a.days).sort((a, b) => a - b)
    const recent24 = entry.articles
      .filter(a => a.accepted_date && a.accepted_date >= cutoff24)
      .map(a => a.days).sort((a, b) => a - b)
    const med6  = recent6.length  >= 3 ? Math.round(median(recent6))  : null
    const med24 = recent24.length >= 3 ? Math.round(median(recent24)) : null
    const trend = (med6 !== null && med24 !== null) ? med6 - med24 : 0

    result.push({
      label:      entry.label,
      name:       entry.name,
      issn:       entry.issn,
      publisher:  entry.publisher,
      subject:    entry.subject,
      count:      sorted.length,
      median:     Math.round(median(sorted)),
      p25:        Math.round(percentile(sorted, 25)),
      p75:        Math.round(percentile(sorted, 75)),
      min:        sorted[0],
      max:        sorted[sorted.length - 1],
      byYM:       byYMStats,
      timeSeries: Object.entries(byYMStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([ym, s]) => ({ ym, ...s })),
      trend,
      med6,
      med24,
      articles: entry.articles,
    })
  })

  return result.sort((a, b) => a.median - b.median)
}

// ─── Global Stats ─────────────────────────────────────────────────────────────

export function computeGlobalStats(rows: CleanRow[], journals: JournalStats[]): GlobalStats {
  const allDays = rows.map(r => r.days).sort((a, b) => a - b)
  const publishers = Array.from(new Set(rows.map(r => r.publisher).filter(Boolean))).sort()
  const subjects   = Array.from(new Set(rows.map(r => r.subject).filter(Boolean))).sort()

  const globalByYM: Record<string, number[]> = {}
  rows.forEach(r => {
    const ym = toYM(r.accepted_date) || toYM(r.received_date)
    if (!ym) return
    if (!globalByYM[ym]) globalByYM[ym] = []
    globalByYM[ym].push(r.days)
  })

  const globalTimeSeries = Object.entries(globalByYM)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, vals]) => {
      const s = [...vals].sort((a, b) => a - b)
      return {
        ym,
        count:  s.length,
        median: Math.round(median(s)),
        p25:    Math.round(percentile(s, 25)),
        p75:    Math.round(percentile(s, 75)),
      }
    })

  return {
    totalJournals:  journals.length,
    totalArticles:  rows.length,
    globalMedian:   Math.round(median(allDays)),
    globalP25:      Math.round(percentile(allDays, 25)),
    globalP75:      Math.round(percentile(allDays, 75)),
    publishers,
    subjects,
    globalTimeSeries,
    fastest: journals[0] || null,
  }
}

export function buildLoadedData(rawRows: RawRow[]): LoadedData {
  const rows = cleanRows(rawRows)
  const journals = aggregateByJournal(rows)
  const stats = computeGlobalStats(rows, journals)
  return { rows, journals, stats }
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export function filterJournals(journals: JournalStats[], filter: JournalFilter = {}): JournalStats[] {
  const {
    publishers = [],
    subjects = [],
    minCount = 1,
    maxMedian = Infinity,
    minMedian = 0,
  } = filter

  return journals.filter(j => {
    if (j.count < minCount) return false
    if (j.median < minMedian || j.median > maxMedian) return false
    if (publishers.length && !publishers.includes(j.publisher)) return false
    if (subjects.length && !subjects.includes(j.subject)) return false
    return true
  })
}
