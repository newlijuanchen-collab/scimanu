import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getSiteUrl } from '@/lib/site'
import { ChunkErrorHandler } from '@/components/chunk-error-handler'

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'SciManu',
    template: '%s | SciManu',
  },
  description: 'Academic journal review timeline analytics & manuscript publishing insights for smarter journal selection.',
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){window.addEventListener('error',function(e){if(e&&e.message&&(e.message.indexOf('Loading chunk')!==-1||e.message.indexOf('ChunkLoadError')!==-1||e.message.indexOf('Failed to fetch')!==-1)){var k='chunk_err_'+location.pathname;if(!sessionStorage.getItem(k)){sessionStorage.setItem(k,'1');location.reload();}}});})();`,
          }}
        />
      </head>
      <body>
        <ChunkErrorHandler />
        {children}
      </body>
    </html>
  )
}
