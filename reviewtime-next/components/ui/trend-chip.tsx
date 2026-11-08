'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { TrendTone } from '@/lib/review-ui'

interface TrendChipProps {
  tone: TrendTone
}

export function TrendChip({ tone }: TrendChipProps) {
  const t = useTranslations('trust')

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tone === 'faster' && 'border border-emerald-200/80 bg-emerald-50 text-emerald-800',
        tone === 'slower' && 'border border-rose-200/80 bg-rose-50 text-rose-800',
        tone === 'stable' && 'border border-slate-200 bg-slate-50 text-slate-700',
      )}
    >
      {tone === 'faster' ? '↓ ' : tone === 'slower' ? '↑ ' : '→ '}
      {t(`trend.${tone}`)}
    </span>
  )
}
