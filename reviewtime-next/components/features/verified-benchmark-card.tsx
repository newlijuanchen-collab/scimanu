'use client'

import React from 'react'

interface VerifiedBenchmarkProps {
  benchmark?: {
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
  journalName: string
  observedMedian: number
}

export function VerifiedBenchmarkCard({
  benchmark,
  journalName,
  observedMedian,
}: VerifiedBenchmarkProps) {
  if (!benchmark) {
    return null
  }

  return (
    <div className="card-rt overflow-hidden border-orange-200 bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold">
            ✓
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Official & Verified Benchmarks</p>
            <h2 className="text-lg font-semibold text-slate-950">Publisher & Independent Community Signals</h2>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
          Source: {benchmark.source ?? 'Publisher DORA Statement'}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {benchmark.impact_factor ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <p className="text-xs text-slate-500">Journal Impact Factor</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{benchmark.impact_factor}</p>
            <p className="text-[10px] text-slate-400">5-Year JIF: {benchmark.five_year_impact_factor ?? benchmark.impact_factor}</p>
          </div>
        ) : null}

        {benchmark.official_first_decision_days ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <p className="text-xs text-slate-500">Official First Decision</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-orange-600">
              {benchmark.official_first_decision_days} <span className="text-xs font-normal text-slate-500">days</span>
            </p>
            <p className="text-[10px] text-slate-400">Median editorial triage speed</p>
          </div>
        ) : null}

        {benchmark.official_submission_to_acceptance_days ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <p className="text-xs text-slate-500">Publisher Stated Median</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {benchmark.official_submission_to_acceptance_days} <span className="text-xs font-normal text-slate-500">days</span>
            </p>
            <p className="text-[10px] text-slate-400">Submission to acceptance</p>
          </div>
        ) : null}

        {benchmark.scirev_avg_review_rounds ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <p className="text-xs text-slate-500">Average Review Complexity</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {benchmark.scirev_avg_review_rounds} <span className="text-xs font-normal text-slate-500">rounds</span>
            </p>
            <p className="text-[10px] text-slate-400">~{benchmark.scirev_avg_review_reports ?? 2.7} reports per paper</p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-orange-200/80 bg-white/80 p-3.5 text-xs text-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <div>
            <strong>Reconciling publisher stats vs {observedMedian} days real publication wait:</strong> The publisher's 4-day decision accounts for the ~{benchmark.desk_rejection_rate_est ?? '92%'} desk rejections. Successfully peer-reviewed papers that endure 2 rounds of review and author revisions take ~{observedMedian} days.
          </div>
        </div>
        <div className="shrink-0 font-semibold text-orange-700">
          Est. Acceptance Rate: {benchmark.acceptance_rate_est ?? '7-8%'}
        </div>
      </div>
    </div>
  )
}
