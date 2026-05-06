import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { DashboardView } from '@/components/features/dashboard-view'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.home' })
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default function LocaleHomePage() {
  return <DashboardView />
}
