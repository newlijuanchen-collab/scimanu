import { routing } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/routing'
import { loadPublicJournals, loadPublicManifest } from '@/lib/repositories/review-data'
import { getJournalSlug } from '@/lib/journal-slug'
import { getSiteUrl } from '@/lib/site'

const ROUTES = [
  '',
  '/journals',
  '/fast-review-journals',
  '/compare',
  '/statistics',
  '/statistics/biomedical',
  '/leaderboard',
  '/explorer',
  '/about',
  '/contact',
  '/privacy',
]

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function urlEntry(url: string, lastModified: Date) {
  return [
    '<url>',
    `<loc>${escapeXml(url)}</loc>`,
    `<lastmod>${lastModified.toISOString()}</lastmod>`,
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
      return urlEntry(fullUrl, fallbackDate)
    }),
  )

  const journalEntries = routing.locales.flatMap((locale: AppLocale) =>
    journals
      .filter(journal => journal.is_public !== false && journal.is_indexable === true)
      .map(journal => {
        const slug = getJournalSlug(journal.label || journal.name, journal.journal_key)
        const fullUrl =
          locale === routing.defaultLocale
            ? `${baseUrl}/journals/${slug}`
            : `${baseUrl}/${locale}/journals/${slug}`
        return urlEntry(
          fullUrl,
          journal.latest_fetched_at ? new Date(journal.latest_fetched_at) : fallbackDate,
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
