'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useReviewData } from '@/hooks/use-review-data'
import { KpiCard } from '@/components/ui/kpi-card'
import { EChart } from '@/components/charts/echart'
import { buildBoxplotOption, buildHeatmapOption, buildTrendOption } from '@/lib/chart-configs'
import { formatNumber } from '@/lib/format'

export function DashboardView() {
  const t = useTranslations()
  const { journals, stats, loading, error } = useReviewData({ minCount: 3 })

  const boxplotOption = useMemo(() => buildBoxplotOption(journals, 20), [journals])
  const trendOption = useMemo(() => buildTrendOption(stats?.globalTimeSeries ?? []), [stats])
  const heatmapOption = useMemo(() => buildHeatmapOption(journals.slice(0, 20), 3), [journals])

  if (loading) return <div className="card-rt p-8 text-slate-500">{t('common.loading')}</div>
  if (error) return <div className="card-rt p-8 text-red-600">{t('common.error')}: {error} · {t('common.errorDetail')}</div>
  if (!stats) return <div className="card-rt p-8 text-slate-500">{t('common.noData')}</div>

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-white p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">{t('dashboard.title')}</p>
        <h1 className="mt-2 page-title">{t('dashboard.title')}</h1>
        <p className="page-subtitle max-w-3xl">{t('dashboard.subtitle')}</p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white px-3 py-1 text-slate-700 ring-1 ring-slate-200">
            {t('dashboard.kpi.journals')}: {formatNumber(stats.totalJournals)}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-slate-700 ring-1 ring-slate-200">
            {t('dashboard.kpi.articles')}: {formatNumber(stats.totalArticles)}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-slate-700 ring-1 ring-slate-200">
            {t('dashboard.kpi.median')}: {formatNumber(stats.globalMedian)} {t('common.days')}
          </span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('dashboard.kpi.journals')} value={formatNumber(stats.totalJournals)} />
        <KpiCard label={t('dashboard.kpi.articles')} value={formatNumber(stats.totalArticles)} />
        <KpiCard
          label={t('dashboard.kpi.median')}
          value={formatNumber(stats.globalMedian)}
          sub={`P25–P75 ${stats.globalP25}-${stats.globalP75}`}
        />
        <KpiCard
          label={t('dashboard.kpi.fastest')}
          value={stats.fastest?.label ?? '—'}
          sub={stats.fastest ? `${stats.fastest.median} ${t('common.days')}` : undefined}
        />
      </section>

      <section className="card-rt p-4">
        <h2 className="text-base font-semibold">{t('dashboard.charts.boxplot')}</h2>
        <p className="mb-3 text-sm text-slate-500">{t('dashboard.charts.boxplotSub')}</p>
        <EChart option={boxplotOption} className="h-[360px] w-full" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card-rt p-4">
          <h2 className="text-base font-semibold">{t('dashboard.charts.trend')}</h2>
          <p className="mb-3 text-sm text-slate-500">{t('dashboard.charts.trendSub')}</p>
          <EChart option={trendOption} className="h-[320px] w-full" />
        </article>
        <article className="card-rt p-4">
          <h2 className="text-base font-semibold">{t('dashboard.charts.heatmap')}</h2>
          <p className="mb-3 text-sm text-slate-500">{t('dashboard.charts.heatmapSub')}</p>
          <EChart option={heatmapOption} className="h-[320px] w-full" />
        </article>
      </section>
    </div>
  )
}
