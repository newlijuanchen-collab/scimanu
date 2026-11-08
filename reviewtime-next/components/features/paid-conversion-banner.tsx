'use client'

import React from 'react'

interface PaidConversionBannerProps {
  journalName: string
  deskRejectRate?: string
  onOpenScan?: () => void
}

export function PaidConversionBanner({
  journalName,
  deskRejectRate = '92%',
  onOpenScan,
}: PaidConversionBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-sm">
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-400 border border-orange-500/30">
              ⚡ Pre-Submission Safeguard
            </span>
            <span className="text-xs text-slate-400">
              {deskRejectRate} of {journalName} submissions are declined at triage
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Don't waste 4 months on a preventable rejection.
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Run an automated audit on your manuscript before submission. Spot missing clinical/translational bridges, statistical reporting omissions (CONSORT/STROBE), and scope mismatches that trigger immediate desk rejection.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> 3-Minute Instant Scan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> Simulated 3-Persona Peer Review
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> Journal Ladder Matching
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
          <button
            type="button"
            onClick={onOpenScan ?? (() => alert('Starting free 3-minute manuscript readiness scan...'))}
            className="rounded-xl bg-orange-500 px-5 py-3 text-center text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-400 active:scale-95"
          >
            Start Free Manuscript Scan →
          </button>
          <button
            type="button"
            onClick={() => alert('Opening Full Pre-Submission Audit ($39 package)...')}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-center text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Full Audit & Rebuttal Dossier ($39)
          </button>
        </div>
      </div>
    </section>
  )
}
