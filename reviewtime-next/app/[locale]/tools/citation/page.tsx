import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { ToolsView } from '@/components/features/tools-view'
import { buildLocaleAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.toolsCitation' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: buildLocaleAlternates('/tools/citation', params.locale),
  }
}

export default function CitationToolPage() {
  return <ToolsView kind="citation" />
}
