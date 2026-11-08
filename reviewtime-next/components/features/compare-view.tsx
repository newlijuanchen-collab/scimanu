'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useReviewData } from '@/hooks/use-review-data'
import { EChart } from '@/components/charts/echart'
import { PercentileBand } from '@/components/ui/percentile-band'
import { TrendChip } from '@/components/ui/trend-chip'
import { buildBoxplotOption, buildCompareTrendOption } from '@/lib/chart-configs'
import { formatNumber } from '@/lib/format'
import { getTrendTone, hasMonthlyCoverage } from '@/lib/review-ui'
import { Link } from '@/i18n/navigation'
import type { JournalStats, LoadedData } from '@/lib/types'
import { isValidPeerReviewedJournal } from '@/lib/stats-aggregator'
import { resolveJournalBenchmark } from '@/lib/journal-benchmark'
import { getJournalSlug } from '@/lib/journal-slug'

const COMPARISON_FILTER = { minCount: 3 }

export function CompareView({ initialData }: { initialData?: LoadedData | null } = {}) {
  const locale = useLocale()
  const isZh = locale === 'zh'
  const searchParams = useSearchParams()
  const { journals, loading, error } = useReviewData(COMPARISON_FILTER, initialData)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [overrideKeys, setOverrideKeys] = useState<string[] | null>(null)

  // The URL is the source of truth, including on back/forward navigation.
  const initialKeys = useMemo(() => {
    if (!journals.length) return []
    const urlJournals = searchParams.get('journals') ?? searchParams.get('j')
    if (urlJournals !== null) {
      const keys = urlJournals.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      const matched = journals.filter(j => {
        const slug = getJournalSlug(j.label, j.journal_key).toLowerCase()
        const label = j.label.toLowerCase()
        return keys.includes(slug) || keys.includes(label)
      })
      return matched.slice(0, 4).map(j => getJournalSlug(j.label, j.journal_key))
    }

    // Default to Nature Medicine vs Nature Communications (or top meaningful journals)
    if (journals.length >= 2) {
      const targetLabels = ['Nature Medicine', 'Nature Communications']
      const matchedDefaults = journals.filter(j => targetLabels.includes(j.label))
      if (matchedDefaults.length >= 2) {
        return matchedDefaults.map(j => getJournalSlug(j.label, j.journal_key))
      } else {
        const fallback = journals
          .filter(j => j.count >= 20 && isValidPeerReviewedJournal(j))
          .slice(0, 2)
          .map(j => getJournalSlug(j.label, j.journal_key))
        if (fallback.length >= 2) {
          return fallback
        }
      }
    }
    return []
  }, [journals, searchParams])

  const selectedKeys = overrideKeys !== null ? overrideKeys : initialKeys

  // User actions update local state immediately and keep URL in sync.
  const updateSelection = (keys: string[]) => {
    setOverrideKeys(keys)
    const url = new URL(window.location.href)
    url.searchParams.set('journals', keys.join(','))
    url.searchParams.delete('j')
    if (url.href !== window.location.href) {
      window.history.replaceState(null, '', url.toString())
    }
  }

  const selectedJournals = useMemo(() => {
    return journals.filter(j => selectedKeys.includes(getJournalSlug(j.label, j.journal_key))).slice(0, 4)
  }, [journals, selectedKeys])

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return journals
      .filter(j => !selectedKeys.includes(getJournalSlug(j.label, j.journal_key)))
      .filter(j => {
        return (
          j.label.toLowerCase().includes(q) ||
          (j.issn && j.issn.toLowerCase().includes(q)) ||
          (j.source_display && j.source_display.toLowerCase().includes(q)) ||
          (j.publisher && j.publisher.toLowerCase().includes(q))
        )
      })
      .slice(0, 6)
  }, [journals, searchQuery, selectedKeys])

  const popularSuggestions = useMemo(() => {
    const prominentJournalNames = [
      'Nature Communications',
      'Journal of Advanced Research',
      'Redox Biology',
    ]
    return journals
      .filter(j => !selectedKeys.includes(getJournalSlug(j.label, j.journal_key)))
      .filter(j => prominentJournalNames.includes(j.label) || (j.count >= 50 && isValidPeerReviewedJournal(j)))
      .slice(0, 8)
  }, [journals, selectedKeys])

  const addJournal = (journal: JournalStats) => {
    const key = getJournalSlug(journal.label, journal.journal_key)
    if (selectedKeys.includes(key)) return
    if (selectedKeys.length >= 4) return
    updateSelection([...selectedKeys, key])
    setSearchQuery('')
    setIsSearchOpen(false)
  }

  const removeJournal = (key: string) => {
    updateSelection(selectedKeys.filter(k => k !== key))
  }

  const boxplot = useMemo(() => buildBoxplotOption(selectedJournals, 4), [selectedJournals])
  const has24MonthTrend = useMemo(
    () => selectedJournals.length >= 2 && selectedJournals.every(journal => hasMonthlyCoverage(journal.timeSeries, 24)),
    [selectedJournals],
  )
  const trend = useMemo(
    () => has24MonthTrend ? buildCompareTrendOption(selectedJournals, 24) : null,
    [has24MonthTrend, selectedJournals],
  )

  // Comparative verdict between selected journals
  const verdict = useMemo(() => {
    if (selectedJournals.length < 2) return null
    const sortedBySpeed = [...selectedJournals].sort((a, b) => a.median - b.median)
    const fastest = sortedBySpeed[0]
    const slowest = sortedBySpeed[sortedBySpeed.length - 1]
    const deltaDays = slowest.median - fastest.median
    const percentFaster = Math.round((deltaDays / slowest.median) * 100)

    return {
      fastest,
      slowest,
      deltaDays,
      percentFaster,
    }
  }, [selectedJournals])

  if (loading) {
    return <div className="card-rt p-8 text-slate-500">{isZh ? '正在加载期刊数据…' : 'Loading comparison data…'}</div>
  }
  if (error) {
    return <div className="card-rt p-8 text-red-600">{isZh ? '加载失败' : 'Error'}: {error}</div>
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <header className="border-b border-slate-200/90 pb-6">
        <p className="section-eyebrow">{isZh ? '选刊横向决策对比' : 'Decision Comparison'}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          {isZh ? '期刊审稿时效横向对比' : 'Journal Review Time Comparison'}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          {isZh
            ? '支持同时选择 2 至 4 本期刊，对比收稿至接收中位数、P25–P75 区间和 P90 耗时。'
            : 'Compare 2 to 4 journals by received-to-accepted median, P25–P75 range, and P90 duration.'}
        </p>
      </header>

      {/* Selected Badges & Search Box */}
      <section className="card-rt p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-950">
              {isZh ? `已选对比期刊 (${selectedJournals.length}/4)` : `Selected Journals (${selectedJournals.length}/4)`}
            </h2>
            <p className="text-xs text-slate-500">
              {isZh ? '最多可同时选择 4 本期刊进行多维度比对' : 'Pick up to 4 journals to compare side-by-side'}
            </p>
          </div>
          {selectedJournals.length > 0 && (
            <button
              onClick={() => updateSelection([])}
              className="text-xs font-semibold text-slate-500 hover:text-orange-600 underline"
            >
              {isZh ? '清空对比' : 'Clear all'}
            </button>
          )}
        </div>

        {/* Selected Badges */}
        <div className="flex flex-wrap gap-2">
          {selectedJournals.map(j => {
            const key = getJournalSlug(j.label, j.journal_key)
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/80 bg-orange-50 px-3.5 py-1 text-xs font-bold text-orange-950 shadow-sm"
              >
                <span>{j.label}</span>
                <span aria-hidden="true" className="text-orange-300">·</span>
                <span className="font-semibold text-orange-700">
                  {isZh ? `中位数 ${formatNumber(j.median)} 天` : `Median ${formatNumber(j.median)} days`}
                </span>
                <button
                  onClick={() => removeJournal(key)}
                  className="ml-1 rounded-full p-0.5 text-orange-500 hover:bg-orange-200 hover:text-orange-950 transition"
                  aria-label={`Remove ${j.label}`}
                >
                  ✕
                </button>
              </span>
            )
          })}
        </div>
        {selectedJournals.length > 0 && (
          <p className="text-xs leading-5 text-slate-500">
            {isZh
              ? '“中位数”是当前收录论文从收稿到录用的典型天数，仅作为对比提示，不会按该天数筛选数据。'
              : 'Median is the typical received-to-accepted duration in the current evidence set. It is shown for context and is not used as a data filter.'}
          </p>
        )}

        {/* Search Input for adding journals */}
        {selectedKeys.length < 4 && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setSearchQuery(e.target.value)
                setIsSearchOpen(true)
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder={isZh ? '输入期刊名或 ISSN 添加至对比…' : 'Type journal name or ISSN to add to comparison…'}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
            />
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-slate-200 bg-white py-1 shadow-md">
                {searchResults.map(result => (
                  <button
                    key={getJournalSlug(result.label, result.journal_key)}
                    onClick={() => addJournal(result)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-orange-50/50 transition"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{result.label}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {result.source_display ?? result.publisher}
                      </span>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-extrabold text-orange-600">
                        {isZh ? `中位数 ${formatNumber(result.median)} 天` : `Median ${formatNumber(result.median)} days`}
                      </span>
                      <span className="ml-2 text-slate-400">({result.count} records)</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick suggestions */}
        {selectedKeys.length < 4 && popularSuggestions.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isZh ? '热门对比推荐：' : 'Quick add popular journals:'}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {popularSuggestions.map(j => (
                <button
                  key={getJournalSlug(j.label, j.journal_key)}
                  onClick={() => addJournal(j)}
                  className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-700 transition"
                >
                  + {j.label} · {isZh ? `中位数 ${formatNumber(j.median)} 天` : `Median ${formatNumber(j.median)} days`}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Comparative Decision Verdict Box */}
      {verdict && (
        <section className="card-rt border-orange-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold">
              ⚖️
            </span>
            <h2 className="text-lg font-bold text-slate-950">
              {isZh ? '周期差异与数据对比' : 'Comparative Duration Breakdown'}
            </h2>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
              <p className="font-bold text-emerald-900">
                📊 {isZh ? '周期对比差值' : 'Turnaround Difference'}: {verdict.fastest.label}
              </p>
              <p className="mt-1 text-emerald-800 leading-relaxed">
                {isZh ? (
                  <>
                    <strong>{verdict.fastest.label}</strong> 与 <strong>{verdict.slowest.label}</strong> 的中位耗时相差{' '}
                    <strong className="text-emerald-950 font-black">{verdict.deltaDays} 天</strong>（相对缩短约{' '}
                    {verdict.percentFaster}%）。
                  </>
                ) : (
                  <>
                    <strong>{verdict.fastest.label}</strong> records <strong>{verdict.deltaDays} fewer median days</strong> than {verdict.slowest.label} (a ~{verdict.percentFaster}% relative turnaround delta).
                  </>
                )}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="font-bold text-slate-900">
                📈 {isZh ? '离散程度与波动区间 (IQR)' : 'Dispersion & Spread (IQR)'}
              </p>
              <p className="mt-1 text-slate-700 leading-relaxed">
                {isZh
                  ? '各刊的 P25–P75 跨度反映已发表论文的集中区间。四分位距越宽，代表稿件耗时离散度越大，需结合 P90 关注长尾分布。'
                  : 'The P25–P75 range represents the interquartile range (IQR) for published papers. A wider span reflects higher variance across revision rounds.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Side-by-side Decision Comparison Table */}
      {selectedJournals.length >= 2 ? (
        <>
          <section className="card-rt overflow-hidden shadow-sm">
            <div className="border-b border-slate-200/80 px-5 py-4">
              <h2 className="text-lg font-extrabold text-slate-950">
                {isZh ? '多维核心指标横向对比表' : 'Decision Metrics Comparison Table'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {isZh
                  ? '严格基于发表论文时间戳与官方/SciRev 公开信号对比'
                  : 'Synthesized from verifiable published article timelines and community signals.'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="sci-table min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="w-52">{isZh ? '对比维度' : 'Metric'}</th>
                    {selectedJournals.map(j => (
                      <th key={getJournalSlug(j.label, j.journal_key)} className="min-w-[220px]">
                        <Link
                          href={`/journals/${getJournalSlug(j.label, j.journal_key)}`}
                          className="font-bold text-slate-950 transition hover:text-orange-600 text-sm"
                        >
                          {j.label}
                        </Link>
                        <p className="mt-0.5 text-[11px] font-normal text-slate-500">
                          {j.source_display ?? j.publisher}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Median Wait */}
                  <tr>
                    <td className="font-bold text-slate-900">{isZh ? '中位审稿总耗时' : 'Median Turnaround'}</td>
                    {selectedJournals.map(j => (
                      <td key={getJournalSlug(j.label, j.journal_key)}>
                        <span className="text-2xl font-black text-slate-950">{formatNumber(j.median)}</span>
                        <span className="ml-1 text-xs text-slate-500">{isZh ? '天' : 'days'}</span>
                      </td>
                    ))}
                  </tr>

                  {/* Typical Range P25-P75 */}
                  <tr>
                    <td className="font-bold text-slate-900">{isZh ? '典型区间 (P25–P75)' : 'Middle 50% (P25–P75)'}</td>
                    {selectedJournals.map(j => (
                      <td key={getJournalSlug(j.label, j.journal_key)}>
                        <p className="font-bold text-slate-800">{formatNumber(j.p25)} – {formatNumber(j.p75)} {isZh ? '天' : 'days'}</p>
                        <div className="mt-2 w-44">
                          <PercentileBand p25={j.p25} median={j.median} p75={j.p75} compact />
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Desk Triage Speed */}
                  <tr>
                    <td className="font-bold text-slate-900">{isZh ? '初审秒拒线 (Desk Triage)' : 'Desk Triage Speed'}</td>
                    {selectedJournals.map(j => {
                      const bm = resolveJournalBenchmark(j)
                      return (
                        <td key={getJournalSlug(j.label, j.journal_key)}>
                          <span className="font-bold text-orange-600">~{bm.triageDays} {isZh ? '天' : 'days'}</span>
                          <span className="ml-1 text-slate-400">({bm.deskRejectRate} {isZh ? '初筛拒稿' : 'reject'})</span>
                        </td>
                      )
                    })}
                  </tr>

                  {/* Est Acceptance Rate */}
                  <tr>
                    <td className="font-bold text-slate-900">{isZh ? '预估综合录用率' : 'Est. Acceptance Rate'}</td>
                    {selectedJournals.map(j => {
                      const bm = resolveJournalBenchmark(j)
                      return (
                        <td key={getJournalSlug(j.label, j.journal_key)}>
                          <span className="font-bold text-emerald-700">{bm.acceptanceRate}</span>
                          <span className="ml-1 text-slate-400">({bm.avgRounds} {isZh ? '轮返修' : 'rounds'})</span>
                        </td>
                      )
                    })}
                  </tr>

                  {/* 90th percentile duration */}
                  <tr>
                    <td className="font-bold text-slate-900">{isZh ? '第 90 百分位耗时 (P90)' : '90th percentile duration (P90)'}</td>
                    {selectedJournals.map(j => (
                      <td key={getJournalSlug(j.label, j.journal_key)} className="font-semibold text-rose-700">
                        {j.p90 ? `${formatNumber(j.p90)} ${isZh ? '天' : 'days'}` : '—'}
                      </td>
                    ))}
                  </tr>

                  {/* Sample Count */}
                  <tr>
                    <td className="font-bold text-slate-900">{isZh ? '公开发表样本数' : 'Evidence Base'}</td>
                    {selectedJournals.map(j => (
                      <td key={getJournalSlug(j.label, j.journal_key)}>
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                          {formatNumber(j.count)} {isZh ? '篇记录' : 'timelines'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Recent Trend */}
                  <tr>
                    <td className="font-bold text-slate-900">{isZh ? '近期审稿走势' : 'Recent Trend'}</td>
                    {selectedJournals.map(j => (
                      <td key={getJournalSlug(j.label, j.journal_key)}>
                        <TrendChip tone={getTrendTone(j.trend)} />
                      </td>
                    ))}
                  </tr>

                  {/* Objective Speed Tier & Spread */}
                  <tr>
                    <td className="font-bold text-slate-900">{isZh ? '耗时梯队与波动跨度' : 'Speed Tier & Spread'}</td>
                    {selectedJournals.map(j => {
                      const bm = resolveJournalBenchmark(j)
                      return (
                        <td key={getJournalSlug(j.label, j.journal_key)} className="text-[11px] leading-relaxed text-slate-600">
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                            {isZh ? bm.speedTierZh : bm.speedTierEn}
                          </span>
                          <p className="mt-1.5 text-slate-600">
                            {isZh ? `IQR 跨度: ${bm.iqrDays} 天` : `IQR Spread: ${bm.iqrDays} days`} · {isZh ? `P90 耗时: ${bm.p90Days} 天` : `P90 duration: ${bm.p90Days}d`}
                          </p>
                        </td>
                      )
                    })}
                  </tr>

                  {/* Actions */}
                  <tr>
                    <td className="font-bold text-slate-900">{isZh ? '单刊深度详情' : 'Detailed Analysis'}</td>
                    {selectedJournals.map(j => (
                      <td key={getJournalSlug(j.label, j.journal_key)}>
                        <Link
                          href={`/journals/${getJournalSlug(j.label, j.journal_key)}`}
                          className="inline-flex items-center rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-bold text-orange-700 shadow-sm hover:bg-orange-100 transition"
                        >
                          {isZh ? '查看完整时间线 →' : 'Deep Dive →'}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Visual Charts: Boxplot & Historical Trend */}
          <div className={`grid gap-6 ${has24MonthTrend ? 'lg:grid-cols-2' : ''}`}>
            <section className="card-rt min-w-0 p-5">
              <p className="section-eyebrow">{isZh ? '分布箱线图' : 'Distribution Visual'}</p>
              <h3 className="mt-1 text-base font-bold text-slate-950">
                {isZh ? '典型区间与波动跨度对比' : 'IQR Uncertainty Boxplot'}
              </h3>
              <div className="mt-4 overflow-x-auto">
                <div style={{ minWidth: selectedJournals.length * 150 + 60 }}>
                  <EChart option={boxplot} className="h-[360px] w-full" />
                </div>
              </div>
            </section>

            {has24MonthTrend && trend && (
              <section className="card-rt p-5">
                <p className="section-eyebrow">{isZh ? '历史趋势折线' : 'Historical Trajectory'}</p>
                <h3 className="mt-1 text-base font-bold text-slate-950">
                  {isZh ? '近 24 个月月度中位走势' : '24-Month Monthly Median Comparison'}
                </h3>
                <EChart option={trend} className="mt-4 h-[320px] w-full" />
              </section>
            )}
          </div>
        </>
      ) : (
        <div className="card-rt p-12 text-center space-y-3">
          <p className="text-3xl">⚖️</p>
          <h3 className="text-lg font-bold text-slate-950">
            {selectedJournals.length === 1
              ? (isZh
                ? `已选定 1 本期刊（${selectedJournals[0].label}），请再添加 1 本开始对比`
                : `1 journal selected (${selectedJournals[0].label}). Add at least 1 more to compare.`)
              : (isZh ? '请至少选择 2 本期刊进行对比' : 'Select at least 2 journals to begin comparison')}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {isZh
              ? '您可以在上方搜索框中键入期刊名添加，或直接点击上方的“热门对比推荐”标签一键加入。'
              : 'Search journal name in the input above or click popular suggestion tags to quickly compare.'}
          </p>
        </div>
      )}
    </div>
  )
}
