import { NextRequest, NextResponse } from 'next/server'
import { loadStatistics } from '@/lib/repositories/statistics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  try {
    const data = await loadStatistics(params.get('window') || '6m', params.get('source') || 'pubmed_biomed', params.get('type') || 'all')
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-cache' } })
  } catch (error) {
    const status = error instanceof RangeError ? 400 : 503
    return NextResponse.json({ message: status === 400 ? 'Invalid statistics filters' : 'Statistics snapshot unavailable' }, { status })
  }
}
