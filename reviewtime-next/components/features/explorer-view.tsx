'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useReviewData } from '@/hooks/use-review-data'
import { formatNumber } from '@/lib/format'
import { EChart } from '@/components/charts/echart'
import { buildTrendOption } from '@/lib/chart-configs'
import { PercentileBand } from '@/components/ui/percentile-band'
import { TrendChip } from '@/components/ui/trend-chip'
import { getJournalSlug } from '@/lib/journal-slug'
import type { JournalStats, TimeSeriesPoint } from '@/lib/types'
import { getDataCapabilities, getDisplayPublisher, getDisplaySubject, getLatestYM, getRelativeDelta, getSubjectMedian, getSubjectRank, getTrendTone, hasMonthlyCoverage } from '@/lib/review-ui'

export function ExplorerView() {
  const t = useTranslations()
  const locale = useLocale()
  const isZh = locale === 'zh'
  const searchParams = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const { journals, loading, error } = useReviewData({ minCount: 1 })
  const capabilities = useMemo(() => getDataCapabilities(journals), [journals])

  const rows = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return journals.slice(0, 100)
    return journals
      .filter((j: JournalStats) =>
        j.label.toLowerCase().includes(q) ||
        j.issn.toLowerCase().includes(q) ||
        j.publisher.toLowerCase().includes(q) ||
        j.subject.toLowerCase().includes(q),
      )
      .slice(0, 100)
  }, [journals, keyword])

  const [selectedLabel, setSelectedLabel] = useState<string>('')

  useEffect(() => {
    const queryJournal = searchParams.get('journal')
    if (queryJournal) {
      setKeyword(queryJournal)
      setSelectedLabel(queryJournal)
    }
  }, [searchParams])

  const selected = useMemo(() => {
    if (!rows.length) return null
    return rows.find((j: JournalStats) => j.label === selectedLabel) ?? rows[0]
  }, [rows, selectedLabel])

  const monthRows = useMemo(() => {
    if (!selected) return []
    return [...selected.timeSeries].reverse().slice(0, 8)
  }, [selected])

  const selectedTrend = useMemo(() => {
    if (!selected || !hasMonthlyCoverage(selected.timeSeries, 24)) return null
    return buildTrendOption(selected.timeSeries.slice(-24), selected.timelinePoints ?? [])
  }, [selected])

  const subjectMedian = useMemo(() => (
    selected ? getSubjectMedian(journals, selected.subject) : null
  ), [journals, selected])

  const subjectDelta = useMemo(() => (
    selected ? getRelativeDelta(selected.median, subjectMedian) : null
  ), [selected, subjectMedian])

  const subjectRank = useMemo(() => (
    selected ? getSubjectRank(journals, selected) : null
  ), [journals, selected])

  const peers = useMemo(() => {
    if (!selected) return []
    return journals
      .filter(j => capabilities.hasSubjectCoverage ? j.subject === selected.subject : j.label !== selected.label)
      .sort((a, b) => a.median - b.median)
      .slice(0, 5)
  }, [capabilities.hasSubjectCoverage, journals, selected])

  if (loading) return <div className="card-rt p-6">{t('common.loading')}</div>
  if (error) return <div className="card-rt p-6 text-red-600">{t('common.error')}: {error}</div>

  return (
    <div className="space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-eyebrow">{t('explorer.hero.eyebrow')}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{selected?.label ?? t('explorer.title')}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              {selected ? t('explorer.hero.subSelected') : t('explorer.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
              ISSN: {selected?.issn || t('common.unknown')}
            </span>
            {selected && getDisplayPublisher(selected) ? (
              <span className="inline-flex rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                {getDisplayPublisher(selected)}
              </span>
            ) : null}
            {selected && getDisplaySubject(selected) ? (
              <span className="inline-flex rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                {getDisplaySubject(selected)}
              </span>
            ) : null}
            {!capabilities.hasPublisherCoverage || !capabilities.hasSubjectCoverage ? (
              <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                {t('explorer.sampleData.metadataPending')}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-3">
          <div className="rt-search-panel p-3">
            <input
              value={keyword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
              placeholder={t('explorer.searchPlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            />
            <p className="mt-2 text-xs text-slate-500">{t('explorer.results', { count: rows.length })}</p>
          </div>

          <div className="rt-search-panel max-h-[760px] overflow-auto">
            {rows.map((j: JournalStats) => {
              const active = selected?.label === j.label
              return (
                <button
                  key={j.label}
                  onClick={() => setSelectedLabel(j.label)}
                  className={active
                    ? 'w-full border-l-4 border-orange-600 bg-orange-50/80 px-3 py-3 text-left'
                    : 'w-full border-l-4 border-transparent px-3 py-3 text-left hover:bg-slate-50'}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{j.label}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{[getDisplayPublisher(j), getDisplaySubject(j)].filter(Boolean).join(' · ') || t('explorer.sampleData.identityPending')}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-slate-950">{formatNumber(j.median)}d</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <span>P25-P75 {formatNumber(j.p25)}-{formatNumber(j.p75)}</span>
                    <span>{formatNumber(j.count)} records</span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_340px]">
            <article className="rt-decision-panel">
              <p className="section-eyebrow">{t('explorer.panels.decision')}</p>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-sm font-medium text-slate-600">{t('explorer.cards.totalHandling')}</p>
                  <p className="mt-1 text-6xl font-semibold tracking-tight text-slate-950">
                    {formatNumber(selected?.median)} <span className="text-2xl text-slate-500">{t('common.days')}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected ? <TrendChip tone={getTrendTone(selected.trend)} /> : null}
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                {t('explorer.cards.rangeSummary', {
                  p25: formatNumber(selected?.p25),
                  p75: formatNumber(selected?.p75),
                })}
              </p>
              {selected ? <div className="mt-4"><PercentileBand p25={selected.p25} median={selected.median} p75={selected.p75} /></div> : null}

              {selected && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200/60 pt-4">
                  <Link
                    href={`/journals/${getJournalSlug(selected.label, selected.journal_key)}`}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition"
                  >
                    {isZh ? '查看期刊完整详情 →' : 'View Full Journal Details →'}
                  </Link>
                  <Link
                    href={`/compare?journals=${encodeURIComponent(getJournalSlug(selected.label, selected.journal_key))}`}
                    className="rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-700 shadow-sm hover:bg-orange-100 transition"
                  >
                    {isZh ? '加入期刊横向对比' : 'Add to Compare'}
                  </Link>
                </div>
              )}
            </article>

            <article className="card-rt p-4 md:p-5">
              <p className="section-eyebrow">{t('explorer.panels.position')}</p>
              {capabilities.hasSubjectCoverage ? (
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">{t('explorer.cards.subjectDelta')}</p>
                    <p className="mt-1 text-3xl font-semibold text-slate-950">
                      {subjectDelta === null ? t('common.unknown') : `${subjectDelta > 0 ? '+' : ''}${subjectDelta}%`}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {subjectDelta === null
                        ? t('explorer.cards.subjectDeltaUnknown')
                        : t(subjectDelta >= 0 ? 'explorer.cards.subjectDeltaFast' : 'explorer.cards.subjectDeltaSlow')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('explorer.cards.rank')}</p>
                    <p className="mt-1 text-3xl font-semibold text-slate-950">
                      {subjectRank ? `#${subjectRank.rank} / ${subjectRank.total}` : t('common.unknown')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('explorer.cards.latestUpdate')}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{selected ? getLatestYM(selected) ?? t('common.unknown') : t('common.unknown')}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">{t('explorer.sampleData.subjectUnavailableTitle')}</p>
                  <p className="mt-2 text-sm leading-6 text-amber-800">{t('explorer.sampleData.subjectUnavailableDesc')}</p>
                  <div className="mt-4">
                    <p className="text-sm text-amber-700">{t('explorer.cards.latestUpdate')}</p>
                    <p className="mt-1 text-lg font-semibold text-amber-950">{selected ? getLatestYM(selected) ?? t('common.unknown') : t('common.unknown')}</p>
                  </div>
                </div>
              )}
            </article>
          </section>

          <section className={`grid gap-4 ${selectedTrend ? 'lg:grid-cols-[minmax(0,1.2fr)_320px]' : ''}`}>
            {selectedTrend && <article className="card-rt p-4 md:p-5">
              <p className="section-eyebrow">{t('explorer.panels.trend')}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{t('explorer.cards.trend')}</h2>
              <p className="mt-2 text-sm text-slate-600">{t('explorer.cards.trendSubtitle')}</p>
              <EChart option={selectedTrend} className="mt-4 h-[320px] w-full" />
            </article>}

            <article className="card-rt p-4 md:p-5">
              <p className="section-eyebrow">{capabilities.hasSubjectCoverage ? t('explorer.panels.peers') : t('explorer.panels.fastAlternatives')}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{capabilities.hasSubjectCoverage ? selected?.subject ?? t('common.unknown') : t('explorer.sampleData.fastAlternatives')}</h2>
              <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
                {peers.map((peer, index) => {
                  const current = selected?.label === peer.label
                  return (
                    <div
                      key={peer.label}
                      onClick={() => setSelectedLabel(peer.label)}
                      className={`cursor-pointer transition ${current ? 'bg-orange-50/80 px-2 py-3 rounded-lg' : 'px-2 py-3 hover:bg-slate-50'}`}
                      title={isZh ? `点击切换至 ${peer.label}` : `Click to view ${peer.label}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500">#{index + 1}</p>
                          <p className="truncate text-sm font-semibold text-slate-900">{current ? t('explorer.peerCurrent') : peer.label}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(peer.median)} {t('common.days')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </article>
          </section>

          <section className="card-rt p-4 md:p-5">
            <p className="section-eyebrow">{t('explorer.panels.records')}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{t('explorer.reviews.title', { journal: selected?.label ?? '' })}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="sci-table min-w-full">
                <thead>
                  <tr>
                    <th>{t('explorer.reviews.year')}</th>
                    <th>{t('explorer.reviews.totalHandling')}</th>
                    <th>{t('explorer.table.iqr')}</th>
                    <th>{t('explorer.reviews.numReports')}</th>
                    <th>{t('explorer.table.trend')}</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map((m: TimeSeriesPoint, index) => (
                    <tr key={m.ym}>
                      <td>{m.ym}</td>
                      <td>{formatNumber(m.median)} {t('common.days')}</td>
                      <td>{formatNumber(m.p25)} - {formatNumber(m.p75)}</td>
                      <td>{formatNumber(m.count)} records</td>
                      <td>
                        {index === 0 ? (
                          <span className="text-slate-500">{t('common.unknown')}</span>
                        ) : (
                          <TrendChip tone={getTrendTone(m.median - monthRows[index - 1].median)} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
