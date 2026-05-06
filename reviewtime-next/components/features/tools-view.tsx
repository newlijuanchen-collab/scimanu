'use client'

import { useTranslations } from 'next-intl'

export function ToolsView({ kind }: { kind: 'citation' | 'impact' }) {
  const t = useTranslations(`tools.${kind}`)

  return (
    <div className="space-y-4">
      <header>
        <h1 className="page-title">{t('title')}</h1>
        <p className="page-subtitle">{t('subtitle')}</p>
      </header>

      <section className="card-rt p-6 text-sm text-slate-600">
        <p>
          This module is prepared for Next.js migration. You can plug external APIs and
          advanced workflow here while keeping consistent UI and locale architecture.
        </p>
      </section>
    </div>
  )
}
