'use client'

import { useTranslations } from 'next-intl'

export function SiteFooter() {
  const t = useTranslations('footer')

  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="container-page flex flex-col gap-2 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>{t('note')}</p>
        <span>{t('openSource')}</span>
      </div>
    </footer>
  )
}
