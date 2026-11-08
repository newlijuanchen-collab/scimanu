'use client'

import React from 'react'

interface MilestoneFunnelProps {
  triageDays?: number
  firstReviewDays?: number
  revisionDays?: number
  finalDecisionDays?: number
  onlineDays?: number
  totalDays: number
  deskRejectRate?: string
}

export function MilestoneFunnel({
  triageDays = 4,
  firstReviewDays = 45,
  revisionDays = 75,
  finalDecisionDays = 25,
  onlineDays = 20,
  totalDays,
  deskRejectRate = '90%+',
}: MilestoneFunnelProps) {
  const stages = [
    {
      id: 'triage',
      title: '1. Editorial Triage',
      days: `${triageDays} days`,
      badge: `⚡ ${deskRejectRate} desk reject barrier`,
      desc: 'Editors evaluate scope, novelty, and translational relevance before deciding on peer review.',
      tone: 'bg-white border-slate-200 text-slate-700',
      pill: 'bg-orange-100 text-orange-700',
    },
    {
      id: 'review',
      title: '2. External Peer Review',
      days: `${firstReviewDays} days`,
      badge: '2–3 reviewer reports',
      desc: 'Manuscript sent to independent expert reviewers for thorough scientific and technical critique.',
      tone: 'bg-white border-slate-200 text-slate-700',
      pill: 'bg-orange-100 text-orange-700',
    },
    {
      id: 'revision',
      title: '3. Author Revision & Rebuttal',
      days: `${revisionDays} days`,
      badge: 'Major/Minor revision',
      desc: 'Authors conduct validation experiments, re-analyze cohorts, and prepare point-by-point rebuttal.',
      tone: 'bg-white border-slate-200 text-slate-700',
      pill: 'bg-orange-100 text-orange-700',
    },
    {
      id: 'decision',
      title: '4. Final Acceptance',
      days: `${finalDecisionDays} days`,
      badge: 'Editorial sign-off',
      desc: 'Editorial team verifies revised figures, data availability, and issues formal acceptance.',
      tone: 'bg-white border-slate-200 text-slate-700',
      pill: 'bg-orange-100 text-orange-700',
    },
    {
      id: 'online',
      title: '5. Online Proofs & DOI',
      days: `${onlineDays} days`,
      badge: 'Version of record',
      desc: 'Typesetting, author proof corrections, and official online publication with live DOI.',
      tone: 'bg-white border-slate-200 text-slate-700',
      pill: 'bg-orange-100 text-orange-700',
    },
  ]

  return (
    <div className="card-rt overflow-hidden p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-eyebrow">Milestone Decomposition</p>
          <h2 className="text-xl font-semibold text-slate-950">Peer Review Lifecycle Funnel</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          <span>Observed cohort total:</span>
          <strong>{totalDays} days</strong>
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Official editorial statistics versus real publication timelines: understanding where author delays occur.
      </p>

      {/* Visual horizontal stage progress */}
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">
        {stages.map((stage, idx) => (
          <div
            key={stage.id}
            className={`relative flex flex-col justify-between rounded-xl border p-4 shadow-sm transition hover:shadow-md ${stage.tone}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-75">Step 0{idx + 1}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${stage.pill}`}>
                  {stage.days}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-slate-900">{stage.title}</h3>
              <p className="mt-2 text-xs leading-relaxed opacity-90">{stage.desc}</p>
            </div>
            <div className="mt-4 border-t border-current/10 pt-2.5">
              <span className="inline-block text-[11px] font-semibold">{stage.badge}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3.5 text-xs text-slate-600 border border-slate-200/80">
        <strong className="text-slate-900">Why the discrepancy?</strong> The publisher-reported 4-day first decision is dominated by the ~92% desk-rejection rate. For manuscripts successfully sent to external peer review, first reviewer comments typically take 40–55 days, followed by 2–3 months of author validation experiments.
      </div>
    </div>
  )
}
