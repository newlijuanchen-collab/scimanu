import { NextResponse } from 'next/server'
import { loadReviewDataFromSupabase } from '@/lib/repositories/review-data'

export async function GET() {
  try {
    const data = await loadReviewDataFromSupabase()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ message }, { status: 500 })
  }
}
