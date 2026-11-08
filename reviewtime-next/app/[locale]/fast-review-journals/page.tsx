import { Suspense } from 'react'
import type { Metadata } from 'next'
import { FastReviewJournalsView } from '@/components/features/fast-review-journals-view'
import { buildLocaleAlternates } from '@/lib/seo'
import { loadPublicJournals, loadPublicManifest } from '@/lib/repositories/review-data'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isZh = params.locale === 'zh'
  return {
    title: isZh
      ? 'PubMed 生物医学期刊时间统计 | SciManu'
      : 'PubMed Biomedical Journal Timelines | SciManu',
    description: isZh
      ? '查看 PubMed E-utilities 生物医学试点中，按期刊和月份汇总的收稿、接收日期统计。'
      : 'Explore journal and monthly aggregates of received, accepted and publication dates from the PubMed E-utilities biomedical pilot.',
    alternates: buildLocaleAlternates('/fast-review-journals', params.locale),
  }
}

export default async function FastReviewJournalsPage() {
  const [journals, manifest] = await Promise.all([loadPublicJournals(), loadPublicManifest()])
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white p-8" />}>
      <FastReviewJournalsView journals={journals} asOf={manifest.as_of} />
    </Suspense>
  )
}
