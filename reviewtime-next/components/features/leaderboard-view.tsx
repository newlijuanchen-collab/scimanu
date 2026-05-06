'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useReviewData } from '@/hooks/use-review-data'
import { SpeedBadge } from '@/components/ui/speed-badge'
import { formatNumber, trendText } from '@/lib/format'

type TabKey = 'fastest' | 'slowest' | 'trend'

export function LeaderboardView() {
  const t = useTranslations()
  const { journals, loading, error } = useReviewData({ minCount: 3 })
  const [tab, setTab] = useState<TabKey>('fastest')

  const rows = useMemo(() => {
    if (tab === 'fastest') return [...journals].sort((a, b) => a.median - b.median).slice(0, 30)
    if (tab === 'slowest') return [...journals].sort((a, b) => b.median - a.median).slice(0, 30)
    return [...journals].sort((a, b) => a.trend - b.trend).slice(0, 30)
  }, [journals, tab])

  if (loading) return <div className="card-rt p-6">{t('common.loading')}</div>
  if (error) return <div className="card-rt p-6 text-red-600">{t('common.error')}: {error}</div>

  return (
    <div className="space-y-5">
      <header>
        <h1 className="page-title">{t('leaderboard.title')}</h1>
        <p className="page-subtitle">{t('leaderboard.subtitle')}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(['fastest', 'slowest', 'trend'] as TabKey[]).map(k => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={k === tab ? 'rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white' : 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm'}
          >
            {t(`leaderboard.tabs.${k}`)}
          </button>
        ))}
      </div>

      <div className="card-rt overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">{t('leaderboard.table.journal')}</th>
              <th className="px-3 py-2">{t('leaderboard.table.publisher')}</th>
              <th className="px-3 py-2">{t('leaderboard.table.median')}</th>
              <th className="px-3 py-2">{t('leaderboard.table.count')}</th>
              <th className="px-3 py-2">{t('leaderboard.table.speed')}</th>
              <th className="px-3 py-2">{t('leaderboard.table.change')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((j, i) => (
              <tr key={j.label} className="border-t border-slate-100">
                <td className="px-3 py-2">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{j.label}</td>
                <td className="px-3 py-2 text-slate-600">{j.publisher}</td>
                <td className="px-3 py-2">{formatNumber(j.median)}</td>
                <td className="px-3 py-2">{formatNumber(j.count)}</td>
                <td className="px-3 py-2"><SpeedBadge days={j.median} label={t(`speed.${j.median <= 30 ? 'vfast' : j.median <= 60 ? 'fast' : j.median <= 90 ? 'good' : j.median <= 120 ? 'normal' : j.median <= 180 ? 'slow' : 'vslow'}`)} /></td>
                <td className="px-3 py-2">{trendText(j.trend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
