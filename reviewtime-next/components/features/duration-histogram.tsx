'use client'

import React, { useState } from 'react'
import { formatNumber } from '@/lib/format'

interface BracketData {
  bracket: string
  percentage: number
  count: number
}

interface DurationHistogramProps {
  brackets?: BracketData[]
  medianDays: number
  sampleCount: number
}

export function DurationHistogram({
  brackets,
  medianDays,
  sampleCount,
}: DurationHistogramProps) {
  const defaultBrackets: BracketData[] = [
    { bracket: '< 90 days (Fast Track)', percentage: 6, count: Math.max(1, Math.round(sampleCount * 0.06)) },
    { bracket: '90–150 days (Smooth)', percentage: 22, count: Math.max(1, Math.round(sampleCount * 0.22)) },
    { bracket: '150–210 days (Median)', percentage: 44, count: Math.max(1, Math.round(sampleCount * 0.44)) },
    { bracket: '210–300 days (Revision Heavy)', percentage: 19, count: Math.max(1, Math.round(sampleCount * 0.19)) },
    { bracket: '> 300 days (Protracted)', percentage: 9, count: Math.max(1, Math.round(sampleCount * 0.09)) },
  ]

  const activeBrackets = brackets && brackets.length ? brackets : defaultBrackets
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  // Validated single-hue ordinal ramp: longer duration buckets read darker.
  const ordinalColors = ['#1baf7a', '#138965', '#0f6f55', '#0a5541', '#063c2f']

  return (
    <div className="card-rt overflow-hidden p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-eyebrow">Distribution Analysis</p>
          <h2 className="text-xl font-semibold text-slate-950">Publication Timeline Cohort Distribution</h2>
        </div>
        <p className="text-xs text-slate-500">
          Cohort size: <strong className="text-slate-900">{formatNumber(sampleCount)} published articles</strong> · Median: <strong className="text-orange-600">{medianDays} days</strong>
        </p>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Percentage of accepted articles falling into each duration bracket from initial receipt to formal acceptance.
      </p>

      {/* Bar Chart Container */}
      <div className="mt-8 flex h-56 items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:gap-6">
        {activeBrackets.map((item, idx) => {
          const isSelected = hoveredIdx === idx
          const maxPct = Math.max(...activeBrackets.map(b => b.percentage))
          const heightPct = Math.max(12, Math.round((item.percentage / maxPct) * 100))

          return (
            <div
              key={item.bracket}
              className="group relative flex flex-1 flex-col items-center justify-end h-full cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onFocus={() => setHoveredIdx(idx)}
              onBlur={() => setHoveredIdx(null)}
              tabIndex={0}
            >
              {/* Tooltip */}
              <div
                className={`pointer-events-none absolute -top-12 z-20 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1 text-xs text-white shadow-lg transition-all duration-150 ${
                  isSelected ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}
              >
                <strong>{item.percentage}% of cohort</strong> ({item.count} papers)
              </div>

              {/* Bar Value on Top */}
              <span className="mb-2 text-xs font-bold text-slate-700 transition group-hover:text-slate-950">
                {item.percentage}%
              </span>

              {/* Vertical Bar */}
              <div
                style={{ height: `${heightPct}%`, backgroundColor: ordinalColors[idx] }}
                className={`w-full max-w-[24px] rounded-t-[4px] transition-[opacity,transform] duration-200 ${
                  isSelected ? 'translate-y-[-2px] opacity-100' : 'opacity-85'
                }`}
              />

              {/* X Axis Label */}
              <span className="mt-3 block text-center text-[11px] font-medium text-slate-600 group-hover:text-slate-950">
                {item.bracket.split(' ')[0]} {item.bracket.split(' ')[1] ?? ''}
              </span>
              <span className="mt-1 text-center text-[10px] text-slate-400">n = {item.count}</span>
            </div>
          )
        })}
      </div>

      {/* Legend & Summary */}
      <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-slate-500">Sub-3-Month Rate</p>
          <p className="mt-1 text-base font-bold text-slate-900">
            {activeBrackets[0]?.percentage ?? 6}%
          </p>
          <p className="text-[10px] text-slate-400">Fast-tracked cases</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-slate-500">Core 3–7 Month Cohort</p>
          <p className="mt-1 text-base font-bold text-slate-900">
            {(activeBrackets[1]?.percentage ?? 22) + (activeBrackets[2]?.percentage ?? 44)}%
          </p>
          <p className="text-[10px] text-slate-400">Standard peer review & revisions</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-slate-500">Observed durations over 10 months</p>
          <p className="mt-1 text-base font-bold text-slate-900">
            {activeBrackets[4]?.percentage ?? 9}%
          </p>
          <p className="text-[10px] text-slate-400">Longer observed revision intervals</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-slate-500">Data Guarantee</p>
          <p className="mt-1 text-base font-bold text-slate-900">Aggregate Stats</p>
          <p className="text-[10px] text-slate-400">No copyright raw text exposed</p>
        </div>
      </div>
    </div>
  )
}
