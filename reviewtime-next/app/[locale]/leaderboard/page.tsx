import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { LeaderboardView } from '@/components/features/leaderboard-view'
import { buildLocaleAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.leaderboard' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: buildLocaleAlternates('/leaderboard', params.locale),
  }
}

export default function LeaderboardPage() {
  return <LeaderboardView />
}
