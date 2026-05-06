import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  metadataBase: new URL('https://reviewtime.local'),
  title: {
    default: 'ReviewTime',
    template: '%s | ReviewTime',
  },
  description: 'Academic journal review cycle analytics for smarter journal selection.',
  keywords: ['review time', 'journal', 'peer review', 'academic publishing', 'journal ranking'],
  openGraph: {
    title: 'ReviewTime',
    description: 'Academic journal review cycle analytics for smarter journal selection.',
    type: 'website',
    siteName: 'ReviewTime',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReviewTime',
    description: 'Academic journal review cycle analytics for smarter journal selection.',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
