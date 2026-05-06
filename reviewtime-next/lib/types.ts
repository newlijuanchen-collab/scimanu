// ─── Core Data Types ────────────────────────────────────────────────────────

export interface RawRow {
  journal_name?: string
  journal_label?: string
  issn?: string
  publisher?: string
  subject?: string
  received_date?: Date | number | string | null
  accepted_date?: Date | number | string | null
  online_date?: Date | number | string | null
  days_received_to_accepted?: number
  extraction_status?: string
  confidence_score?: number
  doi?: string
  title?: string
  // alternate field names
  'Journal Name'?: string
  'Journal Label'?: string
  'ISSN'?: string
  'Publisher'?: string
  'Subject'?: string
  'Received Date'?: Date | number | string
  'Accepted Date'?: Date | number | string
  'Online Date'?: Date | number | string
  'Days Received→Accepted'?: number
  days_review?: number
  journal?: string
  journal_abbr?: string
  received?: Date | number | string
  accepted?: Date | number | string
  published?: Date | number | string
  Status?: string
  Confidence?: number
  DOI?: string
  Title?: string
  category?: string
}

export interface CleanRow {
  journal_name: string
  journal_label: string
  issn: string
  publisher: string
  subject: string
  received_date: Date | null
  accepted_date: Date | null
  online_date: Date | null
  days: number
  status: string
  confidence: number
  doi: string
  title: string
}

export interface YMStats {
  count: number
  median: number
  p25: number
  p75: number
}

export interface TimeSeriesPoint extends YMStats {
  ym: string
}

export interface JournalStats {
  label: string
  name: string
  issn: string
  publisher: string
  subject: string
  count: number
  median: number
  p25: number
  p75: number
  min: number
  max: number
  byYM: Record<string, YMStats>
  timeSeries: TimeSeriesPoint[]
  trend: number       // negative = faster recently, positive = slower
  med6: number | null
  med24: number | null
  articles: CleanRow[]
}

export interface GlobalStats {
  totalJournals: number
  totalArticles: number
  globalMedian: number
  globalP25: number
  globalP75: number
  publishers: string[]
  subjects: string[]
  globalTimeSeries: TimeSeriesPoint[]
  fastest: JournalStats | null
}

export interface LoadedData {
  rows: CleanRow[]
  journals: JournalStats[]
  stats: GlobalStats
}

// ─── Filter Types ────────────────────────────────────────────────────────────

export interface JournalFilter {
  publishers?: string[]
  subjects?: string[]
  minCount?: number
  maxMedian?: number
  minMedian?: number
}

// ─── Speed / UI Types ────────────────────────────────────────────────────────

export type SpeedTier = 'vfast' | 'fast' | 'good' | 'normal' | 'slow' | 'vslow'

export interface SpeedInfo {
  tier: SpeedTier
  index: number
  color: string
}

export const SPEED_COLORS: Record<SpeedTier, string> = {
  vfast:  '#2b8a3e',
  fast:   '#2fb344',
  good:   '#94d82d',
  normal: '#f59f00',
  slow:   '#f76707',
  vslow:  '#d63939',
}

export const SPEED_ORDER: SpeedTier[] = ['vfast', 'fast', 'good', 'normal', 'slow', 'vslow']

export function getSpeedInfo(days: number): SpeedInfo {
  if (days <= 30)  return { tier: 'vfast',  index: 0, color: SPEED_COLORS.vfast }
  if (days <= 60)  return { tier: 'fast',   index: 1, color: SPEED_COLORS.fast }
  if (days <= 90)  return { tier: 'good',   index: 2, color: SPEED_COLORS.good }
  if (days <= 120) return { tier: 'normal', index: 3, color: SPEED_COLORS.normal }
  if (days <= 180) return { tier: 'slow',   index: 4, color: SPEED_COLORS.slow }
  return             { tier: 'vslow',  index: 5, color: SPEED_COLORS.vslow }
}

export const CHART_PALETTE = [
  '#206bc4','#2fb344','#f76707','#d63939','#ae3ec9',
  '#0ca678','#f59f00','#4dabf7','#e64980','#74c0fc',
]
