'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useReviewData } from '@/hooks/use-review-data'
import { formatNumber, trendText } from '@/lib/format'

export function ExplorerView() {
  const t = useTranslations()
  const [keyword, setKeyword] = useState('')
  const { journals, loading, error } = useReviewData({ minCount: 1 })

  const rows = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return journals.slice(0, 100)
    return journals
      .filter(j => j.label.toLowerCase().includes(q) || j.issn.toLowerCase().includes(q))
      .slice(0, 100)
  }, [journals, keyword])

  if (loading) return <div className="card-rt p-6">{t('common.loading')}</div>
  if (error) return <div className="card-rt p-6 text-red-600">{t('common.error')}: {error}</div>

  return (
    <div className="space-y-5">
      <header>
        <h1 className="page-title">{t('explorer.title')}</h1>
        <p className="page-subtitle">{t('explorer.subtitle')}</p>
      </header>

      <div className="card-rt p-4">
        <input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder={t('explorer.searchPlaceholder')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-primary-500 focus:ring"
        />
      </div>

      <div className="card-rt overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">{t('explorer.table.journal')}</th>
              <th className="px-3 py-2">{t('explorer.table.issn')}</th>
              <th className="px-3 py-2">{t('explorer.table.publisher')}</th>
              <th className="px-3 py-2">{t('explorer.table.median')}</th>
              <th className="px-3 py-2">{t('explorer.table.count')}</th>
              <th className="px-3 py-2">{t('explorer.table.trend')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(j => (
              <tr key={j.label} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium">{j.label}</td>
                <td className="px-3 py-2 text-slate-600">{j.issn || '—'}</td>
                <td className="px-3 py-2 text-slate-600">{j.publisher}</td>
                <td className="px-3 py-2">{formatNumber(j.median)}</td>
                <td className="px-3 py-2">{formatNumber(j.count)}</td>
                <td className="px-3 py-2">{trendText(j.trend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
