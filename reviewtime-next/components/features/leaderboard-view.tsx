'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useReviewData } from '@/hooks/use-review-data'
import { formatNumber } from '@/lib/format'
import { PercentileBand } from '@/components/ui/percentile-band'
import { TrendChip } from '@/components/ui/trend-chip'
import { getTrendTone } from '@/lib/review-ui'
import { getJournalSlug } from '@/lib/journal-slug'

type TabKey = 'fastest' | 'slowest' | 'trend'

export function LeaderboardView() {
  const t = useTranslations()
  const locale = useLocale()
  const isZh = locale === 'zh'
  const { journals, loading, error } = useReviewData({ minCount: 3 })
  const [tab, setTab] = useState<TabKey>('fastest')

  const rows = useMemo(() => {
    if (tab === 'fastest') return [...journals].sort((a, b) => a.median - b.median).slice(0, 20)
    if (tab === 'slowest') return [...journals].sort((a, b) => b.median - a.median).slice(0, 20)
    return [...journals].filter(j => j.trend_eligible && j.trend < 0).sort((a, b) => a.trend - b.trend).slice(0, 20)
  }, [journals, tab])

  if (loading) return <div className="card-rt p-6">{t('common.loading')}</div>
  if (error) return <div className="card-rt p-6 text-red-600">{t('common.error')}: {error} · {t('common.errorDetail')}</div>

  const topCards = rows.slice(0, 3)
  const tableRows = rows.slice(3)

  return (
    <div className="space-y-6">
      <header className="card-rt p-6 md:p-8">
        <p className="section-eyebrow">{t('nav.leaderboard')}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{t('leaderboard.title')}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">{t('leaderboard.subtitle')}</p>
      </header>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-1">
        {(['fastest', 'slowest', 'trend'] as TabKey[]).map(k => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={
              k === tab
                ? 'rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm'
                : 'rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50'
            }
          >
            {t(`leaderboard.tabs.${k}`)}
          </button>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {topCards.map((journal, index) => {
          const slug = getJournalSlug(journal.label, journal.journal_key)
          return (
            <article key={journal.label} className="insight-card flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Top {index + 1}</p>
                <h2 className="mt-3 text-xl font-bold text-slate-950">
                  <Link href={`/journals/${slug}`} className="hover:text-orange-600 transition">
                    {journal.label}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-slate-600">{journal.publisher} · {journal.subject}</p>
                <p className="mt-5 text-4xl font-black text-slate-950">
                  {formatNumber(journal.median)} <span className="text-xl font-normal text-slate-500">{t('common.days')}</span>
                </p>
                <div className="mt-4">
                  <PercentileBand p25={journal.p25} median={journal.median} p75={journal.p75} compact />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <TrendChip tone={getTrendTone(journal.trend)} />
                </div>
              </div>
              <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                <Link
                  href={`/journals/${slug}`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {isZh ? '详细时间线 →' : 'Details →'}
                </Link>
                <Link
                  href={`/compare?journals=${encodeURIComponent(slug)}`}
                  className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition"
                >
                  {isZh ? '加入对比' : 'Compare'}
                </Link>
              </div>
            </article>
          )
        })}
      </section>

      <section className="card-rt overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">{t('leaderboard.listTitle')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="sci-table min-w-full text-xs">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('leaderboard.table.journal')}</th>
                <th>{t('leaderboard.table.median')}</th>
                <th>{t('leaderboard.table.iqr')}</th>
                <th>{t('leaderboard.table.count')}</th>
                <th>{t('leaderboard.table.change')}</th>
                <th className="text-center">{isZh ? '操作' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((j, i) => {
                const slug = getJournalSlug(j.label, j.journal_key)
                return (
                  <tr key={j.label}>
                    <td>{i + 4}</td>
                    <td>
                      <div>
                        <Link href={`/journals/${slug}`} className="font-bold text-slate-900 hover:text-orange-600 transition">
                          {j.label}
                        </Link>
                        <p className="text-xs text-slate-500">{j.publisher} · {j.subject}</p>
                      </div>
                    </td>
                    <td>{formatNumber(j.median)} {t('common.days')}</td>
                    <td>{formatNumber(j.p25)} - {formatNumber(j.p75)}</td>
                    <td>{formatNumber(j.count)} records</td>
                    <td><TrendChip tone={getTrendTone(j.trend)} /></td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/journals/${slug}`}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {isZh ? '查看' : 'View'}
                        </Link>
                        <Link
                          href={`/compare?journals=${encodeURIComponent(slug)}`}
                          className="rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                        >
                          {isZh ? '对比' : 'Compare'}
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
