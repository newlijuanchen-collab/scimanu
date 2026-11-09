import { routing } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/routing'
import { getSiteUrl } from '@/lib/site'

function getLocalePath(locale: AppLocale, cleanPath: string): string {
  const path = cleanPath === '/' ? '' : cleanPath
  return locale === routing.defaultLocale ? path : `/${locale}${cleanPath}`
}

export function buildLocaleAlternates(pathname: string, locale?: string) {
  const site = getSiteUrl()
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  const languages = Object.fromEntries(
    routing.locales.map((loc: AppLocale) => [loc, `${site}${getLocalePath(loc, cleanPath)}`]),
  )

  const normalized = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale

  return {
    canonical: `${site}${getLocalePath(normalized, cleanPath)}`,
    languages,
  }
}

export function buildWebSiteJsonLd(locale: string) {
  const site = getSiteUrl()
  const isDefault = locale === routing.defaultLocale
  const rootUrl = isDefault ? site : `${site}/${locale}`
  const searchUrl = isDefault ? `${site}/journals` : `${site}/${locale}/journals`

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SciManu',
    url: rootUrl,
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${searchUrl}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildDatasetJsonLd({
  journalName,
  slug,
  locale,
  startDate,
  endDate,
}: {
  journalName: string
  slug: string
  locale: string
  startDate: string
  endDate: string
}) {
  const site = getSiteUrl()
  const isDefault = locale === routing.defaultLocale
  const pageUrl = isDefault ? `${site}/journals/${slug}` : `${site}/${locale}/journals/${slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${journalName} PubMed date aggregates`,
    description: `Journal-level timing summaries from PubMed EFetch dates for ${journalName}.`,
    url: pageUrl,
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: {
      '@type': 'Organization',
      name: 'SciManu',
      url: site,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SciManu',
      url: site,
    },
    variableMeasured: ['Received-to-accepted duration', 'P25', 'Median', 'P75', 'P90'],
    temporalCoverage: `${startDate}/${endDate}`,
  }
}


