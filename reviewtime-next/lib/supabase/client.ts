'use client'

import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicEnv } from './env'

let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const { url, anonKey } = getSupabasePublicEnv()
    browserClient = createClient(url, anonKey)
  }
  return browserClient
}
