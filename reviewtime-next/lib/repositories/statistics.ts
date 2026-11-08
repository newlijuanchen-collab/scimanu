import fs from 'node:fs/promises'
import path from 'node:path'
import type { StatisticsArticleType, StatisticsData, StatisticsManifest, StatisticsScope, StatisticsWindow } from '@/lib/statistics-types'

export async function loadStatistics(
  window: string = '6m',
  source: string = 'pubmed_biomed',
  articleType: string = 'all',
): Promise<StatisticsData> {
  const root = path.resolve(process.cwd(), process.env.REVIEWTIME_STATISTICS_DIR || 'public/data/statistics')
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'index.json'), 'utf8')) as StatisticsManifest
  const sourceConfig = manifest.sources.find(item => item.key === source)
  if (!sourceConfig || !sourceConfig.windows.includes(window as StatisticsWindow) ||
    !sourceConfig.article_types.includes(articleType as StatisticsArticleType)) {
    throw new RangeError('Invalid data source')
  }
  if (!/^[a-z0-9_-]+$/.test(source) || !/^\d{8}T\d{12}Z$/.test(manifest.version)) {
    throw new RangeError('Invalid statistics snapshot')
  }
  const scope = JSON.parse(await fs.readFile(
    path.join(root, manifest.version, `${window}-${source}-${articleType}.json`), 'utf8',
  )) as StatisticsScope
  return { manifest, scope }
}
