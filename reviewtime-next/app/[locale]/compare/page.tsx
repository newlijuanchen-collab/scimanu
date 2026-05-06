import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { CompareView } from '@/components/features/compare-view'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.compare' })
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default function ComparePage() {
  return <CompareView />
}
