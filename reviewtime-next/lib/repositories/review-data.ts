import fs from 'node:fs/promises'
import path from 'node:path'
import type { JournalStats, LoadedData } from '@/lib/types'

export interface PublicSnapshotManifest {
  snapshot_kind: string
  month: string
  as_of: string
  generated_at: string
  source_kind: string
  source_month: string
  raw_data_policy: Record<string, unknown>
  eligibility: Record<string, unknown>
  counts: {
    input_journal_groups: number
    public_journals: number
    public_sources: number
    valid_timeline_rows: number
    source_rows_after_dedup: number
  }
  sources: string[]
}

export interface SourceSnapshot {
  source_key: string
  source_display: string
  url_path: string
  timeline_journals: number
  timeline_samples: number
  timeline_coverage: number
  is_public: boolean
  is_indexable: boolean
}

function getPublicSnapshotDir() {
  const configured = process.env.REVIEWTIME_PUBLIC_SNAPSHOT_DIR?.trim()
  if (configured) return path.resolve(process.cwd(), configured)
  return path.resolve(process.cwd(), 'public/data/current')
}

export async function loadReviewDataFromSnapshot(): Promise<LoadedData> {
  const snapshotDir = getPublicSnapshotDir()
  const filePath = path.join(snapshotDir, 'review-data.json')
  const text = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(text) as LoadedData
}

async function readSnapshotJson<T>(name: string): Promise<T> {
  const snapshotDir = getPublicSnapshotDir()
  const text = await fs.readFile(path.join(snapshotDir, name), 'utf-8')
  return JSON.parse(text) as T
}

export async function loadPublicManifest(): Promise<PublicSnapshotManifest> {
  return readSnapshotJson<PublicSnapshotManifest>('manifest.json')
}

export async function loadPublicJournals(): Promise<JournalStats[]> {
  return readSnapshotJson<JournalStats[]>('journals.json')
}

export async function loadPublicSources(): Promise<SourceSnapshot[]> {
  return readSnapshotJson<SourceSnapshot[]>('sources.json')
}

export async function loadJournalBySlug(slug: string): Promise<JournalStats | null> {
  const snapshotDir = getPublicSnapshotDir()
  const safeSlug = slug.replace(/[^a-zA-Z0-9-]/g, '')
  if (!safeSlug) return null

  try {
    const text = await fs.readFile(path.join(snapshotDir, 'journals', `${safeSlug}.json`), 'utf-8')
    return JSON.parse(text) as JournalStats
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

// Backward-compatible export for older imports. The implementation no longer
// reads Supabase or local CSV snapshots.
export const loadReviewDataFromSupabase = loadReviewDataFromSnapshot
