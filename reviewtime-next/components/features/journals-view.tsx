'use client'

import { useMemo, useState, useEffect, type ChangeEvent } from 'react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { formatCompactNumber, formatNumber } from '@/lib/format'
import type { GlobalStats, JournalStats } from '@/lib/types'
import { PercentileBand } from '@/components/ui/percentile-band'
import { inferDiscipline, isValidPeerReviewedJournal } from '@/lib/stats-aggregator'
import { getJournalSlug } from '@/lib/journal-slug'

interface JournalsViewProps {
  journals: JournalStats[]
  stats: GlobalStats
  asOf: string
}

type SpeedFilter = 'all' | 'fast' | 'standard' | 'extended' | 'longer'

export function JournalsView({ journals, stats, asOf }: JournalsViewProps) {
  const locale = useLocale()
  const isZh = locale === 'zh'
  const searchParams = useSearchParams()

  const urlDiscipline = searchParams?.get('discipline') || 'all'
  const urlSpeed = searchParams?.get('speed') || ''
  const urlQuery = searchParams?.get('q') || searchParams?.get('query') || ''

  const initialSpeed: SpeedFilter =
    urlSpeed === '60' || urlSpeed === 'fast'
      ? 'fast'
      : urlSpeed === '120' || urlSpeed === 'standard'
      ? 'standard'
      : urlSpeed === '200' || urlSpeed === 'extended'
      ? 'extended'
      : urlSpeed === 'longer'
      ? 'longer'
      : 'all'

  const [keyword, setKeyword] = useState(urlQuery)
  const [minSamples, setMinSamples] = useState(10)
  const [speedFilter, setSpeedFilter] = useState<SpeedFilter>(initialSpeed)
  const [disciplineFilter, setDisciplineFilter] = useState(urlDiscipline)

  useEffect(() => {
    if (urlDiscipline) setDisciplineFilter(urlDiscipline)
  }, [urlDiscipline])

  useEffect(() => {
    if (urlSpeed) {
      if (urlSpeed === '60' || urlSpeed === 'fast') setSpeedFilter('fast')
      else if (urlSpeed === '120' || urlSpeed === 'standard') setSpeedFilter('standard')
      else if (urlSpeed === '200' || urlSpeed === 'extended') setSpeedFilter('extended')
      else if (urlSpeed === 'longer') setSpeedFilter('longer')
      else setSpeedFilter('all')
    }
  }, [urlSpeed])

  useEffect(() => {
    if (urlQuery) setKeyword(urlQuery)
  }, [urlQuery])

  const rows = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return journals
      .filter(journal => journal.count >= minSamples)
      .filter(journal => {
        // Prioritize genuine peer-reviewed academic journals
        if (minSamples >= 20 && !isValidPeerReviewedJournal(journal)) {
          return false
        }
        return true
      })
      .filter(journal => {
        if (speedFilter === 'all') return true
        if (speedFilter === 'fast') return journal.median < 60
        if (speedFilter === 'standard') return journal.median >= 60 && journal.median <= 120
        if (speedFilter === 'extended') return journal.median > 120 && journal.median <= 200
        return journal.median > 200
      })
      .filter(journal => {
        if (disciplineFilter === 'all') return true
        const disc = inferDiscipline(journal.label).en
        return disc === disciplineFilter
      })
      .filter(journal => {
        if (!q) return true
        return [
          journal.label,
          journal.name,
          journal.issn,
          journal.source_display,
          journal.publisher,
          journal.subject,
        ].some(value => String(value ?? '').toLowerCase().includes(q))
      })
      .sort((a, b) => a.median - b.median || a.p75 - b.p75 || b.count - a.count)
      .slice(0, 300)
  }, [journals, keyword, minSamples, speedFilter, disciplineFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="border-b border-slate-200/90 pb-6">
        <p className="section-eyebrow">{isZh ? '期刊目录 · 多学科分类' : 'Journal Directory · Subject Categories'}</p>
        <div className="mt-2 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              {isZh ? '跨学科期刊时间线检索' : 'Journal Timeline Explorer Across Disciplines'}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {isZh
                ? 'SciManu 面向广大科研期刊；当前上线的时间数据基于 PubMed 生物医学试点，涵盖所选定的学术期刊，更多领域与期刊正在持续扩充中。'
                : 'SciManu covers academic research journals; current timeline data are derived from the PubMed biomedical pilot for selected journals, with more journals continuously being added.'}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-xs shadow-sm">
            <div>
              <dt className="text-slate-500">{isZh ? '收录期刊数' : 'Timeline Journals'}</dt>
              <dd className="mt-1 text-2xl font-black text-slate-950">{formatCompactNumber(stats.totalJournals)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{isZh ? '发表时间戳' : 'Article Timelines'}</dt>
              <dd className="mt-1 text-2xl font-black text-slate-950">{formatCompactNumber(stats.totalArticles)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{isZh ? '试点论文合并中位数' : 'Pooled pilot median'}</dt>
              <dd className="mt-1 text-2xl font-black text-orange-600">{formatNumber(stats.globalMedian)}d</dd>
            </div>
            <div>
              <dt className="text-slate-500">{isZh ? '数据更新至' : 'Snapshot Date'}</dt>
              <dd className="mt-1 text-sm font-bold text-slate-900">{asOf}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <section className="rt-search-panel shadow-sm">
        <div className="grid gap-3 border-b border-slate-200/80 p-4 md:grid-cols-[minmax(0,1.2fr)_160px_160px_160px]">
          <input
            value={keyword}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setKeyword(event.target.value)}
            placeholder={isZh ? '搜索期刊名称、ISSN、出版商或关键词…' : 'Search journal name, ISSN, publisher…'}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
          />

          <select
            value={minSamples}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setMinSamples(Number(event.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold shadow-sm outline-none transition focus:border-orange-500"
          >
            <option value={3}>{isZh ? '样本量 ≥ 3 篇' : 'At least 3 timelines'}</option>
            <option value={10}>{isZh ? '样本量 ≥ 10 篇 (推荐)' : 'At least 10 timelines'}</option>
            <option value={20}>{isZh ? '样本量 ≥ 20 篇 (高可信)' : 'At least 20 timelines'}</option>
            <option value={50}>{isZh ? '样本量 ≥ 50 篇 (核心大刊)' : 'At least 50 timelines'}</option>
          </select>

          <select
            value={speedFilter}
            onChange={e => setSpeedFilter(e.target.value as SpeedFilter)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold shadow-sm outline-none transition focus:border-orange-500"
          >
            <option value="all">{isZh ? '全部时长区间' : 'All duration ranges'}</option>
            <option value="fast">{isZh ? '小于 60 天' : 'Under 60 days'}</option>
            <option value="standard">60–120 {isZh ? '天' : 'days'}</option>
            <option value="extended">120–200 {isZh ? '天' : 'days'}</option>
            <option value="longer">{isZh ? '超过 200 天' : 'Over 200 days'}</option>
          </select>

          <select
            value={disciplineFilter}
            onChange={e => setDisciplineFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold shadow-sm outline-none transition focus:border-orange-500"
          >
            <option value="all">{isZh ? '全部学科门类' : 'All Disciplines'}</option>
            <option value="Medicine & Health">{isZh ? '医学与临床' : 'Medicine & Health'}</option>
            <option value="Biology & Life Sciences">{isZh ? '生物与生命' : 'Biology & Life'}</option>
            <option value="Computer Science & AI">{isZh ? '计算机与AI' : 'Computer Science'}</option>
            <option value="Chemistry & Molecular">{isZh ? '化学与材料' : 'Chemistry'}</option>
            <option value="Engineering & Materials">{isZh ? '工程与技术' : 'Engineering'}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="sci-table min-w-full text-xs">
            <thead>
              <tr>
                <th>{isZh ? '期刊名称 / 出版社' : 'Journal / Publisher'}</th>
                <th>{isZh ? '收稿至接收中位数' : 'Received-to-accepted median'}</th>
                <th>{isZh ? '典型区间 (P25–P75)' : 'Range (P25–P75)'}</th>
                <th>{isZh ? '第 90 百分位耗时 (P90)' : '90th percentile duration (P90)'}</th>
                <th>{isZh ? '发表样本' : 'Timelines'}</th>
                <th className="text-right">{isZh ? '操作' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(journal => (
                <tr key={getJournalSlug(journal.label, journal.journal_key)}>
                  <td>
                    <Link
                      href={`/journals/${getJournalSlug(journal.label, journal.journal_key)}`}
                      prefetch={false}
                      className="font-bold text-slate-950 transition hover:text-orange-600 text-sm line-clamp-1"
                    >
                      {journal.label}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {journal.source_display ?? journal.publisher}
                      {journal.issn ? ` · ISSN: ${journal.issn}` : ''}
                    </p>
                  </td>
                  <td className="font-black text-slate-950 text-base">
                    {formatNumber(journal.median)} <span className="text-xs font-normal text-slate-500">{isZh ? '天' : 'days'}</span>
                  </td>
                  <td className="min-w-[190px]">
                    <PercentileBand p25={journal.p25} median={journal.median} p75={journal.p75} compact />
                  </td>
                  <td className="font-semibold text-rose-700">
                    {journal.p90 ? `${formatNumber(journal.p90)} ${isZh ? '天' : 'days'}` : '—'}
                  </td>
                  <td>
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                      {formatNumber(journal.count)} {isZh ? '篇' : 'records'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/journals/${getJournalSlug(journal.label, journal.journal_key)}`}
                        prefetch={false}
                        className="inline-flex rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        {isZh ? '详情' : 'Details'}
                      </Link>
                      <Link
                        href={`/compare?journals=${encodeURIComponent(getJournalSlug(journal.label, journal.journal_key))}`}
                        className="inline-flex rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 shadow-sm transition hover:bg-orange-100"
                      >
                        {isZh ? '对比' : 'Compare'}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {!rows.length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-slate-500">
                    {isZh ? '未找到符合条件的期刊。' : 'No matching journals found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="border-t border-slate-200/80 p-4 text-xs font-semibold text-slate-500">
          {isZh
            ? `当前显示 ${formatNumber(rows.length)} 本期刊（全库收录 ${formatNumber(journals.length)} 本公开期刊）。`
            : `Showing ${formatNumber(rows.length)} of ${formatNumber(journals.length)} journals in database.`}
        </p>
      </section>
    </div>
  )
}
