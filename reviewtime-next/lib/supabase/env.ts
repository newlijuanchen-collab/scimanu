function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getSupabasePublicEnv() {
  return {
    url: requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  }
}

export function getSupabaseServerEnv() {
  const { url, anonKey } = getSupabasePublicEnv()
  return {
    url,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey,
  }
}

export function getReviewRowsTableName() {
  return process.env.NEXT_PUBLIC_SUPABASE_REVIEW_TABLE || 'review_rows'
}
