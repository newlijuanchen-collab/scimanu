'use client'

import React, { useState } from 'react'
import { Link } from '@/i18n/navigation'

interface DeadlineCalculatorProps {
  journalName: string
  medianDays: number
  p75Days: number
  p90Days?: number
  onOpenScan?: () => void
}

export function DeadlineCalculator({
  journalName,
  medianDays,
  p75Days,
  p90Days = 320,
  onOpenScan,
}: DeadlineCalculatorProps) {
  const [submissionDate, setSubmissionDate] = useState('2026-11-15')
  const [deadlineDate, setDeadlineDate] = useState('2027-06-30')

  const calcDays = () => {
    const start = new Date(submissionDate).getTime()
    const end = new Date(deadlineDate).getTime()
    if (isNaN(start) || isNaN(end) || end <= start) return 0
    return Math.round((end - start) / (1000 * 60 * 60 * 24))
  }

  const daysAvailable = calcDays()

  // Risk evaluation
  let riskLevel = 'Low Risk'
  let riskColor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
  let riskProb = '85–95%'
  let advice = `You have ample buffer (${daysAvailable} days) exceeding the journal's 75th percentile (${p75Days} days). Standard peer review and revisions should fit within your timeline.`

  if (daysAvailable <= 0) {
    riskLevel = 'Invalid Dates'
    riskColor = 'text-slate-700 bg-slate-50 border-slate-200'
    riskProb = '—'
    advice = 'Please select a deadline date after your planned submission date.'
  } else if (daysAvailable < medianDays) {
    riskLevel = 'Critical High Risk'
    riskColor = 'text-rose-700 bg-rose-50 border-rose-200'
    riskProb = '< 35%'
    advice = `Your deadline (${daysAvailable} days) is less than the journal's median turnaround (${medianDays} days). You run an extreme risk of missing your deadline if an external peer review round is required.`
  } else if (daysAvailable < p75Days) {
    riskLevel = 'Moderate Risk'
    riskColor = 'text-amber-700 bg-amber-50 border-amber-200'
    riskProb = '50–65%'
    advice = `Your timeframe (${daysAvailable} days) covers the median (${medianDays} days), but falls below P75 (${p75Days} days). Any minor delay in finding reviewers or experimental revisions could push past your cutoff.`
  }

  return (
    <div className="card-rt overflow-hidden p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-eyebrow">Interactive Planning Tool</p>
          <h2 className="text-xl font-semibold text-slate-950">Graduation & Grant Deadline Feasibility Calculator</h2>
        </div>
        <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
          Tailored for {journalName}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Enter your planned submission date and mandatory acceptance deadline (graduation defense, tenure review, or grant cutoff) to estimate timely publication likelihood.
      </p>

      {/* Date input grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700">Planned Submission Date</label>
          <input
            type="date"
            value={submissionDate}
            onChange={e => setSubmissionDate(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Hard Cutoff / Acceptance Deadline</label>
          <input
            type="date"
            value={deadlineDate}
            onChange={e => setDeadlineDate(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Risk Result Card */}
      {daysAvailable > 0 && (
        <div className={`mt-4 rounded-xl border p-4 shadow-sm ${riskColor}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏱️</span>
              <span className="font-bold text-sm tracking-wide uppercase">Feasibility Rating: {riskLevel}</span>
            </div>
            <div className="text-xs font-semibold">
              Available Window: <strong>{daysAvailable} days</strong> · Acceptance Likelihood: <strong>{riskProb}</strong>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed opacity-95">{advice}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-current/15 pt-3">
            <button
              type="button"
              onClick={onOpenScan ?? (() => alert('Starting AI Pre-Submission Scan...'))}
              className="inline-flex items-center rounded-lg bg-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-orange-700 transition"
            >
              📄 Free Pre-Submission Scope Check →
            </button>
            <Link
              href={`/compare?journals=${journalName.toLowerCase().replace(/\s+/g, '-')}-review-time`}
              className="inline-flex items-center rounded-lg border border-current/30 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition"
            >
              🔍 Compare with Faster Backup Journals
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
