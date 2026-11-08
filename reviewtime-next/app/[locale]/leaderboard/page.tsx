import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { LeaderboardView } from '@/components/features/leaderboard-view'
import { buildLocaleAlternates } from '@/lib/seo'
import { loadReviewDataFromSnapshot } from '@/lib/repositories/review-data'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.leaderboard' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: buildLocaleAlternates('/leaderboard', params.locale),
  }
}

export default async function LeaderboardPage() {
  const data = await loadReviewDataFromSnapshot()
  return <LeaderboardView initialData={data} />
}
