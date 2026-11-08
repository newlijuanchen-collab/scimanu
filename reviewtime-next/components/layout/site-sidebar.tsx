'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'

interface NavItem {
  href: string
  labelZh: string
  labelEn: string
  icon: string
  badge?: string
}

const CORE_TOOLS: NavItem[] = [
  { href: '/', labelZh: '数据总览大盘', labelEn: 'Overview Hub', icon: '🏠' },
  { href: '/fast-review-journals', labelZh: '时长排序榜单', labelEn: 'Duration Ranking', icon: '↕️' },
  { href: '/journals', labelZh: '期刊目录', labelEn: 'Journal Directory', icon: '📚' },
  { href: '/compare', labelZh: '期刊横向对比', labelEn: 'Peer Compare', icon: '⚖️' },
  { href: '/statistics', labelZh: '期刊审稿分析', labelEn: 'Review Analytics', icon: '📊' },
  { href: '/about', labelZh: '关于与合规说明', labelEn: 'Provenance & About', icon: '🏛️' },
]

interface DisciplineItem {
  key: string
  labelZh: string
  labelEn: string
  icon: string
}

const DISCIPLINES: DisciplineItem[] = [
  { key: 'all', labelZh: '全部学术领域', labelEn: 'All Disciplines', icon: '🌐' },
  { key: 'Medicine & Health', labelZh: '医学与临床', labelEn: 'Medicine & Health', icon: '🩺' },
  { key: 'Biology & Life Sciences', labelZh: '生物与生命科学', labelEn: 'Biology & Life', icon: '🧬' },
  { key: 'Computer Science & AI', labelZh: '计算机与人工智能', labelEn: 'CS & AI', icon: '💻' },
  { key: 'Chemistry & Molecular', labelZh: '化学与分子材料', labelEn: 'Chemistry & Materials', icon: '🧪' },
  { key: 'Engineering & Materials', labelZh: '工程与工程技术', labelEn: 'Engineering & Tech', icon: '⚙️' },
  { key: 'Earth & Environment', labelZh: '地球与环境科学', labelEn: 'Earth & Environment', icon: '🪐' },
  { key: 'Physics & Math', labelZh: '物理与应用数学', labelEn: 'Physics & Math', icon: '📐' },
]

interface SpeedItem {
  speed: string
  labelZh: string
  labelEn: string
  descZh: string
  descEn: string
  icon: string
  color: string
}

const SPEED_TIERS: SpeedItem[] = [
  { speed: '60', labelZh: '< 60 天', labelEn: '< 60 days', descZh: '极速梯队', descEn: 'Fast tier', icon: '⚡', color: 'text-slate-700 bg-slate-50 border-slate-200' },
  { speed: '120', labelZh: '60 - 120 天', labelEn: '60-120 days', descZh: '标准常态', descEn: 'Standard range', icon: '⏱️', color: 'text-slate-700 bg-slate-50 border-slate-200' },
  { speed: '200', labelZh: '120 - 200 天', labelEn: '120-200 days', descZh: '适中平稳', descEn: 'Moderate tier', icon: '📅', color: 'text-slate-700 bg-slate-50 border-slate-200' },
  { speed: 'longer', labelZh: '> 200 天', labelEn: '> 200 days', descZh: '耗时较长', descEn: 'Longer duration', icon: '⏳', color: 'text-slate-700 bg-slate-50 border-slate-200' },
]

export function SiteSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const isZh = locale === 'zh'

  const currentDiscipline = searchParams?.get('discipline') || 'all'
  const currentSpeed = searchParams?.get('speed') || ''

  // Collapsible state with localStorage persistence
  const [collapsed, setCollapsed] = useState<boolean>(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rt_sidebar_collapsed')
      if (saved !== null) {
        setCollapsed(saved === 'true')
      }
    } catch {
      // ignore SSR or restricted localStorage
    }
  }, [])

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('rt_sidebar_collapsed', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  return (
    <aside
      className={`sticky top-20 max-h-[calc(100vh-5rem)] self-start overflow-y-auto shrink-0 hidden lg:block transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm transition-all">
        {/* Toggle Collapse Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          {!collapsed && (
            <div className="flex items-center gap-1.5 px-1">
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                {isZh ? '快捷工具站' : 'Tool Station'}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            title={collapsed ? (isZh ? '展开导航栏' : 'Expand sidebar') : (isZh ? '折叠导航栏（获得更大浏览空间）' : 'Collapse sidebar')}
            className={`flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition ${
              collapsed ? 'w-full' : ''
            }`}
          >
            {collapsed ? (
              <span className="text-base font-bold" aria-hidden="true">
                ⇥
              </span>
            ) : (
              <span className="text-xs font-bold flex items-center gap-1 text-slate-500 hover:text-slate-900">
                <span>⇤</span>
                <span className="text-[10px]">{isZh ? '收起' : 'Hide'}</span>
              </span>
            )}
          </button>
        </div>

        {/* Section 1: Core Navigation */}
        <div className="pt-3">
          {!collapsed && (
            <p className="px-2 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              {isZh ? '核心导航' : 'Core Tools'}
            </p>
          )}
          <nav className="space-y-1">
            {CORE_TOOLS.map(item => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isZh ? item.labelZh : item.labelEn}
                  className={`group flex items-center rounded-xl text-xs font-bold transition-all ${
                    collapsed
                      ? 'justify-center p-2.5'
                      : 'justify-between px-3 py-2'
                  } ${
                    active
                      ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-200/60'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
                    <span className="text-base transition-transform group-hover:scale-110">{item.icon}</span>
                    {!collapsed && <span>{isZh ? item.labelZh : item.labelEn}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="rounded-full bg-orange-600 px-1.5 py-0.2 text-[9px] font-black text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Section 2: Disciplines Quick Switch */}
        <div className="border-t border-slate-100 pt-3 mt-3">
          {!collapsed && (
            <div className="flex items-center justify-between px-2 pb-1.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {isZh ? '学科快速切换' : 'Disciplines'}
              </p>
              <span className="text-[10px] font-bold text-orange-600">{isZh ? '生物医学试点' : 'Biomedical pilot'}</span>
            </div>
          )}
          <div className="space-y-0.5">
            {DISCIPLINES.map(disc => {
              const isTargetPage = pathname.includes('/fast-review-journals') || pathname.includes('/journals')
              const isCurrent = isTargetPage && currentDiscipline === disc.key
              const targetUrl = `/fast-review-journals?discipline=${encodeURIComponent(disc.key)}`

              return (
                <Link
                  key={disc.key}
                  href={targetUrl}
                  title={isZh ? disc.labelZh : disc.labelEn}
                  className={`flex items-center rounded-lg transition-all ${
                    collapsed
                      ? 'justify-center p-2'
                      : 'justify-between px-2.5 py-1.5 text-xs font-semibold'
                  } ${
                    isCurrent
                      ? 'bg-orange-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:bg-orange-50/60 hover:text-orange-800'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
                    <span className="text-sm">{disc.icon}</span>
                    {!collapsed && <span className="truncate max-w-[150px]">{isZh ? disc.labelZh : disc.labelEn}</span>}
                  </div>
                  {!collapsed && isCurrent && <span className="text-xs">✓</span>}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Section 3: Speed Tiers Quick Switch */}
        <div className="border-t border-slate-100 pt-3 mt-3">
          {!collapsed && (
            <p className="px-2 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              {isZh ? '审稿时效梯队' : 'Speed Tiers'}
            </p>
          )}
          <div className={collapsed ? 'space-y-1' : 'grid grid-cols-2 gap-1.5'}>
            {SPEED_TIERS.map(tier => {
              const active = pathname.includes('/fast-review-journals') && currentSpeed === tier.speed
              const targetUrl = `/fast-review-journals?speed=${tier.speed}`

              return (
                <Link
                  key={tier.speed}
                  href={targetUrl}
                  title={`${isZh ? tier.labelZh : tier.labelEn} (${isZh ? tier.descZh : tier.descEn})`}
                  className={`flex rounded-xl border transition-all text-left ${
                    collapsed
                      ? 'justify-center p-2 text-center'
                      : 'flex-col p-2'
                  } ${
                    active
                      ? 'ring-2 ring-orange-500 shadow-sm bg-white border-orange-300'
                      : `${tier.color} hover:opacity-90`
                  }`}
                >
                  {collapsed ? (
                    <span className="text-sm">{tier.icon}</span>
                  ) : (
                    <>
                      <span className="text-xs font-black">{isZh ? tier.labelZh : tier.labelEn}</span>
                      <span className="text-[10px] font-medium opacity-80">{isZh ? tier.descZh : tier.descEn}</span>
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Section 4: Provenance badge */}
        {!collapsed ? (
          <div className="border-t border-slate-100 pt-3 mt-3">
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-[11px] leading-4 text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                <span>🏛️</span>
                <span>PubMed Dates</span>
              </div>
              <p className="text-[10px] leading-tight text-slate-500">
                {isZh
                  ? '依据 PubMed E-utilities 中可用的日期字段，展示期刊级聚合统计。'
                  : 'Journal-level aggregates from dates available through PubMed E-utilities.'}
              </p>
              <Link
                href="/about"
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 hover:text-orange-900"
              >
                <span>{isZh ? '查看合规声明 →' : 'Read compliance doc →'}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-100 pt-3 mt-3 flex justify-center">
            <Link
              href="/about"
              title={isZh ? 'PubMed 数据来源说明' : 'PubMed Data Provenance'}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition text-sm"
            >
              🏛️
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
