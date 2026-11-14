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
  languages['x-default'] = `${site}${getLocalePath(routing.defaultLocale, cleanPath)}`

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

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SciManu',
    alternateName: 'SciManu Journal Review Time',
    url: rootUrl,
    inLanguage: locale,
  }
}

export function buildJournalBreadcrumbJsonLd({
  journalName,
  slug,
  locale,
}: {
  journalName: string
  slug: string
  locale: string
}) {
  const site = getSiteUrl()
  const isDefault = locale === routing.defaultLocale
  const localeRoot = isDefault ? site : `${site}/${locale}`
  const directoryUrl = `${localeRoot}/journals`
  const pageUrl = `${directoryUrl}/${slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isDefault ? 'Home' : '首页',
        item: localeRoot,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isDefault ? 'Journal directory' : '期刊目录',
        item: directoryUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: journalName,
        item: pageUrl,
      },
    ],
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
