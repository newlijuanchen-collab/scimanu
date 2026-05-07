import { routing } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/routing'
import { getSiteUrl } from '@/lib/site'

export function buildLocaleAlternates(pathname: string, locale?: string) {
  const site = getSiteUrl()
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  const languages = Object.fromEntries(
    routing.locales.map((locale: AppLocale) => [locale, `${site}/${locale}${cleanPath}`]),
  )

  const normalized = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale

  return {
    canonical: `${site}/${normalized}${cleanPath}`,
    languages,
  }
}

export function buildWebSiteJsonLd(locale: string) {
  const site = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ReviewTime',
    url: `${site}/${locale}`,
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${site}/${locale}/explorer?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}
