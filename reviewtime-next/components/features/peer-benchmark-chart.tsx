'use client'

import React, { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { formatNumber } from '@/lib/format'

interface PeerComparisonItem {
  name: string
  slug: string
  triageDays: number
  acceptanceMedianDays: number
  acceptanceRate: string
  apc: string
  impactFactor: number
  highlight?: boolean
}

interface PeerBenchmarkChartProps {
  currentJournalName: string
  peers?: PeerComparisonItem[]
}

export function PeerBenchmarkChart({
  currentJournalName,
  peers,
}: PeerBenchmarkChartProps) {
  const [metricMode, setMetricMode] = useState<'turnaround' | 'triage' | 'acceptanceRate'>('turnaround')

  // Top tier biomedical / translational peers benchmark
  const defaultPeers: PeerComparisonItem[] = [
    {
      name: currentJournalName,
      slug: currentJournalName.toLowerCase().replace(/\s+/g, '-') + '-review-time',
      triageDays: 4,
      acceptanceMedianDays: 243,
      acceptanceRate: '7.5%',
      apc: '$12,850',
      impactFactor: 52.3,
      highlight: true,
    },
    {
      name: 'The Lancet',
      slug: 'the-lancet-review-time',
      triageDays: 6,
      acceptanceMedianDays: 110,
      acceptanceRate: '5.0%',
      apc: '$6,830',
      impactFactor: 98.4,
    },
    {
      name: 'Cell',
      slug: 'cell-review-time',
      triageDays: 5,
      acceptanceMedianDays: 240,
      acceptanceRate: '8.0%',
      apc: '$11,500',
      impactFactor: 64.5,
    },
    {
      name: 'Nature Communications',
      slug: 'nature-communications-review-time',
      triageDays: 7,
      acceptanceMedianDays: 234,
      acceptanceRate: '15.0%',
      apc: '$6,790',
      impactFactor: 14.7,
    },
    {
      name: 'Signal Transduction & Targeted Therapy',
      slug: 'signal-transduction-and-targeted-therapy-review-time',
      triageDays: 8,
      acceptanceMedianDays: 145,
      acceptanceRate: '18.0%',
      apc: '$4,390',
      impactFactor: 40.8,
    },
  ]

  const items = peers && peers.length ? peers : defaultPeers
  const maxTurnaround = Math.max(...items.map(p => p.acceptanceMedianDays))
  const maxTriage = Math.max(...items.map(p => p.triageDays))

  return (
    <div className="card-rt overflow-hidden p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-eyebrow">Peer Benchmarking</p>
          <h2 className="text-xl font-semibold text-slate-950">
            {currentJournalName} vs Leading Field Journals
          </h2>
        </div>
        {/* Toggle Mode */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMetricMode('turnaround')}
            className={`rounded-md px-3 py-1 transition ${
              metricMode === 'turnaround'
                ? 'bg-white font-bold text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Total Acceptance (Days)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('triage')}
            className={`rounded-md px-3 py-1 transition ${
              metricMode === 'triage'
                ? 'bg-white font-bold text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Triage Speed (Days)
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Cross-journal comparative turnaround times, editorial triage velocities, acceptance rate selectivity, and APC costs.
      </p>

      {/* Horizontal Grouped Bar Chart */}
      <div className="mt-6 space-y-4">
        {items.map(peer => {
          const val = metricMode === 'turnaround' ? peer.acceptanceMedianDays : peer.triageDays
          const maxVal = metricMode === 'turnaround' ? maxTurnaround : maxTriage
          const widthPct = Math.max(15, Math.round((val / maxVal) * 100))

          return (
            <div
              key={peer.name}
              className={`rounded-xl border p-3.5 transition ${
                peer.highlight
                  ? 'border-orange-300 bg-orange-50/50 ring-1 ring-orange-200'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${peer.highlight ? 'text-orange-900 font-bold' : 'text-slate-900'}`}>
                    {peer.name}
                  </span>
                  {peer.highlight && (
                    <span className="rounded bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                      Current
                    </span>
                  )}
                  <span className="text-xs text-slate-400">JIF {peer.impactFactor}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">
                    Est. Acceptance: <strong className="text-slate-800">{peer.acceptanceRate}</strong>
                  </span>
                  <span className="text-slate-500">
                    APC: <strong className="text-slate-800">{peer.apc}</strong>
                  </span>
                  <span className="font-bold text-sm text-orange-600">
                    {val} days
                  </span>
                </div>
              </div>

              {/* Bar Fill */}
              <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${widthPct}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    peer.highlight
                      ? 'bg-orange-600'
                      : 'bg-slate-400'
                  }`}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Decision Summary */}
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <strong className="text-slate-900">Submission Strategy Insight:</strong> If your priority is fast clinical publication, <em>The Lancet</em> exhibits faster handling for late-stage clinical RCTs (~110d). If your focus is high-impact translational mechanism with higher acceptance safety, <em>Nature Communications</em> offers a ~15% acceptance rate.
        </div>
        <Link
          href={`/compare?journals=${items.map(p => p.slug).slice(0, 4).join(',')}`}
          className="shrink-0 font-semibold text-orange-600 hover:text-orange-700 underline"
        >
          Compare in Full Matrix →
        </Link>
      </div>
    </div>
  )
}
