import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { CompareView } from '@/components/features/compare-view'
import { buildLocaleAlternates } from '@/lib/seo'
import { loadReviewDataFromSnapshot } from '@/lib/repositories/review-data'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.compare' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: buildLocaleAlternates('/compare', params.locale),
  }
}

export default async function ComparePage() {
  const data = await loadReviewDataFromSnapshot()

  return (
    <Suspense fallback={<div className="card-rt p-6 text-slate-500">Loading…</div>}>
      <CompareView initialData={data} />
    </Suspense>
  )
}
