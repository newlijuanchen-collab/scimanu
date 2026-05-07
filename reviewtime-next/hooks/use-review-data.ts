'use client'

import { useEffect, useMemo, useState } from 'react'
import { filterJournals } from '@/lib/data-loader'
import type { JournalFilter, LoadedData } from '@/lib/types'

export function useReviewData(filter: JournalFilter = {}) {
  const [data, setData] = useState<LoadedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const resp = await fetch('/api/review-data', { cache: 'no-store' })
        if (!resp.ok) {
          const body = (await resp.json().catch(() => null)) as { message?: string } | null
          throw new Error(body?.message || `HTTP ${resp.status}`)
        }

        const loaded = (await resp.json()) as LoadedData
        if (mounted) setData(loaded)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load data')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [])

  const journals = useMemo(() => {
    if (!data) return []
    return filterJournals(data.journals, filter)
  }, [data, filter])

  return {
    data,
    journals,
    stats: data?.stats ?? null,
    rows: data?.rows ?? [],
    loading,
    error,
  }
}
