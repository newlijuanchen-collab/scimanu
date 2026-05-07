import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerEnv } from './env'

export function createSupabaseServerClient() {
  const { url, key } = getSupabaseServerEnv()
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
