import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
})

export type AppLocale = (typeof routing.locales)[number]

export function isValidLocale(locale: string): locale is AppLocale {
  return routing.locales.includes(locale as AppLocale)
}

