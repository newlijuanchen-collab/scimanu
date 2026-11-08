export interface Env {
  ASSETS: Fetcher
  GEMINI_API_KEY?: string
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    // 1. Root redirect to default locale (/en)
    if (url.pathname === '/' || url.pathname === '') {
      return Response.redirect(`${url.origin}/en`, 302)
    }

    // 2. Extensible API routes for AI checkers, stats, analysis
    if (url.pathname.startsWith('/api/')) {
      // Health check endpoint
      if (url.pathname === '/api/health') {
        return Response.json(
          {
            status: 'ok',
            service: 'scimanu-worker',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
          },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-store',
            },
          },
        )
      }

      // Placeholder / Skeleton for future AI Checker services
      if (url.pathname === '/api/checker') {
        if (request.method === 'OPTIONS') {
          return new Response(null, {
            status: 204,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          })
        }

        return Response.json(
          {
            message: 'SciManu AI Checker engine ready for Gemini integration',
            supported_checks: ['timeline_prediction', 'journal_fit', 'peer_review_checklist'],
          },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
          },
        )
      }

      return Response.json({ error: 'Endpoint not found' }, { status: 404 })
    }

    // 3. Serve Next.js SSG static assets via Cloudflare global edge
    return env.ASSETS.fetch(request)
  },
}
