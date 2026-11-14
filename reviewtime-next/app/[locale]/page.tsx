import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { DashboardView } from '@/components/features/dashboard-view'
import { buildLocaleAlternates, buildWebSiteJsonLd } from '@/lib/seo'
import { loadReviewDataFromSnapshot } from '@/lib/repositories/review-data'
import { routing } from '@/i18n/routing'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.home' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: buildLocaleAlternates('', params.locale),
  }
}

export default async function LocaleHomePage({ params }: { params: { locale: string } }) {
  const data = await loadReviewDataFromSnapshot()
  const jsonLd = params.locale === routing.defaultLocale ? buildWebSiteJsonLd(params.locale) : null

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <DashboardView initialData={data} />
    </>
  )
}
