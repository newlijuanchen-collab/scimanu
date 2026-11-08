import type { JournalStats, TimeSeriesPoint } from '@/lib/types'

export type TrendTone = 'faster' | 'slower' | 'stable'

export interface DataCapabilities {
  hasSubjectCoverage: boolean
  hasPublisherCoverage: boolean
  hasTrendCoverage: boolean
  isSampleMode: boolean
}

export function getLatestYM(journal: JournalStats): string | null {
  if (journal.latest_sample_month) return journal.latest_sample_month
  if (journal.timeSeries && Array.isArray(journal.timeSeries) && journal.timeSeries.length > 0) {
    return journal.timeSeries[journal.timeSeries.length - 1]?.ym ?? null
  }
  return null
}

export function getTrendTone(trend: number): TrendTone {
  if (trend <= -5) return 'faster'
  if (trend >= 5) return 'slower'
  return 'stable'
}

export function getTrendDeltaLabel(trend: number): number {
  return Math.round(Math.abs(trend))
}

function monthIndex(ym: string): number | null {
  const match = /^(\d{4})-(\d{2})$/.exec(ym)
  if (!match) return null
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return Number(match[1]) * 12 + month - 1
}

/**
 * A "24-month" chart is only honest when it contains at least 24 distinct
 * monthly observations spanning at least 24 calendar months.
 */
export function hasMonthlyCoverage(series: TimeSeriesPoint[] | undefined, months = 24): boolean {
  if (!series?.length) return false
  const observedMonths = Array.from(new Set(
    series
      .filter(point => Number.isFinite(point.median) && point.count > 0)
      .map(point => point.ym),
  )).sort()
  if (observedMonths.length < months) return false

  const first = monthIndex(observedMonths[0])
  const last = monthIndex(observedMonths[observedMonths.length - 1])
  return first !== null && last !== null && last - first >= months - 1
}

export function getSubjectMedian(journals: JournalStats[], subject: string): number | null {
  const peers = journals.filter(j => j.subject === subject)
  if (!peers.length) return null
  const sorted = peers.map(j => j.median).sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[mid]
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

export function getRelativeDelta(current: number, baseline: number | null): number | null {
  if (!baseline || baseline <= 0) return null
  return Math.round(((baseline - current) / baseline) * 100)
}

export function getSubjectRank(journals: JournalStats[], current: JournalStats): { rank: number; total: number } | null {
  const peers = journals
    .filter(j => j.subject === current.subject)
    .sort((a, b) => a.median - b.median)

  if (!peers.length) return null
  const index = peers.findIndex(j => j.label === current.label)
  if (index === -1) return null
  return { rank: index + 1, total: peers.length }
}

export function getDataCapabilities(journals: JournalStats[]): DataCapabilities {
  const nonUnknownPublishers = new Set(
    journals
      .map(j => (j.publisher ?? '').trim())
      .filter(value => value && value.toLowerCase() !== 'unknown'),
  )
  const meaningfulSubjects = new Set(
    journals
      .map(j => (j.subject ?? '').trim())
      .filter(value => value && value.toLowerCase() !== 'general'),
  )
  const trendSignals = journals.filter(j => j.trend_eligible && Math.abs(j.trend) >= 5).length
  const maxCount = Math.max(0, ...journals.map(j => j.count))

  return {
    hasSubjectCoverage: meaningfulSubjects.size >= 2,
    hasPublisherCoverage: nonUnknownPublishers.size >= 2,
    hasTrendCoverage: trendSignals >= Math.max(3, Math.ceil(journals.length * 0.05)),
    isSampleMode: maxCount < 80 || meaningfulSubjects.size === 0 || nonUnknownPublishers.size === 0,
  }
}

export function getDisplayPublisher(journal: JournalStats): string | null {
  const publisher = (journal.publisher ?? '').trim()
  if (!publisher || publisher.toLowerCase() === 'unknown') return null
  return publisher
}

export function getDisplaySubject(journal: JournalStats): string | null {
  const subject = (journal.subject ?? '').trim()
  if (!subject || subject.toLowerCase() === 'general') return null
  return subject
}
