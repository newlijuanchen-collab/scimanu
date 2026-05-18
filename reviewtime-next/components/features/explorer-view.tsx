'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import { useTranslations } from 'next-intl'
import { useReviewData } from '@/hooks/use-review-data'
import { formatNumber } from '@/lib/format'
import { SpeedBadge } from '@/components/ui/speed-badge'
import type { JournalStats, TimeSeriesPoint } from '@/lib/types'

export function ExplorerView() {
  const t = useTranslations()
  const [keyword, setKeyword] = useState('')
  const { journals, loading, error } = useReviewData({ minCount: 1 })

  const renderTrend = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value) || value === 0) {
      return t('trend.flat')
    }
    if (value > 0) return t('trend.up', { days: Math.round(value) })
    return t('trend.down', { days: Math.round(Math.abs(value)) })
  }

  const rows = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return journals.slice(0, 100)
    return journals
      .filter((j: JournalStats) => j.label.toLowerCase().includes(q) || j.issn.toLowerCase().includes(q))
      .slice(0, 100)
  }, [journals, keyword])

  const [selectedLabel, setSelectedLabel] = useState<string>('')

  const selected = useMemo(() => {
    if (!rows.length) return null
    return rows.find((j: JournalStats) => j.label === selectedLabel) ?? rows[0]
  }, [rows, selectedLabel])

  const monthRows = useMemo(() => {
    if (!selected) return []
    return [...selected.timeSeries].reverse().slice(0, 8)
  }, [selected])

  const qualityScore = (j: JournalStats) => {
    if (j.median <= 30) return 5
    if (j.median <= 60) return 4
    if (j.median <= 90) return 3
    if (j.median <= 140) return 2
    return 1
  }

  const overallScore = (j: JournalStats) => {
    const base = qualityScore(j)
    if (j.trend <= -10) return Math.min(5, base + 1)
    if (j.trend >= 10) return Math.max(1, base - 1)
    return base
  }

  const outcomeLabel = (days: number) => (days <= 120 ? t('explorer.outcome.accepted') : t('explorer.outcome.rejected'))

  if (loading) return <div className="card-rt p-6">{t('common.loading')}</div>
  if (error) return <div className="card-rt p-6 text-red-600">{t('common.error')}: {error}</div>

  return (
    <div className="space-y-5">
      <header className="scirev-hero rounded-2xl p-6 md:p-8">
        <p className="text-sm text-indigo-100">{t('explorer.hero.eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{selected?.label ?? t('explorer.title')}</h1>
        <p className="mt-2 max-w-3xl text-sm text-indigo-100 md:text-base">
          {selected ? t('explorer.hero.subSelected') : t('explorer.subtitle')}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
            ISSN: {selected?.issn || t('common.unknown')}
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
            {selected?.publisher || t('common.unknown')}
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
            {t('explorer.table.count')}: {selected ? formatNumber(selected.count) : t('common.unknown')}
          </span>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="scirev-panel p-4">
            <input
              value={keyword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
              placeholder={t('explorer.searchPlaceholder')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-primary-500 focus:ring"
            />
            <p className="mt-2 text-xs text-slate-500">{t('explorer.results', { count: rows.length })}</p>
          </div>

          <div className="scirev-panel max-h-[680px] overflow-auto">
            {rows.map((j: JournalStats) => {
              const active = selected?.label === j.label
              return (
                <button
                  key={j.label}
                  onClick={() => setSelectedLabel(j.label)}
                  className={active
                    ? 'w-full border-b border-slate-200 bg-primary-50 px-4 py-3 text-left'
                    : 'w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50'}
                >
                  <p className="text-sm font-medium text-slate-900">{j.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{j.publisher}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                    <span>{formatNumber(j.median)} {t('common.days')}</span>
                    <span>·</span>
                    <SpeedBadge
                      days={j.median}
                      label={t(`speed.${j.median <= 30 ? 'vfast' : j.median <= 60 ? 'fast' : j.median <= 90 ? 'good' : j.median <= 120 ? 'normal' : j.median <= 180 ? 'slow' : 'vslow'}`)}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-2">
            <article className="scirev-panel p-4">
              <h2 className="mb-3 text-2xl font-semibold text-indigo-900">{t('explorer.panels.duration')}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="metric-tile">
                  <p className="metric-label">{t('explorer.cards.firstRound')}</p>
                  <p className="metric-value">{formatNumber(selected?.p25)} {t('common.days')}</p>
                </div>
                <div className="metric-tile">
                  <p className="metric-label">{t('explorer.cards.totalHandling')}</p>
                  <p className="metric-value">{formatNumber(selected?.median)} {t('common.days')}</p>
                </div>
                <div className="metric-tile">
                  <p className="metric-label">{t('explorer.cards.upperIqr')}</p>
                  <p className="metric-value">{formatNumber(selected?.p75)} {t('common.days')}</p>
                </div>
                <div className="metric-tile">
                  <p className="metric-label">{t('explorer.cards.trend')}</p>
                  <p className="metric-value">{selected ? renderTrend(selected.trend) : t('common.unknown')}</p>
                </div>
              </div>
            </article>

            <article className="scirev-panel p-4">
              <h2 className="mb-3 text-2xl font-semibold text-lime-700">{t('explorer.panels.quality')}</h2>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-sm text-slate-700">{t('explorer.cards.reportQuality')}</p>
                  <div className="score-track">
                    <div className="score-fill" style={{ width: `${(selected ? qualityScore(selected) : 0) * 20}%` }}>
                      {selected ? `${qualityScore(selected)} / 5` : '—'}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-sm text-slate-700">{t('explorer.cards.overallRating')}</p>
                  <div className="score-track">
                    <div
                      className={`score-fill ${selected && overallScore(selected) <= 2 ? 'score-low' : ''}`}
                      style={{ width: `${(selected ? overallScore(selected) : 0) * 20}%` }}
                    >
                      {selected ? `${overallScore(selected)} / 5` : '—'}
                    </div>
                  </div>
                </div>
                <div className="metric-tile">
                  <p className="metric-label">{t('explorer.cards.latestOutcome')}</p>
                  <p className={selected ? (selected.median <= 120 ? 'metric-value outcome-accepted' : 'metric-value outcome-rejected') : 'metric-value'}>
                    {selected ? outcomeLabel(selected.median) : t('common.unknown')}
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="scirev-panel p-4">
            <h2 className="mb-3 text-3xl font-semibold text-slate-900">{t('explorer.reviews.title', { journal: selected?.label ?? '' })}</h2>
            <div className="overflow-x-auto">
              <table className="sci-table min-w-full">
                <thead>
                  <tr>
                    <th>{t('explorer.reviews.firstRound')}</th>
                    <th>{t('explorer.reviews.totalHandling')}</th>
                    <th>{t('explorer.reviews.immediateReject')}</th>
                    <th>{t('explorer.reviews.numReports')}</th>
                    <th>{t('explorer.reviews.reportQuality')}</th>
                    <th>{t('explorer.reviews.overallRating')}</th>
                    <th>{t('explorer.reviews.outcome')}</th>
                    <th>{t('explorer.reviews.year')}</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map((m: TimeSeriesPoint) => {
                    const q = qualityScore({ ...selected!, median: m.median } as JournalStats)
                    const o = overallScore({ ...selected!, median: m.median } as JournalStats)
                    const year = m.ym.slice(0, 4)
                    return (
                      <tr key={m.ym}>
                        <td>{formatNumber(m.p25)} {t('common.days')}</td>
                        <td>{formatNumber(m.median)} {t('common.days')}</td>
                        <td>{t('common.unknown')}</td>
                        <td>{formatNumber(m.count)}</td>
                        <td>
                          <div className="score-track max-w-[120px]">
                            <div className="score-fill" style={{ width: `${q * 20}%` }}>{q}</div>
                          </div>
                        </td>
                        <td>
                          <div className="score-track max-w-[120px]">
                            <div className={`score-fill ${o <= 2 ? 'score-low' : ''}`} style={{ width: `${o * 20}%` }}>{o}</div>
                          </div>
                        </td>
                        <td className={m.median <= 120 ? 'outcome-accepted' : 'outcome-rejected'}>{outcomeLabel(m.median)}</td>
                        <td>{year}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
