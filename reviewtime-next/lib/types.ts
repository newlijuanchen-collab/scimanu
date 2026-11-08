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
  p90?: number
}

export interface TimelinePoint {
  ym: string
  days: number
}

export interface NumericSummary {
  count: number
  median: number | null
  p25: number | null
  p75: number | null
  p90: number | null
  min?: number | null
  max?: number | null
}

export interface ReviewPathSummary {
  path: string
  label: string
  count: number
  share: number
  first_feedback_window: string
  final_acceptance_window: string
  total_wait_window: string
  final_tail_window: string
  rounds: string
}

export interface ReviewProcessSummary {
  total_wait: NumericSummary
  first_feedback: NumericSummary
  revision_rounds: NumericSummary
  final_acceptance_tail: NumericSummary
  no_revision_recorded_rate: number
  common_paths: ReviewPathSummary[]
}

export interface ReviewProcessPeriod {
  period: string
  count: number
  total_wait: NumericSummary
  first_feedback: NumericSummary
  revision_rounds: NumericSummary
  final_acceptance_tail: NumericSummary
}

export interface ArticleTypeBreakdown {
  article_type: string
  count: number
  share: number
  total_wait: NumericSummary
  first_feedback: NumericSummary
  revision_rounds: NumericSummary
  final_acceptance_tail: NumericSummary
  no_revision_recorded_rate: number
  periods?: ReviewProcessPeriod[]
}

export interface JournalStats {
  journal_key?: string
  url_slug?: string
  url_path?: string
  source_key?: string
  source_display?: string
  label: string
  name: string
  issn: string
  publisher: string
  subject: string
  count: number
  median: number
  p25: number
  p75: number
  p90?: number
  min: number
  max: number
  timeline_coverage?: number
  coverage_start?: string
  coverage_end?: string
  latest_fetched_at?: string
  latest_sample_month?: string
  rolling_24m?: {
    count: number
    median: number | null
    p25: number | null
    p75: number | null
    p90: number | null
  }
  rolling_60m?: {
    count: number
    median: number | null
    p25: number | null
    p75: number | null
    p90: number | null
  }
  byYM: Record<string, YMStats>
  timeSeries: TimeSeriesPoint[]
  timelinePoints?: TimelinePoint[]
  review_process?: ReviewProcessSummary
  review_process_series?: ReviewProcessPeriod[]
  article_type_breakdown?: ArticleTypeBreakdown[]
  trend: number       // negative = faster recently, positive = slower
  trend_eligible?: boolean
  med6: number | null
  med24: number | null
  official_benchmark?: {
    source?: string
    official_first_decision_days?: number
    official_submission_to_acceptance_days?: number
    impact_factor?: number
    five_year_impact_factor?: number
    downloads_annual?: number
    scirev_first_review_round_days?: number
    scirev_avg_review_rounds?: number
    scirev_avg_review_reports?: number
    scirev_immediate_rejection_days?: number
    acceptance_rate_est?: string
    desk_rejection_rate_est?: string
  }
  distribution_brackets?: Array<{
    bracket: string
    percentage: number
    count: number
  }>
  articles: CleanRow[]
  trust_label?: 'high' | 'medium' | 'low' | 'stale'
  is_public?: boolean
  is_indexable?: boolean
  leaderboard_eligible?: boolean
  reliable_ranking_eligible?: boolean
  primary_keyword?: string
  seo_title?: string
  seo_description?: string
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
  '#5294ff', '#fb923c', '#2c528c', '#e8464e',
]
