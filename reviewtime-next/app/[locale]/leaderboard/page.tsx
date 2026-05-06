import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { LeaderboardView } from '@/components/features/leaderboard-view'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.leaderboard' })
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default function LeaderboardPage() {
  return <LeaderboardView />
}
