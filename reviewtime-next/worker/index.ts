interface Fetcher {
  fetch: (request: Request | string, init?: RequestInit) => Promise<Response>
}

interface ExecutionContext {
  waitUntil: (promise: Promise<unknown>) => void
  passThroughOnException: () => void
}

export interface Env {
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    // 0. Canonical domain: redirect www.scimanu.com to scimanu.com (301 Permanent Redirect)
    if (url.hostname === 'www.scimanu.com') {
      return Response.redirect(`https://scimanu.com${url.pathname}${url.search}`, 301)
    }

    // 1. Default language is English -> Strip '/en' prefix (301 Permanent Redirect for SEO)
    if (url.pathname === '/en' || url.pathname === '/en/') {
      return Response.redirect(`${url.origin}/${url.search}`, 301)
    }

    if (url.pathname.startsWith('/en/')) {
      const unPrefixed = url.pathname.slice(3) // strips '/en'
      return Response.redirect(`${url.origin}${unPrefixed}${url.search}`, 301)
    }

    // 2. Currently no public API is exposed
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      })
    }

    // 3. Serve Next.js SSG static assets via Cloudflare global edge
    let response = await env.ASSETS.fetch(request)

    // Edge fallback: if asset is 404 and is an un-prefixed English route, attempt /en fallback
    if (response.status === 404 && (request.method === 'GET' || request.method === 'HEAD')) {
      const p = url.pathname
      if (!p.startsWith('/_next') && !p.startsWith('/zh') && !p.includes('.')) {
        const fallbackUrl = new URL(`/en${p === '/' ? '' : p}`, request.url)
        const fallbackResponse = await env.ASSETS.fetch(new Request(fallbackUrl, request))
        if (fallbackResponse.status === 200) {
          response = fallbackResponse
        }
      }
    }

    // Only apply caching optimizations to successful GET / HEAD responses
    if (response.status === 200 && (request.method === 'GET' || request.method === 'HEAD')) {
      const headers = new Headers(response.headers)
      const pathname = url.pathname
      const contentType = headers.get('Content-Type') || ''

      // A. Immutable Next.js hashed assets (JS, CSS, static chunks) -> 1 year cache
      if (pathname.startsWith('/_next/static/')) {
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      }
      // B. Static images, fonts, and icons -> 1 day browser, 7 days edge CDN
      else if (
        pathname.match(/\.(png|jpe?g|webp|avif|svg|ico|woff2?|ttf|eot)$/i) ||
        pathname === '/favicon.ico' ||
        pathname === '/icon.svg' ||
        pathname === '/apple-icon.png'
      ) {
        headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400')
      }
      // C. Public data JSON snapshots -> 5 min browser, 1 hour edge CDN
      else if (pathname.endsWith('.json') || pathname.startsWith('/data/')) {
        headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400')
      }
      // D. Next.js RSC payload files (.txt) -> 1 min browser, 1 hour edge CDN
      else if (pathname.endsWith('.txt')) {
        headers.set('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400')
      }
      // E. Prerendered SSG HTML pages -> 1 min browser, 1 hour edge CDN with stale-while-revalidate
      else if (contentType.includes('text/html') || !pathname.includes('.')) {
        headers.set('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400')
      }

      // Security & Performance response headers
      headers.set('X-Content-Type-Options', 'nosniff')

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    }

    return response
  },
}
