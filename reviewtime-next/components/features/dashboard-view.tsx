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
  if (error) return <div className="card-rt p-8 text-red-600">{t('common.error')}: {error}</div>
  if (!stats) return <div className="card-rt p-8 text-slate-500">{t('common.noData')}</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="page-subtitle">{t('dashboard.subtitle')}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('dashboard.kpi.journals')} value={formatNumber(stats.totalJournals)} />
        <KpiCard label={t('dashboard.kpi.articles')} value={formatNumber(stats.totalArticles)} />
        <KpiCard
          label={t('dashboard.kpi.median')}
          value={formatNumber(stats.globalMedian)}
          sub={`P25-P75 ${stats.globalP25}-${stats.globalP75}`}
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
