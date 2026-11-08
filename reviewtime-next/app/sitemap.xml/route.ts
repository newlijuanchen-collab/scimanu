import { routing } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/routing'
import { loadPublicJournals, loadPublicManifest } from '@/lib/repositories/review-data'
import { getSiteUrl } from '@/lib/site'

const ROUTES = ['', '/journals', '/fast-review-journals', '/compare', '/statistics', '/about', '/contact', '/privacy']

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function urlEntry(url: string, lastModified: Date, changeFrequency: string, priority: number) {
  return [
    '<url>',
    `<loc>${escapeXml(url)}</loc>`,
    `<lastmod>${lastModified.toISOString()}</lastmod>`,
    `<changefreq>${changeFrequency}</changefreq>`,
    `<priority>${priority}</priority>`,
    '</url>',
  ].join('')
}

export async function GET() {
  const baseUrl = getSiteUrl()
  const [journals, manifest] = await Promise.all([loadPublicJournals(), loadPublicManifest()])
  const fallbackDate = new Date(manifest.as_of)

  const staticEntries = routing.locales.flatMap((locale: AppLocale) =>
    ROUTES.map(path => {
      const fullUrl = locale === routing.defaultLocale ? `${baseUrl}${path || '/'}` : `${baseUrl}/${locale}${path}`
      return urlEntry(fullUrl, fallbackDate, 'weekly', path === '' ? 1 : 0.8)
    }),
  )

  const journalEntries = routing.locales.flatMap((locale: AppLocale) =>
    journals
      .filter(journal => journal.is_indexable && journal.url_slug)
      .map(journal => {
        const fullUrl =
          locale === routing.defaultLocale
            ? `${baseUrl}/journals/${journal.url_slug}`
            : `${baseUrl}/${locale}/journals/${journal.url_slug}`
        return urlEntry(
          fullUrl,
          journal.latest_fetched_at ? new Date(journal.latest_fetched_at) : fallbackDate,
          'monthly',
          journal.count >= 20 ? 0.7 : 0.55,
        )
      }),
  )

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticEntries,
    ...journalEntries,
    '</urlset>',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
