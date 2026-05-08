import fs from 'node:fs/promises'
import path from 'node:path'
import type { JournalStats, LoadedData, TimeSeriesPoint } from '@/lib/types'

function getSnapshotDir() {
  const configured = process.env.REVIEWTIME_SNAPSHOT_DIR?.trim()
  if (configured) return path.resolve(process.cwd(), configured)
  return path.resolve(process.cwd(), '../out/snapshots')
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }

  out.push(cur)
  return out
}

async function readCsvRows(filePath: string): Promise<Record<string, string>[]> {
  const text = await fs.readFile(filePath, 'utf-8')
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trimEnd())
    .filter(Boolean)

  if (!lines.length) return []
  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map(line => {
    const cols = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? ''
    })
    return row
  })
}

function toNum(value: string | undefined, fallback = 0): number {
  if (value === undefined || value === null || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toNullableNum(value: string | undefined): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function mapJournalRows(
  journalStatsRows: Record<string, string>[],
  journalTrendRows: Record<string, string>[],
): JournalStats[] {
  const byLabel: Record<string, TimeSeriesPoint[]> = {}

  for (const row of journalTrendRows) {
    const label = row.journal_label || ''
    if (!label) continue
    if (!byLabel[label]) byLabel[label] = []
    byLabel[label].push({
      ym: row.ym || '',
      count: toNum(row.count),
      median: toNum(row.median),
      p25: toNum(row.p25),
      p75: toNum(row.p75),
    })
  }

  return journalStatsRows.map(row => {
    const label = row.journal_label || row.journal_name || 'Unknown Journal'
    const timeSeries = (byLabel[label] ?? [])
      .filter(p => p.ym)
      .sort((a, b) => a.ym.localeCompare(b.ym))
    const byYM = Object.fromEntries(timeSeries.map(p => [p.ym, {
      count: p.count,
      median: p.median,
      p25: p.p25,
      p75: p.p75,
    }]))

    return {
      label,
      name: row.journal_name || label,
      issn: row.issn || '',
      publisher: row.publisher || 'Unknown',
      subject: row.subject || 'General',
      count: toNum(row.count),
      median: toNum(row.median),
      p25: toNum(row.p25),
      p75: toNum(row.p75),
      min: toNum(row.min),
      max: toNum(row.max),
      byYM,
      timeSeries,
      trend: toNum(row.trend),
      med6: toNullableNum(row.med6),
      med24: toNullableNum(row.med24),
      articles: [],
    }
  })
}

export async function loadReviewDataFromSupabase(): Promise<LoadedData> {
  const baseDir = getSnapshotDir()
  const [journalStatsRows, journalTrendRows, globalTrendRows, globalSummaryRows] = await Promise.all([
    readCsvRows(path.join(baseDir, 'snapshot_journal_stats.csv')),
    readCsvRows(path.join(baseDir, 'snapshot_journal_trend.csv')),
    readCsvRows(path.join(baseDir, 'snapshot_global_trend.csv')),
    readCsvRows(path.join(baseDir, 'snapshot_global_summary.csv')),
  ])

  const journals = mapJournalRows(journalStatsRows, journalTrendRows)
    .sort((a, b) => a.median - b.median)
  const summary = globalSummaryRows[0] ?? {}
  const globalTimeSeries: TimeSeriesPoint[] = globalTrendRows
    .map(row => ({
      ym: row.ym || '',
      count: toNum(row.count),
      median: toNum(row.median),
      p25: toNum(row.p25),
      p75: toNum(row.p75),
    }))
    .filter(p => p.ym)
    .sort((a, b) => a.ym.localeCompare(b.ym))

  const fastestName = summary.fastest_journal || ''
  const fastest = journals.find(j => j.label === fastestName) ?? journals[0] ?? null

  return {
    rows: [],
    journals,
    stats: {
      totalJournals: toNum(summary.total_journals, journals.length),
      totalArticles: toNum(summary.total_articles, journals.reduce((acc, j) => acc + j.count, 0)),
      globalMedian: toNum(summary.global_median),
      globalP25: toNum(summary.global_p25),
      globalP75: toNum(summary.global_p75),
      publishers: [...new Set(journals.map(j => j.publisher).filter(Boolean))].sort(),
      subjects: [...new Set(journals.map(j => j.subject).filter(Boolean))].sort(),
      globalTimeSeries,
      fastest,
    },
  }
}
