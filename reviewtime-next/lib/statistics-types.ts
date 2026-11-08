export type StageKey = 'acceptance' | 'first_revision' | 'last_revision' | 'publication'
export type StatisticsWindow = '6m' | '12m' | '24m' | 'all'
export type StatisticsArticleType = 'research' | 'all'
export type StatisticsCohortBasis = 'accepted_date' | 'publication_date'
export interface StageSummary {
  count: number
  median: number | null
  p25: number | null
  p75: number | null
  p90: number | null
}
export type StageMetrics = Record<StageKey, StageSummary>
export interface StatisticsJournal {
  key: string
  label: string
  source: string
  url: string | null
  issn: string
  stages: StageMetrics
  latest_month: string
}
export interface StatisticsScope {
  window: StatisticsWindow
  source: string
  article_type: StatisticsArticleType
  cohort_basis: StatisticsCohortBasis
  data_as_of: string
  start: string | null
  end: string
  cohort_rows: number
  journal_groups: number
  stages: StageMetrics
  monthly: { month: string; stages: StageMetrics }[]
  journals: StatisticsJournal[]
}
export interface StatisticsManifest {
  version: string
  as_of: string
  generated_at: string
  minimum_samples: number
  sources: {
    key: string
    label: string
    windows: StatisticsWindow[]
    article_types: StatisticsArticleType[]
    default_window: StatisticsWindow
    default_article_type: StatisticsArticleType
    cohort_basis: StatisticsCohortBasis
    status: 'verified' | 'pilot'
  }[]
  audit: {
    latest_fetched_at: string | null
    by_source: { key: string; label: string; rows: number; valid_acceptance_rows: number; status: 'verified' | 'pilot' }[]
  }
}
export interface StatisticsData {
  manifest: StatisticsManifest
  scope: StatisticsScope
}
