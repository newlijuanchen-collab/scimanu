'use client'

import { useEffect, useMemo, useState } from 'react'
import { filterJournals, loadFromXLSX } from '@/lib/data-loader'
import type { JournalFilter, LoadedData } from '@/lib/types'

const DATA_CANDIDATES = ['/data.xlsx', '/web/data.xlsx']

export function useReviewData(filter: JournalFilter = {}) {
  const [data, setData] = useState<LoadedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      setError(null)

      let lastErr: unknown = null
      for (const candidate of DATA_CANDIDATES) {
        try {
          const loaded = await loadFromXLSX(candidate)
          if (mounted) setData(loaded)
          setLoading(false)
          return
        } catch (err) {
          lastErr = err
        }
      }

      if (mounted) {
        setError(lastErr instanceof Error ? lastErr.message : 'Failed to load data')
        setLoading(false)
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
