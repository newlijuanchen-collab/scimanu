'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function SiteFooter() {
  const t = useTranslations('footer')
  const locale = useLocale()
  const isZh = locale === 'zh'
  const supportEmail = 'support@scimanu.com'

  return (
    <footer className="mt-16 border-t border-slate-200/90 bg-white relative z-20">
      <div className="container-page py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-600 text-xs font-black text-white shadow-sm">
                S
              </span>
              <span className="text-base font-black tracking-tight text-slate-950">
                Sci<span className="text-orange-600">Manu</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              {t('note')}
            </p>
          </div>

            <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-10 text-xs">
              {/* About & Provenance */}
              <div className="space-y-1">
                <Link
                  href="/about"
                  className="font-bold text-slate-800 hover:text-orange-600 transition underline-offset-4 hover:underline"
                >
                  {isZh ? '关于与数据方法' : 'About & Methodology'}
                </Link>
                <p className="text-[11px] text-slate-400">
                  {isZh ? '方法学与 PubMed 来源' : 'Methodology & PubMed origins'}
                </p>
              </div>

              {/* Contact */}
              <div className="space-y-1">
                <Link
                  href="/contact"
                  className="font-bold text-slate-800 hover:text-orange-600 transition underline-offset-4 hover:underline"
                >
                  {isZh ? '联系我们' : 'Contact'}
                </Link>
                <div>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="font-mono text-[11px] text-slate-500 hover:text-orange-600 transition hover:underline"
                    title={isZh ? '点击发送邮件' : 'Click to send email'}
                  >
                    {supportEmail}
                  </a>
                </div>
              </div>

              {/* Privacy */}
              <div className="space-y-1">
                <Link
                  href="/privacy"
                  className="font-bold text-slate-800 hover:text-orange-600 transition underline-offset-4 hover:underline"
                >
                  {isZh ? '隐私政策' : 'Privacy'}
                </Link>
                <p className="text-[11px] text-slate-400">
                  {isZh ? '政策合规与数据安全' : 'Data policy & disclosures'}
                </p>
              </div>
            </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} SciManu. Open Scholarly Data.</p>
          <p>{isZh ? '数据源自 PubMed 开放记录，与各出版机构保持独立。' : 'Aggregated from PubMed open records. Independent from publishers.'}</p>
        </div>
      </div>
    </footer>
  )
}
