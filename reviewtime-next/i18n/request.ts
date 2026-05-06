import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
import type { AppLocale } from './routing'
import en from './messages/en.json'
import zh from './messages/zh.json'

const MESSAGES: Record<AppLocale, typeof en> = {
  en,
  zh,
}

export default getRequestConfig(async ({ locale }: { locale: string }) => {
  const normalized = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale

  return {
    locale: normalized,
    messages: MESSAGES[normalized],
  }
})
