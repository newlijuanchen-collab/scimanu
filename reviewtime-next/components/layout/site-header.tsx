'use client'

import { useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

interface NavLinkItem {
  href: string
  labelZh: string
  labelEn: string
}

const NAV_LINKS: NavLinkItem[] = [
  { href: '/', labelZh: '首页大盘', labelEn: 'Hub' },
  { href: '/fast-review-journals', labelZh: '极速期刊榜', labelEn: 'Fast Journals' },
  { href: '/journals', labelZh: '期刊库', labelEn: 'Journals' },
  { href: '/compare', labelZh: '期刊对比', labelEn: 'Compare' },
  { href: '/statistics', labelZh: '期刊分析', labelEn: 'Analytics' },
  { href: '/about', labelZh: '方法与关于', labelEn: 'About' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const locale = useLocale()
  const isZh = locale === 'zh'

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-600 font-black text-white shadow-sm shadow-orange-600/30 transition-transform group-hover:scale-105">
              S
            </span>
            <span className="text-xl font-black tracking-tight text-slate-950">
              Sci<span className="text-orange-600">Manu</span>
            </span>
            <span className="hidden rounded-full border border-orange-200/80 bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-700 sm:inline-block">
              Open Data
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm md:flex">
            {NAV_LINKS.map(item => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                    active
                      ? 'bg-orange-50 text-orange-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
                  }`}
                >
                  {isZh ? item.labelZh : item.labelEn}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/fast-review-journals"
            className="text-xs font-bold text-orange-600 md:hidden"
          >
            {isZh ? '极速榜' : 'Fast'}
          </Link>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/90 p-0.5 text-xs font-bold">
            {routing.locales.map(l => {
              const cleanPath = pathname.replace(/^\/(en|zh)/, '') || '/'
              const targetHref =
                l === routing.defaultLocale ? cleanPath : `/${l}${cleanPath === '/' ? '' : cleanPath}`
              return (
                <a
                  key={l}
                  href={targetHref}
                  hrefLang={l}
                  className={
                    l === locale
                      ? 'rounded-lg bg-white px-2.5 py-1 text-slate-950 shadow-sm'
                      : 'rounded-lg px-2.5 py-1 text-slate-500 hover:text-slate-900'
                  }
                >
                  {l.toUpperCase()}
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
