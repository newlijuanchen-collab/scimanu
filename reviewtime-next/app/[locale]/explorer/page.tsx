import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ExplorerView } from '@/components/features/explorer-view'
import { buildLocaleAlternates } from '@/lib/seo'
import { loadReviewDataFromSnapshot } from '@/lib/repositories/review-data'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.explorer' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: buildLocaleAlternates('/explorer', params.locale),
  }
}

export default async function ExplorerPage() {
  const data = await loadReviewDataFromSnapshot()

  return (
    <Suspense fallback={<div className="card-rt p-6 text-slate-500">Loading…</div>}>
      <ExplorerView initialData={data} />
    </Suspense>
  )
}
