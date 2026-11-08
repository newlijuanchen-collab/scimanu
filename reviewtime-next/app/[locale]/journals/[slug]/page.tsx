import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { buildLocaleAlternates } from '@/lib/seo'
import { getJournalSlug } from '@/lib/journal-slug'
import { loadPublicJournals } from '@/lib/repositories/review-data'
import { loadStatistics } from '@/lib/repositories/statistics'
import type { StageKey, StageSummary } from '@/lib/statistics-types'

export const dynamicParams = true

async function resolveJournal(slug: string) {
  const data = await loadStatistics()
  const journal = data.scope.journals.find(item => getJournalSlug(item.label, item.key) === slug)
  if (!journal) return null
  const publicJournals = await loadPublicJournals()
  const timeline = publicJournals.find(item => item.journal_key === journal.key)
  return { data, journal, timeline }
}

export async function generateStaticParams() {
  const { scope } = await loadStatistics()
  return scope.journals.map(journal => ({ slug: getJournalSlug(journal.label, journal.key) }))
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const resolved = await resolveJournal(params.slug)
  if (!resolved) return { title: 'Journal timeline | SciManu' }
  const { data, journal } = resolved
  const isZh = params.locale === 'zh'
  const acceptance = journal.stages.acceptance
  const title = isZh
    ? `${journal.label} 时间统计 | SciManu`
    : `${journal.label} Journal Timeline | SciManu`
  const description = isZh
    ? `PubMed 六个月试点中的 ${journal.label} 期刊时间统计：收稿至接收中位数 ${acceptance.median ?? '—'} 天，样本量 ${acceptance.count}。`
    : `${journal.label} in the six-month PubMed pilot: median received-to-accepted duration ${acceptance.median ?? '—'} days across ${acceptance.count} records.`
  return { title, description, alternates: buildLocaleAlternates(`/journals/${params.slug}`, params.locale) }
}

const stageKeys: StageKey[] = ['acceptance', 'first_revision', 'last_revision', 'publication']

function stageLabel(key: StageKey, isZh: boolean) {
  const labels: Record<StageKey, [string, string]> = {
    acceptance: ['收稿 → 接收', 'Received → accepted'],
    first_revision: ['收稿 → 首个 revised 日期', 'Received → first revised date'],
    last_revision: ['末个 revised 日期 → 接收', 'Last revised date → accepted'],
    publication: ['接收 → 电子发表', 'Accepted → electronic publication'],
  }
  return labels[key][isZh ? 0 : 1]
}

function formatDays(value: number | null, isZh: boolean) {
  if (value === null) return '—'
  return new Intl.NumberFormat(isZh ? 'zh-CN' : 'en-US', { maximumFractionDigits: 1 }).format(value)
}

function StageCard({ label, value, isZh }: { label: string; value: StageSummary; isZh: boolean }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {formatDays(value.median, isZh)} <span className="text-sm font-medium text-slate-500">{isZh ? '天' : 'days'}</span>
      </p>
      <p className="mt-2 text-sm text-slate-600">
        P25–P75: {formatDays(value.p25, isZh)}–{formatDays(value.p75, isZh)} {isZh ? '天' : 'days'}
      </p>
      <p className="mt-1 text-xs text-slate-500">P90: {formatDays(value.p90, isZh)} {isZh ? '天' : 'days'} · n = {value.count}</p>
    </article>
  )
}

export default async function JournalPage({ params }: { params: { slug: string; locale: string } }) {
  const resolved = await resolveJournal(params.slug)
  if (!resolved) notFound()
  const { data, journal, timeline } = resolved
  const isZh = params.locale === 'zh'
  const start = data.scope.start ?? data.scope.end
  const sourceUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(`"${journal.label}"[Journal]`)}`
  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${journal.label} PubMed date aggregates`,
    description: `Journal-level timing summaries from PubMed EFetch dates for ${journal.label}.`,
    variableMeasured: ['Received-to-accepted duration', 'P25', 'Median', 'P75', 'P90'],
    temporalCoverage: `${start}/${data.scope.end}`,
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }} />
      <nav className="text-sm text-slate-500" aria-label={isZh ? '面包屑' : 'Breadcrumb'}>
        <Link href="/journals" className="hover:text-orange-700">{isZh ? '期刊目录' : 'Journal directory'}</Link>
        <span className="mx-2">/</span><span className="text-slate-800">{journal.label}</span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-700">PubMed E-utilities · {isZh ? '六个月试点' : 'Six-month pilot'}</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{journal.label}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {isZh ? `队列：${start} 至 ${data.scope.end}` : `Cohort: ${start} to ${data.scope.end}`}
              {journal.issn && <> · ISSN {journal.issn}</>}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {isZh
                ? '本页展示按期刊汇总的时间统计。不同阶段分别使用可用的 PubMed 日期记录，因此样本量会不同。'
                : 'This page shows journal-level timing aggregates. Each stage uses its available PubMed date records, so sample counts vary by stage.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/compare?journals=${encodeURIComponent(getJournalSlug(journal.label, journal.key))}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
              {isZh ? '加入期刊对比' : 'Compare journal'}
            </Link>
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition shadow-sm">
              {isZh ? '查看 PubMed 记录' : 'View PubMed records'} ↗
            </a>
          </div>
        </div>
      </header>

      <section aria-labelledby="journal-stage-stats">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{isZh ? '阶段统计' : 'Stage summaries'}</p>
            <h2 id="journal-stage-stats" className="mt-1 text-xl font-bold text-slate-950">{isZh ? '耗时分布与样本量' : 'Duration distributions and sample counts'}</h2>
          </div>
          <p className="text-xs text-slate-500">{isZh ? '日期范围：' : 'Date range: '}{start} – {data.scope.end}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stageKeys
            .filter(key => journal.stages[key].count > 0 && journal.stages[key].median !== null)
            .map(key => <StageCard key={key} label={stageLabel(key, isZh)} value={journal.stages[key]} isZh={isZh} />)}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{isZh ? '月度明细' : 'Monthly detail'}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{isZh ? '收稿至接收耗时' : 'Received-to-accepted duration'}</h2>
        </div>
        {timeline?.timeSeries?.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">{isZh ? '发表月份' : 'Publication month'}</th>
                    <th className="px-4 py-3">n</th>
                    <th className="px-4 py-3">{isZh ? '中位数 / 天' : 'Median / days'}</th>
                    <th className="px-4 py-3">P25</th>
                    <th className="px-4 py-3">P75</th>
                    <th className="px-4 py-3">P90</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timeline.timeSeries.map(row => (
                    <tr key={row.ym}>
                      <th className="py-3 pr-4 font-semibold text-slate-800">{row.ym}</th>
                      <td className="px-4 py-3">{row.count}</td>
                      <td className="px-4 py-3 font-semibold">{row.count >= 5 ? formatDays(row.median, isZh) : '—'}</td>
                      <td className="px-4 py-3">{row.count >= 5 ? formatDays(row.p25, isZh) : '—'}</td>
                      <td className="px-4 py-3">{row.count >= 5 ? formatDays(row.p75, isZh) : '—'}</td>
                      <td className="px-4 py-3">{row.count >= 5 ? formatDays(row.p90 ?? null, isZh) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-500">{isZh ? '月度样本量少于 5 时不展示分位数和中位数。' : 'Monthly medians and percentiles are hidden when n < 5.'}</p>
          </>
        ) : (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            {isZh ? '当前样本量不足以生成月度明细。' : 'There are not enough available records for monthly detail.'}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
        <h2 className="font-bold text-slate-900">{isZh ? '数据口径' : 'Data notes'}</h2>
        <p className="mt-2">
          {isZh
            ? '来源为 PubMed E-utilities。收稿、接收和修回日期只取自 PubMed History；修回日期记录可能不完整，不代表完整审稿轮次。网站只展示聚合统计，不展示文章级日期或原始记录。'
            : 'Source: PubMed E-utilities. Received, accepted and revised dates are taken from PubMed History. Revised dates may be incomplete and do not represent complete review rounds. The site shows aggregates only, not article-level dates or raw records.'}
        </p>
        <p className="mt-2 text-xs">{isZh ? '样本量' : 'Valid received-to-accepted sample'}: {timeline?.count ?? journal.stages.acceptance.count}</p>
      </section>
    </main>
  )
}
