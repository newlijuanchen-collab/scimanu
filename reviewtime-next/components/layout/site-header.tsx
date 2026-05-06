'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

const navItems = [
  { key: 'dashboard', href: '/' },
  { key: 'leaderboard', href: '/leaderboard' },
  { key: 'explorer', href: '/explorer' },
  { key: 'compare', href: '/compare' },
  { key: 'citation', href: '/tools/citation' },
  { key: 'impact', href: '/tools/impact' },
]

export function SiteHeader() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const locale = useLocale()

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-primary-600">
            {t('brand')}
          </Link>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            {navItems.map(item => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={active ? 'font-medium text-primary-600' : 'text-slate-600 hover:text-slate-900'}
                >
                  {t(item.key)}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-1 text-sm">
          {routing.locales.map(l => (
            <Link
              key={l}
              href={pathname}
              locale={l}
              className={
                l === locale
                  ? 'rounded-md bg-primary-50 px-2 py-1 font-medium text-primary-700'
                  : 'rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100'
              }
            >
              {l.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
