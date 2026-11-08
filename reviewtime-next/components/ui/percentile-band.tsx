'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface PercentileBandProps {
  p25: number
  median: number
  p75: number
  compact?: boolean
}

function getSafePercent(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.max(6, Math.min(100, (value / max) * 100))
}

export function PercentileBand({ p25, median, p75, compact = false }: PercentileBandProps) {
  const t = useTranslations('common')
  const max = Math.max(p75, median, p25, 1)
  const left = getSafePercent(p25, max)
  const center = getSafePercent(median, max)
  const right = getSafePercent(p75, max)

  return (
    <div className={cn('space-y-2', compact && 'space-y-1.5')}>
      <div className="relative h-2 rounded-full bg-slate-100 border border-slate-200/60">
        <div
          className="absolute top-0 h-full rounded-full bg-orange-100 border border-orange-200/80"
          style={{ left: `${left}%`, width: `${Math.max(10, right - left)}%` }}
        />
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-orange-500 bg-white shadow-sm ring-2 ring-orange-200/60"
          style={{ left: `${center}%` }}
        />
      </div>
      <div className={cn('grid grid-cols-3 gap-2 text-slate-500', compact ? 'text-[11px]' : 'text-xs')}>
        <div>
          <span className="font-semibold text-slate-600">P25:</span> {p25} {t('days')}
        </div>
        <div className="text-center">
          <span className="font-semibold text-orange-600">P50:</span> {median} {t('days')}
        </div>
        <div className="text-right">
          <span className="font-semibold text-slate-600">P75:</span> {p75} {t('days')}
        </div>
      </div>
    </div>
  )
}
