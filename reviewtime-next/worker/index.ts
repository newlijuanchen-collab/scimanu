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

    // Performance enhancement: Cache immutable hashed static assets for 1 year
    if (response.status === 200 && url.pathname.startsWith('/_next/static/')) {
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    }

    return response
  },
}
