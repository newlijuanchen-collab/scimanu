import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { DashboardView } from '@/components/features/dashboard-view'
import { buildLocaleAlternates, buildWebSiteJsonLd } from '@/lib/seo'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.home' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: buildLocaleAlternates('', params.locale),
  }
}

export default function LocaleHomePage({ params }: { params: { locale: string } }) {
  const jsonLd = buildWebSiteJsonLd(params.locale)
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DashboardView />
    </>
  )
}
