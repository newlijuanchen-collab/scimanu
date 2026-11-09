import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteSidebar } from '@/components/layout/site-sidebar'
import { isValidLocale, routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { locale: string }
}) {
  const { locale } = params
  if (!isValidLocale(locale)) notFound()

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-[var(--rt-bg)] flex flex-col">
        <SiteHeader />
        <div className="container-page flex-1 py-6 flex gap-6 lg:gap-8 items-start">
          <SiteSidebar />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
        <SiteFooter />
      </div>
    </NextIntlClientProvider>
  )
}
