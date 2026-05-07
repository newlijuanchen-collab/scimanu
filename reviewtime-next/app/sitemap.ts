import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/routing'
import { getSiteUrl } from '@/lib/site'

const BASE_URL = getSiteUrl()
const ROUTES = ['', '/leaderboard', '/explorer', '/compare', '/tools/citation', '/tools/impact']

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return routing.locales.flatMap((locale: AppLocale) =>
    ROUTES.map(path => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.8,
    })),
  )
}
