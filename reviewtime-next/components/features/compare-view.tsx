'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useReviewData } from '@/hooks/use-review-data'
import { EChart } from '@/components/charts/echart'
import { buildBoxplotOption, buildCompareTrendOption } from '@/lib/chart-configs'
import { formatNumber } from '@/lib/format'

export function CompareView() {
  const t = useTranslations()
  const { journals, loading, error } = useReviewData({ minCount: 3 })
  const [selected, setSelected] = useState<string[]>([])

  const selectedJournals = useMemo(
    () => journals.filter(j => selected.includes(j.label)).slice(0, 8),
    [journals, selected],
  )

  const boxplot = useMemo(() => buildBoxplotOption(selectedJournals, 8), [selectedJournals])
  const trend = useMemo(() => buildCompareTrendOption(selectedJournals, 24), [selectedJournals])

  const toggle = (label: string) => {
    setSelected(prev => {
      if (prev.includes(label)) return prev.filter(i => i !== label)
      if (prev.length >= 8) return prev
      return [...prev, label]
    })
  }

  if (loading) return <div className="card-rt p-6">{t('common.loading')}</div>
  if (error) return <div className="card-rt p-6 text-red-600">{t('common.error')}: {error}</div>

  return (
    <div className="space-y-5">
      <header>
        <h1 className="page-title">{t('compare.title')}</h1>
        <p className="page-subtitle">{t('compare.subtitle')}</p>
      </header>

      <div className="card-rt p-4">
        <p className="mb-2 text-sm text-slate-600">{t('compare.selectedCount', { count: selectedJournals.length })}</p>
        <div className="flex max-h-56 flex-wrap gap-2 overflow-auto">
          {journals.slice(0, 120).map(j => {
            const active = selected.includes(j.label)
            return (
              <button
                key={j.label}
                onClick={() => toggle(j.label)}
                className={active ? 'rounded-full bg-primary-600 px-3 py-1 text-xs text-white' : 'rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600'}
              >
                {j.label}
              </button>
            )
          })}
        </div>
      </div>

      {selectedJournals.length >= 2 ? (
        <>
          <section className="card-rt p-4">
            <h2 className="mb-3 text-base font-semibold">{t('compare.charts.boxplot')}</h2>
            <EChart option={boxplot} className="h-[340px] w-full" />
          </section>

          <section className="card-rt p-4">
            <h2 className="mb-3 text-base font-semibold">{t('compare.charts.trend')}</h2>
            <EChart option={trend} className="h-[340px] w-full" />
          </section>

          <section className="card-rt overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">{t('compare.summary.journal')}</th>
                  <th className="px-3 py-2">{t('compare.summary.median')}</th>
                  <th className="px-3 py-2">{t('compare.summary.p25')}</th>
                  <th className="px-3 py-2">{t('compare.summary.p75')}</th>
                  <th className="px-3 py-2">{t('compare.summary.count')}</th>
                </tr>
              </thead>
              <tbody>
                {selectedJournals.map(j => (
                  <tr key={j.label} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium">{j.label}</td>
                    <td className="px-3 py-2">{formatNumber(j.median)}</td>
                    <td className="px-3 py-2">{formatNumber(j.p25)}</td>
                    <td className="px-3 py-2">{formatNumber(j.p75)}</td>
                    <td className="px-3 py-2">{formatNumber(j.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <div className="card-rt p-6 text-sm text-slate-500">{t('compare.emptyHint')}</div>
      )}
    </div>
  )
}
