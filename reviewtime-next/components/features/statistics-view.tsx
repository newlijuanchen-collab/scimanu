'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import type { EChartsOption } from 'echarts'
import { EChart } from '@/components/charts/echart'
import { CHART_THEME } from '@/lib/chart-configs'
import { Link } from '@/i18n/navigation'
import { getJournalSlug } from '@/lib/journal-slug'
import type { StageKey, StageSummary, StatisticsArticleType, StatisticsData, StatisticsJournal, StatisticsWindow } from '@/lib/statistics-types'

const stages: StageKey[] = ['acceptance', 'first_revision', 'last_revision', 'publication']
const labels = {
  zh: {
    acceptance: '收稿 → 接收',
    first_revision: '收稿 → 首次修订',
    last_revision: '末次修订 → 接收',
    publication: '接收 → 在线发表',
  },
  en: {
    acceptance: 'Received → accepted',
    first_revision: 'Received → first revision',
    last_revision: 'Last revision → accepted',
    publication: 'Accepted → online',
  },
}

export function StatisticsView({ initialData }: { initialData: StatisticsData }) {
  const zh = useLocale() === 'zh'
  const copy = (cn: string, en: string) => (zh ? cn : en)
  const names = labels[zh ? 'zh' : 'en']
  const [data, setData] = useState(initialData)
  const [window, setWindow] = useState<StatisticsWindow>(initialData.scope.window)
  const [source, setSource] = useState(initialData.scope.source)
  const [articleType, setArticleType] = useState<StatisticsArticleType>(initialData.scope.article_type)
  const [stage, setStage] = useState<StageKey>('acceptance')
  const [query, setQuery] = useState('')
  const [minimum, setMinimum] = useState(20)
  const [sort, setSort] = useState('samples')
  const [page, setPage] = useState(0)
  const [tableView, setTableView] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<StatisticsJournal | null>(null)

  const { scope, manifest } = data
  const format = (value: number | null) =>
    value === null ? '—' : new Intl.NumberFormat(zh ? 'zh-CN' : 'en-US', { maximumFractionDigits: 1 }).format(value)
  const sourceLabel = (key: string) => manifest.sources.find(item => item.key === key)?.label || key
  const windowLabel = (key: string) =>
    key === 'all' ? copy('全部历史', 'All history') : copy(`近 ${key.slice(0, -1)} 个月`, `Last ${key.slice(0, -1)} months`)
  const sourceConfig = manifest.sources.find(item => item.key === source) || manifest.sources[0]
  const cohortBasisLabel =
    scope.cohort_basis === 'publication_date' ? copy('发表日期', 'publication date') : copy('接收日期', 'acceptance date')
  const monthBasisLabel =
    scope.cohort_basis === 'publication_date' ? copy('发表月份', 'publication month') : copy('接收月份', 'acceptance month')
  const isPubmedPilot = scope.source === 'pubmed_biomed'

  function changeSource(nextSource: string) {
    const next = manifest.sources.find(item => item.key === nextSource)
    if (!next) return
    setSource(nextSource)
    if (!next.windows.includes(window)) setWindow(next.default_window)
    if (!next.article_types.includes(articleType)) setArticleType(next.default_article_type)
  }

  useEffect(() => {
    if (window === data.scope.window && source === data.scope.source && articleType === data.scope.article_type) {
      setLoading(false)
      setError(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    fetch(`/api/statistics?${new URLSearchParams({ window, source, type: articleType })}`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Unavailable')
        return response.json() as Promise<StatisticsData>
      })
      .then(next => {
        setData(next)
        setPage(0)
        setSelected(null)
      })
      .catch(reason => {
        if (reason.name !== 'AbortError') setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [window, source, articleType, data.scope])

  useEffect(() => {
    if (selected) document.getElementById('statistics-journal-detail')?.focus()
  }, [selected])

  const matches = useMemo(
    () =>
      scope.journals
        .filter(
          journal =>
            journal.stages[stage].count >= minimum &&
            journal.stages[stage].median !== null &&
            `${journal.label} ${journal.issn}`.toLowerCase().includes(query.trim().toLowerCase()),
        )
        .sort((a, b) =>
          sort === 'fastest'
            ? a.stages[stage].median! - b.stages[stage].median! || b.stages[stage].count - a.stages[stage].count
            : b.stages[stage].count - a.stages[stage].count || a.label.localeCompare(b.label),
        ),
    [scope, stage, minimum, query, sort],
  )
  const maxPage = Math.max(0, Math.ceil(matches.length / 12) - 1)
  const currentPage = Math.min(page, maxPage)
  const rows = matches.slice(currentPage * 12, (currentPage + 1) * 12)
  const age = Math.max(0, Math.floor((Date.now() - Date.parse(`${scope.data_as_of}T00:00:00Z`)) / 86400000))
  const stageSummary = scope.stages[stage]

  const chartOption = useMemo<EChartsOption>(
    () => ({
      animation: false,
      color: [CHART_THEME.primary],
      textStyle: {
        color: CHART_THEME.secondaryInk,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
      },
      aria: { enabled: true, decal: { show: false } },
      grid: { left: 48, right: 24, top: 25, bottom: 35 },
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: CHART_THEME.tooltip,
        borderWidth: 0,
        padding: [8, 10],
        textStyle: { color: '#fff', fontSize: 12 },
        extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(15,61,62,.16)',
        axisPointer: { type: 'line', lineStyle: { color: CHART_THEME.axis, width: 1 } },
        formatter: (params: unknown) => {
          const point = (params as { dataIndex: number }[])[0]
          const month = scope.monthly[point?.dataIndex]
          if (!month) return ''
          const summary = month.stages[stage]
          return `${month.month}<br/>${names[stage]}: ${summary.median ?? '—'} ${zh ? '天' : 'days'}<br/>P25–P75: ${summary.p25 ?? '—'}–${summary.p75 ?? '—'}<br/>n = ${summary.count}`
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: scope.monthly.map(row => row.month),
        axisTick: { show: false },
        axisLine: { show: true, lineStyle: { color: CHART_THEME.axis } },
        axisLabel: { color: CHART_THEME.mutedInk, hideOverlap: true },
      },
      yAxis: {
        type: 'value',
        min: 0,
        name: zh ? '天' : 'days',
        nameTextStyle: { color: CHART_THEME.mutedInk },
        axisLabel: { color: CHART_THEME.mutedInk },
        axisTick: { show: false },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: CHART_THEME.grid, type: 'solid', width: 1 } },
      },
      series: [
        {
          type: 'line',
          name: names[stage],
          data: scope.monthly.map(row => row.stages[stage].median),
          connectNulls: false,
          symbol: 'circle',
          symbolSize: 8,
          showSymbol: scope.monthly.length < 40,
          lineStyle: { width: 2 },
          itemStyle: { borderColor: CHART_THEME.surface, borderWidth: 2 },
          areaStyle: { color: CHART_THEME.primaryArea },
        },
      ],
    }),
    [scope, stage, names, zh],
  )

  function download() {
    const safeCell = (value: string | number | null) => {
      let text = String(value ?? '')
      if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`
      return `"${text.replaceAll('"', '""')}"`
    }
    const csv = [
      ['journal', 'source', 'cohort_basis', 'stage', 'n', 'median_days', 'p25_days', 'p75_days', 'p90_days', 'cohort_start', 'cohort_end', 'article_type'],
      ...matches.map(journal => {
        const v = journal.stages[stage]
        return [
          journal.label,
          sourceLabel(journal.source),
          scope.cohort_basis,
          stage,
          v.count,
          v.median,
          v.p25,
          v.p75,
          v.p90,
          scope.start,
          scope.end,
          scope.article_type,
        ]
      }),
    ]
      .map(row => row.map(safeCell).join(','))
      .join('\r\n')

    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `scimanu-${scope.window}-${scope.source}-${scope.article_type}-${stage}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function Range({ value }: { value: StageSummary }) {
    return <>{value.p25 === null ? '—' : `${format(value.p25)}–${format(value.p75)}`}</>
  }

  return (
    <div className="space-y-7">
      {/* Header & Meta */}
      <header className="border-b border-slate-200/90 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-orange-600 transition">
            SciManu
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900">{copy('期刊审稿分析', 'Review Analytics')}</span>
        </div>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-eyebrow">{copy('公开书目时间线 · 周期与样本分析', 'Public Timelines & Sample Analytics')}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              {copy('学术期刊各阶段审稿周期多维分析', 'Journal Review Timeline Analytics')}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {copy(
                '基于 PubMed E-utilities 开放接口可用日期记录，深入分析各学科期刊收稿、修订、接收与在线发表各阶段耗时分布与样本可信度。',
                'Analyze turnaround distributions and sample reliability across submission, revision, acceptance, and publication stages from PubMed E-utilities open records.',
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/statistics?source=pubmed_biomed&window=6m&type=all"
              className="rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-700 shadow-sm transition hover:bg-orange-100"
            >
              {copy('PubMed 生物医学试点队列', 'PubMed Pilot')}
            </Link>
            <a
              href="#statistics-method"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {copy('数据口径与方法 ↓', 'Methodology ↓')}
            </a>
          </div>
        </div>
      </header>

      {/* Freshness & Scope Badge Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-slate-600">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{copy('当前队列来源：', 'Current source:')}</span>
          <strong className="font-bold text-slate-900">{sourceLabel(scope.source)}</strong>
          <span className="text-slate-300">·</span>
          <span>{cohortBasisLabel}</span>
          <span className="font-mono text-slate-800">{scope.start} – {scope.end}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span>{copy('数据快照截至：', 'Snapshot date: ')} <strong className="text-slate-700">{scope.data_as_of}</strong></span>
          <span className="text-slate-300">·</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {age > 35 ? copy(`距今 ${age} 天`, `${age} days ago`) : copy('最新同步数据', 'Fresh observations')}
          </span>
        </div>
      </div>

      {/* Filters Card */}
      <section className="card-rt p-4 md:p-5 shadow-sm space-y-3" aria-label={copy('全局统计筛选', 'Statistics filters')}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{copy('数据来源', 'Data source')}</span>
            <select
              value={source}
              onChange={e => changeSource(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
            >
              {manifest.sources.map(item => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {scope.cohort_basis === 'publication_date' ? copy('发表时间窗口', 'Publication period') : copy('接收时间窗口', 'Acceptance period')}
            </span>
            <select
              value={window}
              onChange={e => setWindow(e.target.value as StatisticsWindow)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
            >
              {sourceConfig.windows.map(value => (
                <option key={value} value={value}>
                  {windowLabel(value)}
                </option>
              ))}
            </select>
          </label>

          {sourceConfig.article_types.length > 1 && (
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{copy('文章类型', 'Article type')}</span>
              <select
                value={articleType}
                onChange={e => setArticleType(e.target.value as StatisticsArticleType)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
              >
                {sourceConfig.article_types.map(value => (
                  <option key={value} value={value}>
                    {value === 'research'
                      ? copy('明确标注的研究论文', 'Explicit research types')
                      : copy('所有类型（含社论、综述等）', 'All types (including editorials)')}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <p role="status">
            {loading ? copy('正在更新筛选结果… ', 'Updating… ') : copy('当前分析样本：', 'Analyzing: ')}
            <strong className="font-bold text-slate-900">{windowLabel(scope.window)}</strong> ·{' '}
            <strong className="font-bold text-slate-900">{sourceLabel(scope.source)}</strong> ·{' '}
            <span className="text-orange-700 font-bold">{format(scope.cohort_rows)} {copy('篇发表论文', 'articles')}</span> / {format(scope.journal_groups)} {copy('本期刊', 'journals')}
          </p>
          <span className="text-[11px] text-slate-400">
            {copy('各阶段依可用记录独立统计，缺失字段不计为 0 天', 'Each stage uses its own available dates; missing records are not treated as 0d')}
          </span>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
            {copy('筛选加载失败，已保留上一次结果。', 'Could not load new cohort. Displaying previous results.')}{' '}
            <button
              onClick={() => {
                setWindow(scope.window)
                setSource(scope.source)
                setArticleType(scope.article_type)
                setError(false)
              }}
              className="font-bold underline ml-1 hover:text-red-900"
            >
              {copy('重试恢复', 'Retry')}
            </button>
          </div>
        )}
      </section>

      {/* Main Content Area */}
      <div aria-busy={loading} className={loading ? 'opacity-60 pointer-events-none transition-opacity' : 'space-y-7'}>
        {/* Stage Metric Cards */}
        <section aria-label={copy('各阶段耗时中位数', 'Median duration by stage')}>
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <p className="section-eyebrow">{copy('核心评审流转阶段', 'Review Stages')}</p>
              <h2 className="text-lg font-bold text-slate-950">{copy('点击切换分析阶段', 'Select Stage to Inspect')}</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {copy('不同阶段样本独立计算', 'Independent stage samples')}
            </span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((key, index) => {
              const value = scope.stages[key]
              const isSelected = stage === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setStage(key)
                    setPage(0)
                  }}
                  aria-pressed={isSelected}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${
                    isSelected
                      ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20'
                      : 'border-slate-200/90 bg-white hover:border-orange-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {String(index + 1).padStart(2, '0')} · {names[key]}
                      </span>
                      {isSelected && (
                        <span className="rounded-full bg-orange-600 px-1.5 py-0.2 text-[10px] font-black text-white">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span className="text-3xl font-black tracking-tight text-slate-950">
                        {format(value.median)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{copy('天中位', 'days med')}</span>
                    </div>
                  </div>

                  <div className="mt-3.5 border-t border-slate-100 pt-2 text-xs">
                    <p className="text-slate-500">
                      P25–P75: <strong className="font-bold text-slate-800"><Range value={value} /></strong> {copy('天', 'd')}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      n = {format(value.count)} {copy('条有效时间记录', 'records')}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            {copy(
              '注：首次修订日期包含作者修改与补实验耗时。各阶段样本量受期刊元数据完整度影响，中位数不可简单相加。',
              'Note: First revision dates include author revision experiments. Medians reflect available records per stage and cannot be summed.',
            )}
          </p>
        </section>

        {/* Time-series Chart / Table Panel */}
        <section className="card-rt p-5 md:p-6 shadow-sm space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <p className="section-eyebrow">{copy('时序波动', 'Time Series')}</p>
              <h2 className="text-lg font-bold text-slate-950">
                {names[stage]} · {copy('月度中位走势', `Monthly trend by ${monthBasisLabel}`)}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {copy(`展示各${monthBasisLabel}对应论文从该阶段起止的中位耗时走势`, `Median duration for published papers grouped by ${monthBasisLabel}`)}
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTableView(false)}
                className={`rounded-lg px-3 py-1 transition ${
                  !tableView ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {copy('折线走势图', 'Chart')}
              </button>
              <button
                type="button"
                onClick={() => setTableView(true)}
                className={`rounded-lg px-3 py-1 transition ${
                  tableView ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {copy('月度明细表', 'Table')}
              </button>
            </div>
          </div>

          {scope.monthly.some(row => row.stages[stage].median !== null) ? (
            tableView ? (
              <div className="overflow-x-auto max-h-[320px]">
                <table className="sci-table min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="py-2.5 px-3">{monthBasisLabel}</th>
                      <th className="py-2.5 px-3 text-right">n</th>
                      <th className="py-2.5 px-3 text-right">{copy('中位数 / 天', 'Median / days')}</th>
                      <th className="py-2.5 px-3 text-right">P25</th>
                      <th className="py-2.5 px-3 text-right">P75</th>
                      <th className="py-2.5 px-3 text-right">P90</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scope.monthly.map(row => (
                      <tr key={row.month} className="hover:bg-orange-50/20">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{row.month}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{format(row.stages[stage].count)}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-950">{format(row.stages[stage].median)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{format(row.stages[stage].p25)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{format(row.stages[stage].p75)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{format(row.stages[stage].p90)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EChart option={chartOption} className="h-[280px] w-full" />
            )
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              {copy('当前筛选条件下，没有月份达到 5 条有效样本。', 'No month in current selection reached 5 valid records.')}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            <span>
              {copy('月度样本 n < 5 时隐藏统计分位数；近期月份随发表陆续入库更新。', 'Monthly sample n < 5 is hidden. Recent months update as indexing completes.')}
            </span>
            <span>
              P90: <strong className="text-slate-800">{format(stageSummary.p90)}</strong> {copy('天', 'days')}
            </span>
          </div>
        </section>

        {/* Journal Breakdown Directory Table */}
        <section className="card-rt overflow-hidden shadow-sm">
          <div className="border-b border-slate-200/80 p-4 md:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-eyebrow">{copy('期刊级明细', 'Journal Granularity')}</p>
                <h2 className="text-lg font-bold text-slate-950">{copy('所选队列期刊审稿耗时分布', 'Journal Review Durations')}</h2>
              </div>
              <button
                type="button"
                onClick={download}
                disabled={!matches.length}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                {copy('导出汇总 CSV ↓', 'Export CSV ↓')}
              </button>
            </div>

            {/* Filter inputs */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input
                aria-label={copy('搜索期刊名称或 ISSN', 'Search journal or ISSN')}
                placeholder={copy('输入期刊名称或 ISSN 检索…', 'Search journal name or ISSN…')}
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
              />

              <select
                value={minimum}
                onChange={e => {
                  setMinimum(Number(e.target.value))
                  setPage(0)
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
              >
                {[5, 20, 50, 100].map(val => (
                  <option key={val} value={val}>
                    {copy(`样本量门槛 ≥ ${val} 篇`, `Sample threshold ≥ ${val}`)}
                  </option>
                ))}
              </select>

              <select
                aria-label={copy('排序', 'Sort order')}
                value={sort}
                onChange={e => {
                  setSort(e.target.value)
                  setPage(0)
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
              >
                <option value="samples">{copy('按样本量排序 (由多到少)', 'Most samples first')}</option>
                <option value="fastest">{copy('按耗时中位数排序 (由短到长)', 'Shortest median first')}</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="sci-table min-w-full text-xs">
              <thead>
                <tr>
                  <th className="py-3 px-4">{copy('期刊名称 / 来源', 'Journal / Source')}</th>
                  <th className="py-3 px-3 text-right">{copy('中位天数', 'Median')}</th>
                  <th className="py-3 px-3 text-right">P25–P75</th>
                  <th className="py-3 px-3 text-right">P90</th>
                  <th className="py-3 px-3 text-right">{copy('有效样本', 'Valid n')}</th>
                  <th className="py-3 px-3 text-right">{copy(`最新${monthBasisLabel}`, `Latest ${monthBasisLabel}`)}</th>
                  <th className="py-3 pr-4 text-center">{copy('操作', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(journal => {
                  const value = journal.stages[stage]
                  const slug = getJournalSlug(journal.label, journal.key)
                  return (
                    <tr key={journal.key} className="hover:bg-orange-50/20 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setSelected(journal)}
                          className="font-bold text-slate-900 hover:text-orange-600 transition text-left"
                        >
                          {journal.label}
                        </button>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {sourceLabel(journal.source)}
                          {journal.issn && ` · ISSN ${journal.issn}`}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-black text-slate-950 text-sm">{format(value.median)}</span>
                        <span className="text-[10px] text-slate-400 ml-0.5">{copy('天', 'd')}</span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        <Range value={value} />
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">{format(value.p90)}</td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">{format(value.count)}</td>
                      <td className="py-3 px-3 text-right text-slate-500 font-mono text-[11px]">{journal.latest_month}</td>
                      <td className="py-3 pr-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelected(journal)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {copy('速览', 'Peek')}
                          </button>
                          <Link
                            href={`/journals/${slug}`}
                            className="rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                          >
                            {copy('详情', 'Details')}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {!rows.length && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-slate-500">
                      {copy('暂无符合条件的期刊，可尝试降低样本量门槛或清除搜索关键词。', 'No matching journals. Try a lower sample threshold or clear search query.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              {copy(`共找到 ${matches.length} 本期刊`, `${matches.length} journals matched`)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                ← {copy('上一页', 'Prev')}
              </button>
              <span className="font-semibold text-slate-800">
                {currentPage + 1} / {maxPage + 1}
              </span>
              <button
                type="button"
                disabled={currentPage >= maxPage}
                onClick={() => setPage(currentPage + 1)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                {copy('下一页', 'Next')} →
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Selected Journal Modal Detail Panel */}
      {selected && (
        <section
          id="statistics-journal-detail"
          tabIndex={-1}
          className="card-rt border-orange-300 bg-orange-50/20 p-5 md:p-6 shadow-sm space-y-4"
          aria-label={selected.label}
        >
          <div className="flex items-start justify-between gap-4 border-b border-orange-100 pb-3">
            <div>
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-800">
                {sourceLabel(selected.source)}
              </span>
              <h2 className="mt-1.5 text-xl font-bold text-slate-950">{selected.label}</h2>
              <p className="text-xs text-slate-500">
                {windowLabel(scope.window)} · {cohortBasisLabel} {scope.start} – {scope.end}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/journals/${getJournalSlug(selected.label, selected.key)}`}
                className="rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-50 shadow-sm"
              >
                {copy('进入完整单刊页面 →', 'Open Full Page →')}
              </Link>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-slate-200 bg-white p-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map(key => (
              <div key={key} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{names[key]}</p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {format(selected.stages[key].median)}{' '}
                  <span className="text-xs font-normal text-slate-500">{copy('天', 'days')}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  P25–P75: <Range value={selected.stages[key]} /> {copy('天', 'd')} · n = {format(selected.stages[key].count)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Methodology Section */}
      <section id="statistics-method" className="card-rt p-6 md:p-8 space-y-5 bg-white">
        <div className="border-b border-slate-100 pb-4">
          <p className="section-eyebrow">{copy('方法与统计口径', 'Methodology & Data Integrity')}</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            {copy('可核验的时间戳，透明的统计边界', 'Verifiable Timelines with Transparent Boundaries')}
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-3xl">
            {copy(
              '所有统计数据严格基于已接收并见刊论文的公开历史日期生成，用于评估同行评审实际周期，不用于估算拒稿率或推测在审稿件的剩余等待天数。',
              'All statistics are calculated from observable dates of published papers to provide realistic turnaround benchmarks. They do not estimate manuscript rejection rates or pending durations.',
            )}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 text-xs text-slate-600 leading-relaxed">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">
              {copy('1. 阶段耗时如何计算？', '1. How Are Durations Calculated?')}
            </h3>
            <p>
              {copy(
                `PubMed 生物医学试点队列按精确发表日期归组（${scope.start} 至 ${scope.end}）。收稿到接收（Received-to-Accepted）仅使用 PubMed History 中明确记录的日期，过滤掉相同日期或异常值；样本量少于 5 篇时不显示分位数，防止误导。`,
                `The PubMed pilot is partitioned by publication dates (${scope.start} to ${scope.end}). Received-to-accepted uses explicit PubMed History timestamps, filtering invalid or zero-day anomalies. Quantiles are hidden when n < 5.`,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">
              {copy('2. 修订日期与在修时长说明', '2. Revision Timelines & Author Edits')}
            </h3>
            <p>
              {copy(
                'PubMed 记录中的 Revised 日期仅代表收到修回稿件的时间戳，其中包含了作者准备返修实验的时间，不代表编辑部一审决定的下达时间。不同期刊的历史修回字段记录完备度不同。',
                'Revised dates in PubMed represent when authors submitted revisions, naturally including author turnaround time. Different journals report revision records with varying completeness.',
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
