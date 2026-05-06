import { getSpeedInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SpeedBadgeProps {
  days: number
  label: string
}

export function SpeedBadge({ days, label }: SpeedBadgeProps) {
  const info = getSpeedInfo(days)
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        info.tier === 'vfast' && 'bg-emerald-100 text-emerald-700',
        info.tier === 'fast' && 'bg-green-100 text-green-700',
        info.tier === 'good' && 'bg-lime-100 text-lime-700',
        info.tier === 'normal' && 'bg-amber-100 text-amber-700',
        info.tier === 'slow' && 'bg-orange-100 text-orange-700',
        info.tier === 'vslow' && 'bg-red-100 text-red-700',
      )}
    >
      {label}
    </span>
  )
}
