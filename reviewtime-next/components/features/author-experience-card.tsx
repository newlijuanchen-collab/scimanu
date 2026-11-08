'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import type { ResolvedJournalBenchmark } from '@/lib/journal-benchmark'

interface AuthorExperienceCardProps {
  benchmark: ResolvedJournalBenchmark
  journalName: string
}

export function AuthorExperienceCard({ benchmark, journalName }: AuthorExperienceCardProps) {
  const locale = useLocale()
  const isZh = locale === 'zh'

  return (
    <section className="card-rt overflow-hidden border-orange-200/90 bg-white p-5 md:p-6">
      {/* ── Section Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800">
              {isZh ? '客观数据分类' : 'Descriptive Data Breakdown'}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500">
              {isZh ? 'PubMed 可用日期字段' : 'Dates Available in PubMed'}
            </span>
          </div>
          <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-950">
            {isZh ? `${journalName} 审稿耗时分布与分段指标` : `${journalName} Review Timeline Distribution & Metrics`}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isZh
              ? '根据 PubMed 记录中可用日期计算分位数；样本只代表已发表且日期信息可用的记录。'
              : 'Quantiles are calculated from dates available in PubMed and describe published records with usable date information.'}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 px-3.5 py-2">
          <span className="text-xs text-slate-500 font-medium">
            {isZh ? '耗时梯队：' : 'Speed Tier:'}
          </span>
          <span className="text-xs font-bold text-orange-700">
            {isZh ? benchmark.speedTierZh : benchmark.speedTierEn}
          </span>
        </div>
      </div>

      {/* ── Two-Column Data Layout ────────────────────────────────────── */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Left: Distribution Brackets Breakdown */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {isZh ? '已发表论文耗时区间分布' : 'Observed Turnaround Duration Intervals'}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {isZh ? '样本占比统计' : 'Cohort Share'}
              </span>
            </div>

            {/* Bracket Progress Bars */}
            <div className="mt-3 space-y-2.5">
              {benchmark.distributionBrackets.map(b => (
                <div key={b.bracket} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-700 font-medium">
                    <span>{isZh ? b.bracketZh : b.bracket}</span>
                    <span className="font-bold text-slate-950">
                      {b.percentage}% <span className="text-[10px] text-slate-400 font-normal">({b.count} {isZh ? '篇' : 'papers'})</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-orange-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(4, b.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Callout */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-900 mr-1.5">
              {isZh ? '数据特征说明：' : 'Distribution Summary:'}
            </span>
            {isZh ? benchmark.distributionExplanationZh : benchmark.distributionExplanationEn}
          </div>
        </div>

        {/* Right: Key Observable Metrics Grid */}
        <div className="flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {isZh ? '核心统计分位数与节点' : 'Observable Statistical Milestones'}
            </h3>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm">
                <p className="text-[11px] text-slate-500">{isZh ? '中位耗时 (Median)' : 'Median Turnaround'}</p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {benchmark.totalMedianDays} <span className="text-xs font-normal text-slate-500">{isZh ? '天' : 'days'}</span>
                </p>
                <p className="text-[10px] text-slate-400">{isZh ? '50% 论文耗时短于此值' : '50% papers faster than this'}</p>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm">
                <p className="text-[11px] text-slate-500">{isZh ? '典型区间 (P25–P75)' : 'Middle 50% (IQR)'}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {benchmark.p25Days}–{benchmark.p75Days} <span className="text-xs font-normal text-slate-500">{isZh ? '天' : 'd'}</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  {isZh ? `四分位跨度: ${benchmark.iqrDays} 天` : `IQR spread: ${benchmark.iqrDays} days`}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm">
                <p className="text-[11px] text-slate-500">{isZh ? '初审分流 (Triage)' : 'Desk Triage'}</p>
                <p className="mt-1 text-xl font-bold text-orange-600">
                  ~{benchmark.triageDays} <span className="text-xs font-normal text-slate-500">{isZh ? '天' : 'days'}</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  ~{benchmark.deskRejectRate} {isZh ? '初筛拒稿率' : 'desk reject'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm">
                <p className="text-[11px] text-slate-500">{isZh ? '长尾线 (P90)' : 'P90 Long Tail'}</p>
                <p className="mt-1 text-xl font-bold text-slate-800">
                  {benchmark.p90Days} <span className="text-xs font-normal text-slate-500">{isZh ? '天' : 'days'}</span>
                </p>
                <p className="text-[10px] text-slate-400">{isZh ? '仅 10% 论文超过此线' : 'Top 10% longest cases'}</p>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm">
                <p className="text-[11px] text-slate-500">{isZh ? '一审外审' : '1st Review Round'}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  ~{benchmark.firstReviewDays} <span className="text-xs font-normal text-slate-500">{isZh ? '天' : 'days'}</span>
                </p>
                <p className="text-[10px] text-slate-400">{isZh ? '同行评议外部首轮' : 'External peer review'}</p>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm">
                <p className="text-[11px] text-slate-500">{isZh ? '公开修订记录' : 'Revision Events'}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  ~{benchmark.avgRounds} <span className="text-xs font-normal text-slate-500">{isZh ? '轮' : 'rounds'}</span>
                </p>
                <p className="text-[10px] text-slate-400">{isZh ? '平均可见修订轮次' : 'Avg recorded revisions'}</p>
              </div>
            </div>
          </div>

          {/* Bibliometric indicators */}
          {benchmark.impactFactor ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-2.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">
                {isZh ? '公开计量指标：' : 'Bibliometric Metrics:'}
              </span>
              <span>Impact Factor: <strong className="text-orange-700">{benchmark.impactFactor}</strong></span>
              {benchmark.fiveYearIF && <span>· 5-Yr JIF: <strong className="text-slate-800">{benchmark.fiveYearIF}</strong></span>}
              {benchmark.annualDownloads && (
                <span>· {isZh ? '年下载' : 'Annual Usage'}: <strong className="text-slate-800">{(benchmark.annualDownloads / 1000000).toFixed(1)}M</strong></span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
