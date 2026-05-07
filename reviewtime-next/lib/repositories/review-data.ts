import type { RawRow, LoadedData } from '@/lib/types'
import { buildLoadedData } from '@/lib/data-loader'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getReviewRowsTableName } from '@/lib/supabase/env'

const DEFAULT_LIMIT = 50000

export async function loadReviewDataFromSupabase(limit = DEFAULT_LIMIT): Promise<LoadedData> {
  const supabase = createSupabaseServerClient()
  const table = getReviewRowsTableName()

  const { data, error } = await supabase.from(table).select('*').limit(limit)
  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`)
  }

  return buildLoadedData((data ?? []) as RawRow[])
}
