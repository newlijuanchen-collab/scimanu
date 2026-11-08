import { StatisticsView } from '@/components/features/statistics-view'
import { loadStatistics } from '@/lib/repositories/statistics'
import type { StatisticsData } from '@/lib/statistics-types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const zh = params.locale === 'zh'
  return {
    title: zh ? '期刊时间统计 | SciManu' : 'Journal timeline statistics | SciManu',
    description: zh ? '按可信数据来源、队列口径和文章类型，查看期刊各阶段的历史耗时与样本量。' : 'Explore journal timelines and sample sizes by trusted source, cohort definition and article type.',
  }
}

export default async function StatisticsPage({ searchParams }: { searchParams?: { window?: string; source?: string; type?: string } }) {
  let data: StatisticsData
  try {
    data = await loadStatistics(searchParams?.window, searchParams?.source, searchParams?.type)
  } catch (error) {
    if (!(error instanceof RangeError)) throw error
    data = await loadStatistics()
  }
  return <StatisticsView initialData={data} />
}
