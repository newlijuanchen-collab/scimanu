'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { EChart } from '@/components/charts/echart'
import { PercentileBand } from '@/components/ui/percentile-band'
import { TrendChip } from '@/components/ui/trend-chip'
import { buildReviewProcessTrendOption, buildTrendOption, type ReviewProcessMetric } from '@/lib/chart-configs'
import { formatNumber } from '@/lib/format'
import { getTrendTone } from '@/lib/review-ui'
import type { ArticleTypeBreakdown, JournalStats, NumericSummary, ReviewProcessPeriod } from '@/lib/types'
import { resolveJournalBenchmark } from '@/lib/journal-benchmark'
import { AuthorExperienceCard } from '@/components/features/author-experience-card'
import { MilestoneFunnel } from '@/components/features/milestone-funnel'
import { DurationHistogram } from '@/components/features/duration-histogram'
import { DeadlineCalculator } from '@/components/features/deadline-calculator'
import { PaidConversionBanner } from '@/components/features/paid-conversion-banner'
import { PeerBenchmarkChart } from '@/components/features/peer-benchmark-chart'
import { PreSubmissionModal } from '@/components/conversion/pre-submission-modal'

interface JournalDetailViewProps {
  journal: JournalStats
  peers: JournalStats[]
}

type ProcessWindow = 'all' | 'last3' | 'last2'

const metricOptions: Array<{ key: ReviewProcessMetric; label: string }> = [
  { key: 'total_wait', label: 'Total wait' },
  { key: 'first_feedback', label: 'First feedback' },
  { key: 'revision_rounds', label: 'Revision rounds' },
  { key: 'final_acceptance_tail', label: 'Final revision tail' },
]

const windowOptions: Array<{ key: ProcessWindow; label: string }> = [
  { key: 'all', label: 'All periods' },
  { key: 'last3', label: 'Last 3 periods' },
  { key: 'last2', label: 'Last 2 periods' },
]

function medianLabel(summary: NumericSummary | undefined, unit = 'days') {
  if (!summary || summary.median === null || summary.median === undefined) return '—'
  return `${formatNumber(summary.median)} ${unit}`
}

function rangeLabel(summary: NumericSummary | undefined, unit = 'days') {
  if (!summary || summary.count <= 0) return '—'
  if (summary.p25 === null || summary.p25 === undefined || summary.p75 === null || summary.p75 === undefined) {
    return medianLabel(summary, unit)
  }
  if (summary.p25 === summary.p75) return `${formatNumber(summary.p25)} ${unit}`
  return `${formatNumber(summary.p25)}-${formatNumber(summary.p75)} ${unit}`
}

function percentLabel(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

function visibleProcessSeries(series: ReviewProcessPeriod[], window: ProcessWindow) {
  if (window === 'last2') return series.slice(-2)
  if (window === 'last3') return series.slice(-3)
  return series
}

function processFromArticleType(type: ArticleTypeBreakdown | undefined) {
  if (!type) return undefined
  return {
    total_wait: type.total_wait,
    first_feedback: type.first_feedback,
    revision_rounds: type.revision_rounds,
    final_acceptance_tail: type.final_acceptance_tail,
    no_revision_recorded_rate: type.no_revision_recorded_rate,
    common_paths: [],
  }
}

export function JournalDetailView({ journal, peers }: JournalDetailViewProps) {
  const [metric, setMetric] = useState<ReviewProcessMetric>('total_wait')
  const [processWindow, setProcessWindow] = useState<ProcessWindow>('all')
  const [articleType, setArticleType] = useState('all')
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)

  const benchmark = useMemo(() => resolveJournalBenchmark(journal), [journal])
  const articleTypes = journal.article_type_breakdown ?? []
  const selectedArticleType = articleTypes.find(row => row.article_type === articleType)
  const process = articleType === 'all' ? journal.review_process : processFromArticleType(selectedArticleType)
  const processSeries = articleType === 'all' ? (journal.review_process_series ?? []) : (selectedArticleType?.periods ?? [])
  const scopeLabel = articleType === 'all' ? 'All article types' : articleType

  const filteredProcessSeries = useMemo(
    () => visibleProcessSeries(processSeries, processWindow),
    [processSeries, processWindow],
  )
  const processTrendOption = useMemo(
    () => buildReviewProcessTrendOption(filteredProcessSeries, metric),
    [filteredProcessSeries, metric],
  )
  const trendOption = useMemo(
    () => buildTrendOption(journal.timeSeries.slice(-24)),
    [journal.timeSeries],
  )

  const navItems = [
    ['overview', 'Decision Summary'],
    ['experience', 'Author Experience & Rigor'],
    ['milestones', 'Process Funnel'],
    ['distribution', 'Duration Histogram'],
    ['calculator', 'Deadline Feasibility'],
    ['peer-benchmarks', 'Peer Comparison'],
    ['peers', 'Fast Alternatives'],
    ...(articleTypes.length ? [['article-types', 'Article Types'] as const] : []),
    ['timeline', 'Timeline Signals'],
    ['data-basis', 'Data Basis & Policy'],
  ] as const

  const totalMedian = process?.total_wait.median ?? journal.median
  const revisionEstimatedDays = Math.max(30, Math.round(totalMedian * 0.35))
  const finalDecisionDays = Math.max(15, Math.round(totalMedian * 0.1))

  return (
    <article className="space-y-7">
      {/* Page Header */}
      <header className="border-b border-slate-200 pb-6">
        <p className="section-eyebrow">{journal.primary_keyword ?? `${journal.label} Review Time & Acceptance`}</p>
        <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              {journal.label} Review Time & Timeline
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Verified review timeline, editorial desk triage speed, acceptance rate, and peer comparison to help you plan your submission.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                {journal.source_display ?? journal.publisher}
              </span>
              {journal.latest_sample_month ? (
                <span className="inline-flex rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                  Data through: {journal.latest_sample_month}
                </span>
              ) : null}
              <Link
                href={`/compare?journals=${journal.url_slug}`}
                className="inline-flex items-center rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-sm transition hover:bg-orange-100"
              >
                Compare this journal →
              </Link>
            </div>
          </div>
          <div className="rt-data-panel">
            <p className="text-sm text-slate-500">Submission to Acceptance</p>
            <p className="mt-2 text-5xl font-semibold tracking-tight text-slate-950">
              {formatNumber(totalMedian)} <span className="text-xl text-slate-500">days</span>
            </p>
            <p className="mt-3 text-sm text-slate-600">
              {scopeLabel} · verified across {formatNumber(process?.total_wait.count ?? journal.count)} published articles.
            </p>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-10 -mx-4 border-y border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex gap-2 overflow-x-auto text-sm">
          {navItems.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-slate-600 transition hover:bg-white hover:text-orange-600"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* At A Glance: Executive Decision Summary */}
      <section id="overview" className="scroll-mt-20 space-y-3">
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-tile border-orange-200/80 bg-white shadow-sm">
            <p className="metric-label">1. Editorial Desk Triage</p>
            <p className="metric-value text-orange-600">~{benchmark.triageDays} days</p>
            <p className="mt-1 text-[11px] text-slate-500">
              ~{benchmark.deskRejectRate} desk rejection. Passed day 7 usually enters peer review.
            </p>
          </div>
          <div className="metric-tile border-slate-200/80 bg-white shadow-sm">
            <p className="metric-label">2. First Review Decision</p>
            <p className="metric-value text-slate-900">~{benchmark.firstReviewDays} days</p>
            <p className="mt-1 text-[11px] text-slate-500">
              External peer review duration (~{benchmark.avgReviewers} referee reports).
            </p>
          </div>
          <div className="metric-tile border-slate-200/80 bg-white shadow-sm">
            <p className="metric-label">3. Total to Acceptance</p>
            <p className="metric-value text-slate-900">{formatNumber(totalMedian)} days</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Middle 50% accepted between {benchmark.p25Days} and {benchmark.p75Days} days.
            </p>
          </div>
          <div className="metric-tile border-emerald-200/80 bg-white shadow-sm">
            <p className="metric-label">4. Est. Acceptance Rate</p>
            <p className="metric-value text-emerald-700">{benchmark.acceptanceRate}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Average ~{benchmark.avgRounds} rounds of revisions with rigorous validation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-2.5 text-xs text-slate-700">
          <span className="text-base">📊</span>
          <p>
            <strong>Distribution Profile:</strong> {benchmark.distributionExplanationEn}
          </p>
        </div>
      </section>

      {/* SciRev-Style Author Experience & Rigor Signals */}
      <section id="experience" className="scroll-mt-20">
        <AuthorExperienceCard benchmark={benchmark} journalName={journal.label} />
      </section>

      {/* Process Funnel */}
      <section id="milestones" className="scroll-mt-20">
        <MilestoneFunnel
          triageDays={benchmark.triageDays}
          firstReviewDays={benchmark.firstReviewDays}
          revisionDays={revisionEstimatedDays}
          finalDecisionDays={finalDecisionDays}
          onlineDays={20}
          totalDays={totalMedian}
          deskRejectRate={benchmark.deskRejectRate}
        />
      </section>

      {/* Duration Histogram */}
      <section id="distribution" className="scroll-mt-20">
        <DurationHistogram
          brackets={benchmark.distributionBrackets}
          medianDays={totalMedian}
          sampleCount={process?.total_wait.count ?? journal.count}
        />
      </section>

      {/* Deadline Feasibility Calculator */}
      <section id="calculator" className="scroll-mt-20">
        <DeadlineCalculator
          journalName={journal.label}
          medianDays={totalMedian}
          p75Days={benchmark.p75Days}
          p90Days={benchmark.p90Days}
          onOpenScan={() => setIsAuditModalOpen(true)}
        />
      </section>

      {/* Peer Benchmark Grouped Comparison */}
      <section id="peer-benchmarks" className="scroll-mt-20">
        <PeerBenchmarkChart currentJournalName={journal.label} />
      </section>

      {/* Pre-submission Audit CTA */}
      <PaidConversionBanner
        journalName={journal.label}
        deskRejectRate={benchmark.deskRejectRate}
        onOpenScan={() => setIsAuditModalOpen(true)}
      />

      {/* Fast Alternatives in the Same Source / Field */}
      <section id="peers" className="card-rt p-5 md:p-6 scroll-mt-20">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="section-eyebrow">Fast Alternatives</p>
            <h2 className="text-xl font-bold text-slate-950">Comparable Journals in the Same Field</h2>
            <p className="mt-1 text-xs text-slate-500">
              Need faster publication? Compare typical turnaround times of related journals.
            </p>
          </div>
          <Link
            href="/fast-review-journals"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            View all fast journals ranking →
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {peers.slice(0, 4).map(peer => (
            <div
              key={peer.url_slug ?? peer.label}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-orange-300 transition"
            >
              <div>
                <p className="text-xs font-semibold text-slate-400">{peer.source_display ?? peer.publisher}</p>
                <Link
                  href={`/journals/${peer.url_slug}`}
                  className="mt-1 block font-bold text-slate-950 hover:text-orange-600 line-clamp-2"
                >
                  {peer.label}
                </Link>
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-3">
                <div>
                  <span className="text-2xl font-bold text-slate-950">{formatNumber(peer.median)}</span>
                  <span className="ml-1 text-xs text-slate-500">days</span>
                </div>
                <Link
                  href={`/compare?journals=${journal.url_slug},${peer.url_slug}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition"
                >
                  Compare
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Article Types (Rendered only if data exists) */}
      {articleTypes.length > 0 && (
        <section id="article-types" className="card-rt overflow-hidden scroll-mt-20">
          <div className="border-b border-slate-200 p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="section-eyebrow">Article Type Breakdown</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Review Time by Format</h2>
                <p className="mt-1 max-w-3xl text-xs text-slate-600">
                  Different submission formats (Original Articles, Brief Communications, Reviews) can have distinct review paces.
                </p>
              </div>
              <label className="block min-w-[200px]">
                <span className="text-xs font-medium text-slate-500">Filter page scope</span>
                <select
                  value={articleType}
                  onChange={event => setArticleType(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-orange-500"
                >
                  <option value="all">All article types</option>
                  {articleTypes.map(row => (
                    <option key={row.article_type} value={row.article_type}>
                      {row.article_type} ({row.count})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-left font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Article type</th>
                  <th className="px-4 py-2.5">Share</th>
                  <th className="px-4 py-2.5">Articles</th>
                  <th className="px-4 py-2.5">Median</th>
                  <th className="px-4 py-2.5">P25–P75</th>
                  <th className="px-4 py-2.5">Revision Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articleTypes.map(row => (
                  <tr key={row.article_type} className={row.article_type === articleType ? 'bg-orange-50/40' : undefined}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.article_type}</td>
                    <td className="px-4 py-3 text-slate-700">{percentLabel(row.share)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatNumber(row.count)}</td>
                    <td className="px-4 py-3 font-bold text-slate-950">{medianLabel(row.total_wait)}</td>
                    <td className="px-4 py-3 text-slate-700">{rangeLabel(row.total_wait)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {row.no_revision_recorded_rate === 1.0 ? 'Not disclosed in public feeds' : rangeLabel(row.revision_rounds, 'rounds')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Timeline Signals */}
      <section id="timeline" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] scroll-mt-20">
        <div className="card-rt p-5">
          <p className="section-eyebrow">Distribution Metrics</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Observed Duration Range & P90</h2>
          <p className="mt-1 text-xs text-slate-600">
            Current scope: {scopeLabel}. P90 is the 90th percentile of observed durations.
          </p>
          <div className="mt-5">
            <PercentileBand
              p25={benchmark.p25Days}
              median={totalMedian}
              p75={benchmark.p75Days}
            />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Most papers (P25–P75)</p>
              <p className="mt-1 text-base font-bold text-slate-950">{benchmark.p25Days}–{benchmark.p75Days} days</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">90th percentile duration (P90)</p>
              <p className="mt-1 text-base font-bold text-slate-950">{benchmark.p90Days} days</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Typical Revision Rounds</p>
              <p className="mt-1 text-base font-bold text-slate-950">~{benchmark.avgRounds} rounds</p>
            </div>
          </div>
        </div>

        <div className="card-rt p-5">
          <p className="section-eyebrow">Review Signals</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Milestone Timetable</h2>
          <dl className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Desk Triage Window</dt>
              <dd className="font-bold text-orange-600">Day 1 to {benchmark.triageDays}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">First Referee Feedback</dt>
              <dd className="font-bold text-slate-900">~Day {benchmark.firstReviewDays}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Revision & Validation</dt>
              <dd className="font-bold text-slate-900">~{revisionEstimatedDays} days</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Final Decision & Online</dt>
              <dd className="font-bold text-slate-900">~{finalDecisionDays + 20} days</dd>
            </div>
            <div className="flex justify-between gap-4 pt-1">
              <dt className="text-slate-500">Recent Pace Trend</dt>
              <dd><TrendChip tone={getTrendTone(journal.trend)} /></dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Trend (rendered only when series data exists) */}
      {filteredProcessSeries.length > 0 && (
        <section id="process-trend" className="card-rt p-5 scroll-mt-20">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="section-eyebrow">Review Trend Over Time</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Has this journal changed recently?</h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-600">
                Track how turnaround durations have evolved across reporting windows.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {metricOptions.map(option => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setMetric(option.key)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    metric === option.key
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {windowOptions.map(option => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setProcessWindow(option.key)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                    processWindow === option.key
                      ? 'border-slate-800 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <EChart option={processTrendOption} className="mt-4 h-[320px] w-full" />
        </section>
      )}

      {/* Monthly Median Trend (if timeseries exists) */}
      {journal.timeSeries.length > 2 && (
        <section className="card-rt p-5">
          <p className="section-eyebrow">Historical Monthly Median</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Received-to-Accepted Trend</h2>
          <p className="mt-1 text-xs text-slate-600">
            Monthly medians derived from accepted paper timelines.
          </p>
          <EChart option={trendOption} className="mt-4 h-[320px] w-full" />
        </section>
      )}

      {/* Data Basis & Legal Disclaimer */}
      <section id="data-basis" className="card-rt p-5 md:p-6 scroll-mt-20">
        <p className="section-eyebrow">Methodology & Policy</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">Data Methodology & Sources</h2>
        <div className="mt-3 space-y-3 text-xs leading-relaxed text-slate-600">
          <p>
            SciManu derives the current pilot from date events returned by PubMed EFetch. Received, accepted, and revised fields are read only from PubMed History; online publication uses the exact electronic publication date.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Received → Accepted:</strong> Total handling duration from initial formal receipt to acceptance notice.</li>
            <li><strong>Editorial Desk Triage:</strong> Median duration required for initial in-house editorial scope and novelty screening before dispatching to external reviewers.</li>
            <li><strong>Survivor Bias Note:</strong> Public article feeds represent successful publications only. Manuscripts rejected at desk triage or during peer review are not publicly timestamped.</li>
            <li><strong>Data display:</strong> The site displays journal and month aggregates only. It does not expose article titles, author names, DOIs, abstracts, raw records, or article-level calendar dates. PubMed/NLM identifies some History dates as publisher-supplied; this source description does not itself grant a reuse license.</li>
          </ul>
          <p className="pt-2 text-xs text-slate-500">
            To explore overall cohort statistics or cross-publisher benchmarks, visit the{' '}
            <Link href="/statistics" className="font-semibold text-orange-600 underline hover:text-orange-700">
              Statistics Workbench
            </Link>.
          </p>
        </div>
      </section>

      {/* Pre-submission Audit Modal */}
      <PreSubmissionModal
        journalName={journal.label}
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </article>
  )
}
