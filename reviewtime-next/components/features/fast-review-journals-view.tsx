'use client'

import { useMemo, useState, useEffect, type ChangeEvent } from 'react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { formatNumber } from '@/lib/format'
import type { JournalStats } from '@/lib/types'
import { PercentileBand } from '@/components/ui/percentile-band'
import { inferDiscipline, isValidPeerReviewedJournal } from '@/lib/stats-aggregator'
import { getJournalSlug } from '@/lib/journal-slug'

interface FastReviewJournalsViewProps {
  journals: JournalStats[]
  asOf: string
}

const DISCIPLINE_OPTIONS: Array<{ key: string; labelZh: string; labelEn: string; icon: string }> = [
  { key: 'all', labelZh: '全部学科', labelEn: 'All Disciplines', icon: '🌐' },
  { key: 'Medicine & Health', labelZh: '医学与临床', labelEn: 'Medicine & Health', icon: '🩺' },
  { key: 'Biology & Life Sciences', labelZh: '生物与生命科学', labelEn: 'Biology & Life', icon: '🧬' },
  { key: 'Computer Science & AI', labelZh: '计算机与人工智能', labelEn: 'CS & AI', icon: '💻' },
  { key: 'Chemistry & Molecular', labelZh: '化学与材料分子', labelEn: 'Chemistry & Materials', icon: '🧪' },
  { key: 'Engineering & Materials', labelZh: '工程与工程技术', labelEn: 'Engineering & Tech', icon: '⚙️' },
  { key: 'Earth & Environment', labelZh: '地球与环境科学', labelEn: 'Earth & Environment', icon: '🪐' },
  { key: 'Physics & Math', labelZh: '物理与应用数学', labelEn: 'Physics & Math', icon: '📐' },
]

function matchesSpeedTier(median: number, filter: string) {
  if (!filter || filter === 'all' || filter === '999') return true
  if (filter === '30') return median <= 30
  if (filter === '45') return median <= 45
  if (filter === '60') return median < 60
  if (filter === '120') return median >= 60 && median <= 120
  if (filter === '200') return median > 120 && median <= 200
  if (filter === 'longer') return median > 200
  if (filter === '90') return median <= 90
  if (filter === '150') return median <= 150
  const num = Number(filter)
  if (!isNaN(num) && num > 0) return median <= num
  return true
}

export function FastReviewJournalsView({ journals, asOf }: FastReviewJournalsViewProps) {
  const locale = useLocale()
  const isZh = locale === 'zh'
  const searchParams = useSearchParams()

  const urlDiscipline = searchParams?.get('discipline') || 'all'
  const urlSpeed = searchParams?.get('speed') || ''

  const [selectedDiscipline, setSelectedDiscipline] = useState<string>(urlDiscipline)
  const [selectedPublisher, setSelectedPublisher] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [speedFilter, setSpeedFilter] = useState<string>(urlSpeed || 'all')

  // Sync state if URL searchParams change
  useEffect(() => {
    if (urlDiscipline) setSelectedDiscipline(urlDiscipline)
  }, [urlDiscipline])

  useEffect(() => {
    if (urlSpeed) {
      setSpeedFilter(urlSpeed)
    }
  }, [urlSpeed])

  // Filter valid peer-reviewed research journals (N >= 20 and realistic peer review timeline)
  const candidateJournals = useMemo(() => {
    return journals.filter(j => j.count >= 20 && isValidPeerReviewedJournal(j))
  }, [journals])

  // Get publisher options
  const publisherOptions = useMemo(() => {
    const map = new Map<string, number>()
    candidateJournals.forEach(j => {
      const pub = j.source_display || j.publisher || 'Other'
      map.set(pub, (map.get(pub) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .filter(([, count]) => count >= 5)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
  }, [candidateJournals])

  // Filtered and ranked
  const filteredRanked = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return candidateJournals
      .filter(j => {
        if (selectedDiscipline === 'all') return true
        const disc = inferDiscipline(j.label).en
        return disc === selectedDiscipline
      })
      .filter(j => {
        if (selectedPublisher === 'all') return true
        const pub = j.source_display || j.publisher || ''
        return pub.toLowerCase().includes(selectedPublisher.toLowerCase())
      })
      .filter(j => matchesSpeedTier(j.median, speedFilter))
      .filter(j => {
        if (!q) return true
        return (
          j.label.toLowerCase().includes(q) ||
          (j.issn && j.issn.toLowerCase().includes(q)) ||
          (j.publisher && j.publisher.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => a.median - b.median || (a.p75 - a.p25) - (b.p75 - b.p25) || b.count - a.count)
  }, [candidateJournals, selectedDiscipline, selectedPublisher, speedFilter, searchQuery])

  const topPodium = filteredRanked.slice(0, 3)
  const remainingTable = filteredRanked.slice(3, 50)

  const activeDisciplineObj = DISCIPLINE_OPTIONS.find(d => d.key === selectedDiscipline)

  const resetFilters = () => {
    setSelectedDiscipline('all')
    setSelectedPublisher('all')
    setSearchQuery('')
    setSpeedFilter('all')
  }

  const hasActiveFilters =
    selectedDiscipline !== 'all' ||
    selectedPublisher !== 'all' ||
    searchQuery.trim() !== '' ||
    (speedFilter !== 'all' && speedFilter !== '')

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <header className="border-b border-slate-200/90 pb-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800">
            {isZh ? 'PubMed 收稿至接收时间榜' : 'PubMed Received-to-Accepted Leaderboard'}
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs font-semibold text-slate-500">N ≥ 20 Reliable Baseline</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.2">
            PubMed EFetch · Biomedical Pilot
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          {isZh ? 'PubMed 期刊收稿至接收时间统计' : 'PubMed Journal Received-to-Accepted Times'}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          {isZh
            ? '按 PubMed 近六个月收稿至接收日期排序，仅包含当前 20 本生物医学试点期刊中达到样本门槛的期刊。样本数表示可用时间记录，不代表录用率或审稿质量。'
            : 'Ranked by PubMed received-to-accepted dates in the six-month cohort. Includes eligible journals from the 20-journal biomedical pilot; sample size does not measure acceptance rate or review quality.'}
        </p>
        <p className="mt-3 text-xs font-semibold text-slate-400">
          {isZh ? '数据快照截至：' : 'Data snapshot as of: '} {asOf}
        </p>
      </header>

      {/* Compact Filter Matrix */}
      <section className="card-rt p-4 md:p-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Keyword Search */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isZh ? '搜索榜内期刊' : 'Search Journal Name'}
            </label>
            <input
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder={isZh ? '输入期刊名、ISSN 或关键词…' : 'Search name or ISSN…'}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
            />
          </div>

          {/* Discipline Select */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isZh ? '学科分类' : 'Academic Discipline'}
            </label>
            <select
              value={selectedDiscipline}
              onChange={e => setSelectedDiscipline(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
            >
              {DISCIPLINE_OPTIONS.map(d => (
                <option key={d.key} value={d.key}>
                  {d.icon} {isZh ? d.labelZh : d.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Publisher Select */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isZh ? '出版机构' : 'Publisher'}
            </label>
            <select
              value={selectedPublisher}
              onChange={e => setSelectedPublisher(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
            >
              <option value="all">{isZh ? '全部出版机构' : 'All Publishers'}</option>
              {publisherOptions.map(pub => (
                <option key={pub} value={pub}>{pub}</option>
              ))}
            </select>
          </div>

          {/* Max Median Days / Speed Tiers */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isZh ? '审稿时效阈值' : 'Turnaround Speed Tier'}
            </label>
            <select
              value={speedFilter}
              onChange={e => setSpeedFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
            >
              <option value="all">{isZh ? '🌐 全部时效区间' : '🌐 All Turnaround Times'}</option>
              <option value="30">{isZh ? '⚡ 极速 1 个月内 (≤ 30 天)' : '⚡ Super Fast (≤ 30 days)'}</option>
              <option value="60">{isZh ? '⚡ 极速梯队 (< 60 天)' : '⚡ Fast Tier (< 60 days)'}</option>
              <option value="120">{isZh ? '⏱️ 标准常态 (60–120 天)' : '⏱️ Standard Range (60–120 days)'}</option>
              <option value="200">{isZh ? '📅 适中平稳 (120–200 天)' : '📅 Moderate Tier (120–200 days)'}</option>
              <option value="longer">{isZh ? '⏳ 耗时较长 (> 200 天)' : '⏳ Longer Duration (> 200 days)'}</option>
            </select>
          </div>
        </div>

        {/* Active Filter Tags Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">{isZh ? '当前筛选：' : 'Active Filters:'}</span>
            {selectedDiscipline !== 'all' && activeDisciplineObj && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-0.5 font-bold text-orange-800 border border-orange-200/80">
                <span>{activeDisciplineObj.icon}</span>
                <span>{isZh ? activeDisciplineObj.labelZh : activeDisciplineObj.labelEn}</span>
                <button
                  type="button"
                  onClick={() => setSelectedDiscipline('all')}
                  className="hover:text-red-600 ml-1"
                >
                  ×
                </button>
              </span>
            )}
            {selectedPublisher !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-0.5 font-bold text-slate-700 border border-slate-200">
                <span>{selectedPublisher}</span>
                <button
                  type="button"
                  onClick={() => setSelectedPublisher('all')}
                  className="hover:text-red-600 ml-1"
                >
                  ×
                </button>
              </span>
            )}
            {speedFilter && speedFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-200/80">
                <span>
                  {speedFilter === '30'
                    ? (isZh ? '≤ 30 天' : '≤ 30 days')
                    : speedFilter === '60'
                    ? (isZh ? '< 60 天' : '< 60 days')
                    : speedFilter === '120'
                    ? (isZh ? '60–120 天' : '60–120 days')
                    : speedFilter === '200'
                    ? (isZh ? '120–200 天' : '120–200 days')
                    : speedFilter === 'longer'
                    ? (isZh ? '> 200 天' : '> 200 days')
                    : `≤ ${speedFilter} ${isZh ? '天' : 'days'}`}
                </span>
                <button
                  type="button"
                  onClick={() => setSpeedFilter('all')}
                  className="hover:text-red-600 ml-1"
                >
                  ×
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-bold text-slate-800 border border-slate-200">
                <span>&quot;{searchQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-red-600 ml-1"
                >
                  ×
                </button>
              </span>
            )}
            {!hasActiveFilters && (
              <span className="text-slate-500 font-medium">
                {isZh ? '展示全学科期刊（按耗时中位数排序）' : 'Showing all journals sorted by median days'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900">
              {isZh ? '符合条件：' : 'Matches: '}
              <span className="text-orange-600">{filteredRanked.length}</span> {isZh ? '本期刊' : 'journals'}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-slate-500 hover:text-orange-600 font-medium underline"
              >
                {isZh ? '重置筛选' : 'Reset All'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Top 3 Podium Cards */}
      {topPodium.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-3">
          {topPodium.map((journal, index) => {
            const podiumRank = index + 1
            const badgeBg =
              podiumRank === 1
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : podiumRank === 2
                ? 'bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-orange-100 text-orange-900 border-orange-300'
            const trophy = podiumRank === 1 ? '🥇 #1' : podiumRank === 2 ? '🥈 #2' : '🥉 #3'

            return (
              <article
                key={getJournalSlug(journal.label, journal.journal_key)}
                className="card-rt relative overflow-hidden border-orange-200/90 bg-white p-5 hover:border-orange-300 transition"
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${badgeBg}`}>
                    {trophy}
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    N ≥ 20 Reliable
                  </span>
                </div>

                <h2 className="mt-3.5 text-lg font-black text-slate-950 line-clamp-2">
                  <Link href={`/journals/${getJournalSlug(journal.label, journal.journal_key)}`} prefetch={false} className="transition hover:text-orange-600">
                    {journal.label}
                  </Link>
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {journal.source_display ?? journal.publisher}
                </p>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-950">{formatNumber(journal.median)}</span>
                  <span className="text-base font-normal text-slate-500">{isZh ? '天中位数' : 'days median'}</span>
                </div>

                <div className="mt-3">
                  <PercentileBand p25={journal.p25} median={journal.median} p75={journal.p75} compact />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="font-semibold text-slate-600">
                    {formatNumber(journal.count)} {isZh ? '篇发表样本' : 'timelines'}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/journals/${getJournalSlug(journal.label, journal.journal_key)}`}
                      prefetch={false}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {isZh ? '查看详情 →' : 'Details →'}
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {/* Main Leaderboard Table */}
      <section className="card-rt overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-950">
              {isZh ? '极速期刊完整排行榜' : 'Complete Fast Review Ranking'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isZh
                ? '严格剔除极短非同行评审快报，展现正规送审期刊真实发表效率。'
                : 'PubMed EFetch dates only. Sorted by median received-to-accepted days.'}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {formatNumber(filteredRanked.length)} {isZh ? '本入选' : 'journals'}
          </span>
        </div>

        {filteredRanked.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-3xl">🔍</span>
            <p className="mt-2 text-sm font-bold text-slate-700">
              {isZh ? '未找到符合当前条件的期刊' : 'No matching journals found'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isZh ? '请尝试放宽最长天数限制或清除搜索关键词' : 'Try increasing the max turnaround days or clearing search filters'}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex items-center rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 shadow-sm"
            >
              {isZh ? '恢复默认筛选' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-3 pl-5 pr-3 text-center w-12">#</th>
                  <th className="py-3 px-3">{isZh ? '期刊名称 / 出版商' : 'Journal / Publisher'}</th>
                  <th className="py-3 px-3">{isZh ? '学科分类' : 'Discipline'}</th>
                  <th className="py-3 px-3 text-right">{isZh ? '审稿中位' : 'Median'}</th>
                  <th className="py-3 px-4 min-w-[170px]">{isZh ? 'P25–P75 典型区间' : 'P25–P75 Range'}</th>
                  <th className="py-3 px-3 text-right">{isZh ? '第 90 百分位耗时 (P90)' : '90th percentile duration (P90)'}</th>
                  <th className="py-3 px-3 text-right">{isZh ? '样本量' : 'Samples'}</th>
                  <th className="py-3 pr-5 pl-3 text-center">{isZh ? '操作' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRanked.slice(0, 50).map((journal, idx) => {
                  const rank = idx + 1
                  const isTop3 = rank <= 3
                  const disc = inferDiscipline(journal.label)

                  return (
                    <tr
                      key={getJournalSlug(journal.label, journal.journal_key)}
                      className="hover:bg-orange-50/20 transition-colors"
                    >
                      <td className="py-3.5 pl-5 pr-3 text-center">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                            rank === 1
                              ? 'bg-amber-100 text-amber-900'
                              : rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : rank === 3
                              ? 'bg-orange-100 text-orange-900'
                              : 'text-slate-400 font-medium'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 hover:text-orange-600 transition">
                          <Link href={`/journals/${getJournalSlug(journal.label, journal.journal_key)}`} prefetch={false}>
                            {journal.label}
                          </Link>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span>{journal.source_display ?? journal.publisher}</span>
                          {journal.issn && (
                            <>
                              <span>·</span>
                              <span>ISSN {journal.issn}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          <span>{disc.icon}</span>
                          <span>{isZh ? disc.zh : disc.en}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="text-sm font-black text-slate-950">
                          {formatNumber(journal.median)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">{isZh ? '天' : 'd'}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <PercentileBand p25={journal.p25} median={journal.median} p75={journal.p75} compact />
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className={`text-xs font-bold ${(journal.p90 ?? 0) > 180 ? 'text-amber-600' : 'text-slate-700'}`}>
                          {journal.p90 ? `${formatNumber(journal.p90)}d` : '—'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right text-slate-500 font-medium">
                        {formatNumber(journal.count)}
                      </td>

                      <td className="py-3.5 pr-5 pl-3 text-center">
                        <Link
                          href={`/journals/${getJournalSlug(journal.label, journal.journal_key)}`}
                          prefetch={false}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-orange-300 hover:text-orange-600 shadow-sm transition"
                        >
                          <span>{isZh ? '分析' : 'View'}</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
