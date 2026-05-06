import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { ExplorerView } from '@/components/features/explorer-view'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.explorer' })
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default function ExplorerPage() {
  return <ExplorerView />
}
