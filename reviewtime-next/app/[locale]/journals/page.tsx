import { Suspense } from 'react'
import type { Metadata } from 'next'
import { JournalsView } from '@/components/features/journals-view'
import { buildLocaleAlternates } from '@/lib/seo'
import { loadPublicJournals, loadPublicManifest, loadReviewDataFromSnapshot } from '@/lib/repositories/review-data'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isZh = params.locale === 'zh'
  return {
    title: isZh ? '跨学科期刊时间线目录 | SciManu' : 'Journal Timeline Directory | SciManu',
    description: isZh
      ? 'SciManu 面向所有学科期刊；当前时间统计仅覆盖 PubMed 生物医学试点中选定的期刊。'
      : 'SciManu is intended for journals across subject areas; current timeline statistics cover only selected journals in the PubMed biomedical pilot.',
    alternates: buildLocaleAlternates('/journals', params.locale),
  }
}

export default async function JournalsPage() {
  const [data, journals, manifest] = await Promise.all([
    loadReviewDataFromSnapshot(),
    loadPublicJournals(),
    loadPublicManifest(),
  ])

  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white p-8" />}>
      <JournalsView journals={journals} stats={data.stats} asOf={manifest.as_of} />
    </Suspense>
  )
}
