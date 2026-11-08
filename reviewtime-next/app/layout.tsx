import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getSiteUrl } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'SciManu',
    template: '%s | SciManu',
  },
  description: 'Academic journal review timeline analytics & manuscript publishing insights for smarter journal selection.',
  keywords: ['scimanu', 'manuscript review time', 'journal review time', 'peer review speed', 'academic publishing', 'journal ranking'],
  openGraph: {
    title: 'SciManu',
    description: 'Academic journal review timeline analytics & manuscript publishing insights for smarter journal selection.',
    type: 'website',
    siteName: 'SciManu',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SciManu',
    description: 'Academic journal review timeline analytics & manuscript publishing insights for smarter journal selection.',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
