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

