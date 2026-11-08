'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useReviewData } from '@/hooks/use-review-data'
import { EChart } from '@/components/charts/echart'
import { buildTrendOption } from '@/lib/chart-configs'
import { PercentileBand } from '@/components/ui/percentile-band'
import { TrendChip } from '@/components/ui/trend-chip'
import { formatCompactNumber, formatMonthLabel, formatNumber } from '@/lib/format'
import { Link } from '@/i18n/navigation'
import { getTrendTone, hasMonthlyCoverage } from '@/lib/review-ui'
import { getJournalSlug } from '@/lib/journal-slug'
import type { JournalStats, LoadedData } from '@/lib/types'
import {
  computeDisciplineBenchmarks,
  computeSpeedTiers,
  inferDiscipline,
  isValidPeerReviewedJournal,
  type DisciplineSummary,
  type SpeedTierInfo,
} from '@/lib/stats-aggregator'

type WaitFilter = 'all' | 'fast' | 'standard' | 'extended' | 'longer'
type ReliabilityFilter = 'all' | 'reliable'

function matchesWaitFilter(journal: JournalStats, filter: WaitFilter) {
  if (filter === 'all') return true
  const median = journal.median
  if (median === null || median === undefined) return false
  if (filter === 'fast') return median < 60
  if (filter === 'standard') return median >= 60 && median <= 120
  if (filter === 'extended') return median > 120 && median <= 200
  return median > 200
}

function matchesReliabilityFilter(journal: JournalStats, filter: ReliabilityFilter) {
  if (filter === 'all') return true
  return journal.count >= 20
}

export function DashboardView({ initialData }: { initialData?: LoadedData | null } = {}) {
  const t = useTranslations()
  const locale = useLocale()
  const isZh = locale === 'zh'

  const { journals, stats, loading, error } = useReviewData({ minCount: 3 }, initialData)
  const [keyword, setKeyword] = useState('')
  const [waitFilter, setWaitFilter] = useState<WaitFilter>('all')
  const [reliabilityFilter, setReliabilityFilter] = useState<ReliabilityFilter>('all')
  const [disciplineFilter, setDisciplineFilter] = useState('all')

  // Multi-dimensional aggregated benchmarks
  const speedTiers = useMemo(() => computeSpeedTiers(journals), [journals])
  const disciplineStats = useMemo(() => computeDisciplineBenchmarks(journals), [journals])

  // Trend option
  const hasSixMonthTrend = hasMonthlyCoverage(stats?.globalTimeSeries, 6)
  const trendOption = useMemo(
    () => hasSixMonthTrend ? buildTrendOption(stats?.globalTimeSeries ?? []) : null,
    [hasSixMonthTrend, stats],
  )

  // Top fastest reliable peer-reviewed research journals (N >= 20)
  const topLowerMedian = useMemo(() => {
    return [...journals]
      .filter(j => j.count >= 20 && isValidPeerReviewedJournal(j))
      .sort((a, b) => a.median - b.median || (a.p75 - a.p25) - (b.p75 - b.p25) || b.count - a.count)
      .slice(0, 5)
  }, [journals])

  // Higher median durations (N >= 20)
  const topHigherMedian = useMemo(() => {
    return [...journals]
      .filter(j => j.count >= 20 && j.median > 0)
      .sort((a, b) => b.median - a.median || (b.p75 - b.p25) - (a.p75 - a.p25))
      .slice(0, 5)
  }, [journals])

  const matched = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return journals
      .filter(j => {
        if (!q) return true
        return (
          j.label.toLowerCase().includes(q) ||
          (j.issn && j.issn.toLowerCase().includes(q)) ||
          (j.source_display && j.source_display.toLowerCase().includes(q)) ||
          (j.publisher && j.publisher.toLowerCase().includes(q))
        )
      })
      .filter(j => {
        if (disciplineFilter === 'all') return true
        return inferDiscipline(j.label).en === disciplineFilter
      })
      .filter(j => matchesWaitFilter(j, waitFilter))
      .filter(j => matchesReliabilityFilter(j, reliabilityFilter))
      .sort((a, b) => {
        if (reliabilityFilter === 'reliable' || q) {
          return a.median - b.median || b.count - a.count
        }
        return b.count - a.count || a.median - b.median
      })
      .slice(0, 15)
  }, [journals, keyword, disciplineFilter, waitFilter, reliabilityFilter])

  const updatedAt = useMemo(() => {
    if (stats?.globalTimeSeries?.length) {
      return stats.globalTimeSeries[stats.globalTimeSeries.length - 1].ym
    }
    return '2026-06'
  }, [stats])

  if (loading) return <div className="card-rt p-8 text-slate-500">{t('common.loading')}</div>
  if (error) return <div className="card-rt p-8 text-red-600">{t('common.error')}: {error}</div>
  if (!stats) return <div className="card-rt p-8 text-slate-500">{t('common.noData')}</div>

  return (
    <div className="space-y-9">
      {/* ── 1. Hero Header & Global Multi-Metric Ticker ────────────────────────── */}
      <section className="border-b border-slate-200/90 pb-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.2fr)_440px]">
          <div className="pt-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800">
                {isZh ? 'PubMed E-utilities · 生物医学试点' : 'PubMed E-utilities · Biomedical Pilot'}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-600">{isZh ? '更新于：' : 'Updated: '}{formatMonthLabel(updatedAt)}</span>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              {isZh ? 'PubMed 生物医学期刊时间统计' : 'PubMed Biomedical Journal Timelines'}
            </h1>
            <p className="mt-3.5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              {isZh
                ? '使用 PubMed E-utilities 可查到的收稿、接收和在线发表日期，展示所选 20 本生物医学期刊近六个月的期刊级统计。不同阶段的有效样本量不同。'
                : 'Journal-level summaries for a six-month cohort across 20 selected biomedical journals, using dates available through PubMed E-utilities. Valid sample sizes vary by stage.'}
            </p>

            {/* Quick action buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#speed-tiers" className="btn-primary">
                {isZh ? '查看审稿周期分段 ↓' : 'Speed Tiers ↓'}
              </a>
              <a href="#disciplines" className="btn-secondary">
                {isZh ? '学科门类对比 ↓' : 'Disciplines ↓'}
              </a>
              <Link
                href="/fast-review-journals"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {isZh ? '极速期刊榜 →' : 'Fast Journals →'}
              </Link>
              <Link
                href="/statistics"
                className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
              >
                {isZh ? '期刊审稿分析 →' : 'Review Analytics →'}
              </Link>
            </div>
          </div>

          {/* Right Summary Data Card */}
          <div className="rt-data-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-eyebrow">{isZh ? 'PubMed 试点队列' : 'PubMed Pilot Cohort'}</p>
                <h3 className="mt-0.5 text-base font-bold text-slate-950">
                  {isZh ? 'PubMed 队列收稿→接收耗时' : 'PubMed Received-to-Accepted'}
                </h3>
              </div>
              <span className="rounded-full border border-orange-200/80 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                {formatCompactNumber(stats.totalArticles)} {isZh ? '条时间戳' : 'Timelines'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200">
              <div className="py-3 pr-2">
                <p className="text-[11px] text-slate-500">{isZh ? '覆盖期刊' : 'Journals'}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-950">{formatCompactNumber(stats.totalJournals)}</p>
              </div>
              <div className="px-2 py-3">
                <p className="text-[11px] text-slate-500">{isZh ? '试点论文合并中位数' : 'Pooled pilot median'}</p>
                <p className="mt-1 text-2xl font-extrabold text-orange-600">
                  {formatNumber(stats.globalMedian)} <span className="text-xs font-normal text-slate-500">{isZh ? '天' : 'days'}</span>
                </p>
              </div>
              <div className="py-3 pl-2">
                <p className="text-[11px] text-slate-500">{isZh ? '典型区间' : 'Middle 50%'}</p>
                <p className="mt-1 text-base font-bold text-slate-950">
                  {stats.globalP25}–{stats.globalP75} <span className="text-xs font-normal text-slate-500">{isZh ? '天' : 'd'}</span>
                </p>
              </div>
            </div>

            <div className="mt-3.5">
              <PercentileBand p25={stats.globalP25} median={stats.globalMedian} p75={stats.globalP75} compact />
            </div>

            <dl className="mt-4 space-y-1.5 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{isZh ? '最新数据周期' : 'Latest Data Period'}</dt>
                <dd className="font-semibold text-slate-900">{formatMonthLabel(updatedAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{isZh ? '六个月有效收稿→接收样本' : 'Valid six-month timelines'}</dt>
                <dd className="font-bold text-orange-700">{formatNumber(stats.totalArticles)} · {formatNumber(stats.totalJournals)} {isZh ? '本期刊' : 'journals'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ── 2. Dimension 1: Review Speed Distribution Landscape ───────────────── */}
      <section id="speed-tiers" className="scroll-mt-20 space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[11px] font-bold text-white">
                1
              </span>
              <p className="section-eyebrow">{isZh ? '维度一：审稿时效梯队' : 'Dimension 1: Speed Tiers'}</p>
            </div>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
              {isZh ? 'PubMed 期刊收稿→接收耗时分布' : 'PubMed Received-to-Accepted Distribution'}
            </h2>
            <p className="text-xs text-slate-500">
              {isZh
                ? '点击时长区间可筛选下方期刊表。区间依据各期刊的收稿至接收中位数划分。'
                : 'Click any tier card to filter the directory table below instantly.'}
            </p>
          </div>
          {waitFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setWaitFilter('all')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 underline"
            >
              {isZh ? '清除分段筛选 (查看全部)' : 'Clear Tier Filter (Show All)'}
            </button>
          )}
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {speedTiers.map(tier => {
            const isSelected = waitFilter === tier.key
            return (
              <button
                key={tier.key}
                type="button"
                onClick={() => setWaitFilter(isSelected ? 'all' : tier.key)}
                className={`group flex flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${
                  isSelected
                    ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white'
                    : `${tier.borderColor} ${tier.bgColor} hover:border-orange-400 hover:bg-white`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      {isZh ? tier.labelZh : tier.label}
                    </span>
                    <span className={`text-xs font-extrabold ${tier.color}`}>{tier.percentage}%</span>
                  </div>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    {formatNumber(tier.count)} <span className="text-sm font-normal text-slate-500">{isZh ? '本期刊' : 'journals'}</span>
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-200/60 pt-2.5">
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {isZh ? tier.adviceZh : tier.advice}
                  </p>
                  <p className="mt-2 text-[10px] font-bold text-orange-600 group-hover:underline">
                    {isSelected ? (isZh ? '✓ 正在过滤此分段' : '✓ Filtering this tier') : (isZh ? '点击筛选此类期刊 →' : 'Filter by this tier →')}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── 3. Dimension 2: Speed by Academic Discipline ──────────────────────── */}
      <section id="disciplines" className="scroll-mt-20 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[11px] font-bold text-white">
            2
          </span>
          <p className="section-eyebrow">{isZh ? '维度二：学科门类对比' : 'Dimension 2: Disciplinary Benchmark'}</p>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-950">
              {isZh ? '八大学科门类中位审稿耗时对比' : 'Review Speed by Academic Discipline'}
            </h2>
            <p className="text-xs text-slate-500">
              {isZh
                ? '实验学科（化学/医学）通常快于算法复现密集的计算机学科。点击学科推荐期刊可直接进入深度分析。'
                : 'Turnaround differs heavily by discipline: Chemistry & Medicine are fast-paced, while CS/AI requires algorithm audits.'}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {disciplineStats.map(disc => (
            <div
              key={disc.discipline}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-orange-300 transition"
            >
              <div>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-bold text-slate-950">
                    {isZh ? disc.disciplineZh : disc.discipline}
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">{disc.count} {isZh ? '本期刊' : 'journals'}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-950">{disc.median}</span>
                  <span className="text-xs text-slate-500">{isZh ? '天中位数' : 'days median'}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {isZh ? '典型区间: ' : 'Middle 50%: '}<strong className="text-slate-700">{disc.p25}–{disc.p75} {isZh ? '天' : 'days'}</strong>
                </p>
              </div>

              {disc.fastestJournal && (
                <div className="mt-3.5 border-t border-slate-100 pt-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {isZh ? '学科内较短中位耗时' : 'Shortest Median in Category'}
                  </p>
                  <Link
                    href={`/journals/${disc.fastestJournal.slug}`}
                    className="mt-0.5 block text-xs font-bold text-slate-900 hover:text-orange-600 line-clamp-1"
                  >
                    {disc.fastestJournal.name} ({disc.fastestJournal.median}{isZh ? '天' : 'd'}) →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Journals at both ends of the observed median-duration range ── */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card-rt border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                {isZh ? '中位耗时较低 · 前 5' : 'LOWER MEDIANS · TOP 5'}
              </span>
              <h3 className="mt-1 text-lg font-bold text-slate-950">
                {isZh ? '样本量达 20 的期刊中，中位耗时较低者' : 'Journals with lower medians among those with N ≥ 20'}
              </h3>
            </div>
            <Link
              href="/fast-review-journals"
              className="text-xs font-bold text-slate-700 hover:underline"
            >
              {isZh ? '查看全部期刊 →' : 'View all journals →'}
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {topLowerMedian.map((j, idx) => (
              <div key={getJournalSlug(j.label, j.journal_key)} className="flex items-center justify-between py-2.5">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                      {idx + 1}
                    </span>
                    <Link
                      href={`/journals/${getJournalSlug(j.label, j.journal_key)}`}
                      className="font-bold text-slate-900 hover:text-orange-600 line-clamp-1 text-sm"
                    >
                      {j.label}
                    </Link>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 pl-7">
                    {j.source_display ?? j.publisher} · {formatNumber(j.count)} {isZh ? '篇记录' : 'timelines'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-black text-slate-800">{j.median}</span>
                  <span className="ml-1 text-xs text-slate-400">{isZh ? '天' : 'days'}</span>
                  <p className="text-[10px] text-slate-500">{j.p25}–{j.p75}{isZh ? '天' : 'd'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-rt border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                {isZh ? '中位耗时较高 · 前 5' : 'HIGHER MEDIANS · TOP 5'}
              </span>
              <h3 className="mt-1 text-lg font-bold text-slate-950">
                {isZh ? '收稿至接收中位耗时较高的期刊 (N ≥ 20)' : 'Journals with higher received-to-accepted medians (N ≥ 20)'}
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {isZh ? '按中位数降序' : 'Sorted by median, descending'}
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {topHigherMedian.map((j, idx) => (
              <div key={getJournalSlug(j.label, j.journal_key)} className="flex items-center justify-between py-2.5">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                      {idx + 1}
                    </span>
                    <Link
                      href={`/journals/${getJournalSlug(j.label, j.journal_key)}`}
                      className="font-bold text-slate-900 hover:text-orange-600 line-clamp-1 text-sm"
                    >
                      {j.label}
                    </Link>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 pl-7">
                    {j.source_display ?? j.publisher} · {formatNumber(j.count)} {isZh ? '篇记录' : 'timelines'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-black text-rose-700">{j.median}</span>
                  <span className="ml-1 text-xs text-slate-400">{isZh ? '天' : 'days'}</span>
                  <p className="text-[10px] text-rose-500">P75: {j.p75}{isZh ? '天' : 'd'} · P90: {j.p90 ?? Math.round(j.median * 1.5)}{isZh ? '天' : 'd'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Dimension 3: Macro Time Series Evolution ───────────────────────── */}
      {hasSixMonthTrend && trendOption && <section className="card-rt p-5 md:p-6 space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[11px] font-bold text-white">
                3
              </span>
              <p className="section-eyebrow">{isZh ? '维度三：PubMed 试点走势' : 'Dimension 3: PubMed Pilot Trend'}</p>
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {isZh ? 'PubMed 试点月度时间线' : 'Monthly PubMed Pilot Timelines'}
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            {isZh ? '所选生物医学期刊各月收稿至接收中位数' : 'Monthly received-to-accepted median across selected biomedical journals'}
          </p>
        </div>
        <EChart option={trendOption} className="h-[300px] w-full" />
      </section>}

      {/* ── 6. Instant Multi-dimensional Journal Search & Directory ───────────── */}
      <section id="directory" className="rt-search-panel scroll-mt-20">
        <div className="border-b border-slate-200/80 p-4 md:p-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[11px] font-bold text-white">
                  4
                </span>
                <p className="section-eyebrow">{isZh ? '维度四：多维检索目录' : 'Dimension 4: Search & Directory'}</p>
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-950">
                {isZh ? '跨学科期刊目录' : 'Journal Directory Across Subject Areas'}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {isZh
                  ? '服务面向所有学科期刊；当前可查的时间数据来自 PubMed 生物医学试点，仅覆盖本次选定期刊。'
                  : 'The service is intended for journals across subject areas; current timeline data cover only the selected journals in the PubMed biomedical pilot.'}
              </p>
            </div>
          </div>

          <input
            id="home-search"
            value={keyword}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
            placeholder={
              isZh
                  ? '输入期刊名或 ISSN，查找当前 PubMed 试点期刊…'
                  : 'Search the current PubMed pilot by journal name or ISSN…'
            }
            className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
          />

          <div className="mt-3.5 grid gap-3 md:grid-cols-3">
            <label className="block">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isZh ? '审稿速度分段' : 'Review Speed'}
              </span>
              <select
                value={waitFilter}
                onChange={event => setWaitFilter(event.target.value as WaitFilter)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
              >
                <option value="all">{isZh ? '全部时长区间' : 'All durations'}</option>
                <option value="fast">{isZh ? '小于 60 天' : 'Under 60 days'}</option>
                <option value="standard">60–120 {isZh ? '天' : 'days'}</option>
                <option value="extended">120–200 {isZh ? '天' : 'days'}</option>
                <option value="longer">{isZh ? '超过 200 天' : 'Over 200 days'}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isZh ? '样本可信度' : 'Evidence Reliability'}
              </span>
              <select
                value={reliabilityFilter}
                onChange={event => setReliabilityFilter(event.target.value as ReliabilityFilter)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
              >
                <option value="all">{isZh ? '全部样本量' : 'All sample sizes'}</option>
                <option value="reliable">{isZh ? '仅展示可信样本 (N ≥ 20)' : 'Reliable only (N ≥ 20)'}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isZh ? '学科分类' : 'Discipline'}
              </span>
              <select
                value={disciplineFilter}
                onChange={event => setDisciplineFilter(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
              >
                <option value="all">{isZh ? '全部学科门类' : 'All disciplines'}</option>
                {disciplineStats.map(d => (
                  <option key={d.discipline} value={d.discipline}>
                    {isZh ? d.disciplineZh : d.discipline} ({d.count})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Results List */}
        <div className="divide-y divide-slate-100">
          {matched.map(journal => (
            <div
              key={getJournalSlug(journal.label, journal.journal_key)}
              className="flex flex-col justify-between gap-4 p-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center md:p-5"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/journals/${getJournalSlug(journal.label, journal.journal_key)}`}
                  className="text-base font-bold text-slate-950 transition hover:text-orange-600"
                >
                  {journal.label}
                </Link>
                <p className="mt-1 text-xs text-slate-500">
                  {journal.source_display ?? journal.publisher ?? 'Source pending'}
                  {journal.issn ? ` · ISSN: ${journal.issn}` : ''}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {formatNumber(journal.count)} {isZh ? '篇记录' : 'timelines'}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      journal.count >= 20
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                  >
                    {journal.count >= 20 ? (isZh ? 'N ≥ 20 (高可信)' : 'N ≥ 20 (Reliable)') : (isZh ? 'N < 20 (探索性)' : 'N < 20 (Exploratory)')}
                  </span>
                  {journal.trend ? <TrendChip tone={getTrendTone(journal.trend)} /> : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-6">
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isZh ? '中位等待' : 'Median Wait'}</p>
                  <p className="mt-0.5 text-2xl font-black text-slate-950">
                    {formatNumber(journal.median)}{' '}
                    <span className="text-xs font-normal text-slate-500">{isZh ? '天' : 'days'}</span>
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    P25–P75: {formatNumber(journal.p25)}–{formatNumber(journal.p75)}{isZh ? '天' : 'd'}
                  </p>
                </div>

                <div className="hidden w-36 lg:block">
                  <PercentileBand p25={journal.p25} median={journal.median} p75={journal.p75} compact />
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href={`/journals/${getJournalSlug(journal.label, journal.journal_key)}`}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {isZh ? '查看详情' : 'Details'}
                  </Link>
                  <Link
                    href={`/compare?journals=${encodeURIComponent(getJournalSlug(journal.label, journal.journal_key))}`}
                    className="inline-flex items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 shadow-sm transition hover:bg-orange-100"
                  >
                    {isZh ? '对比' : 'Compare'}
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {!matched.length ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {isZh
                ? '未找到符合条件的期刊。请尝试调整关键词或审稿速度筛选。'
                : 'No journals match your criteria. Try adjusting your keyword or speed filter.'}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
