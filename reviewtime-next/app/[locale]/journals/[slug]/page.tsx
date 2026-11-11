import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { buildDatasetJsonLd, buildFaqJsonLd, buildLocaleAlternates } from '@/lib/seo'
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
  const medianDays = acceptance.median !== null ? Math.round(acceptance.median) : null
  const medianWeeks = medianDays !== null ? (medianDays / 7).toFixed(1) : null

  const title = isZh
    ? `${journal.label} 审稿周期与发表时间统计 [2026]`
    : `${journal.label} Review Time & Acceptance Timeline [2026]`

  const description = isZh
    ? `${journal.label} 审稿周期与投稿发表时间统计（基于 PubMed ${acceptance.count} 篇文献）：从收稿至接收中位数 ${medianDays ?? '—'} 天${medianWeeks ? `（约 ${medianWeeks} 周）` : ''}，P25–P75 耗时 ${acceptance.p25 ?? '—'}–${acceptance.p75 ?? '—'} 天。`
    : `${journal.label} review time & acceptance timeline from PubMed published articles (n = ${acceptance.count}): median submission-to-acceptance duration ${medianDays ?? '—'} days${medianWeeks ? ` (~${medianWeeks} weeks)` : ''}, IQR ${acceptance.p25 ?? '—'}–${acceptance.p75 ?? '—'} days.`

  return {
    title,
    description,
    alternates: buildLocaleAlternates(`/journals/${params.slug}`, params.locale),
    openGraph: {
      title,
      description,
      type: 'article',
    },
  }
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
  const acceptance = journal.stages.acceptance
  const medianDays = acceptance.median !== null ? Math.round(acceptance.median) : null
  const medianWeeks = medianDays !== null ? (medianDays / 7).toFixed(1) : null

  const datasetJsonLd = buildDatasetJsonLd({
    journalName: journal.label,
    slug: params.slug,
    locale: params.locale,
    startDate: start,
    endDate: data.scope.end,
  })

  const faqItems = isZh
    ? [
        {
          question: `${journal.label} 审稿周期大概多久？从投稿到正式接收需要多少时间？`,
          answer:
            medianDays !== null
              ? `根据 PubMed 收录的 ${acceptance.count} 篇文献真实日期统计，${journal.label} 从收稿（Received）到接收（Accepted）的中位数时间约为 ${medianDays} 天（约 ${medianWeeks} 周）。50% 的稿件在 ${acceptance.p25 ?? '—'} 至 ${acceptance.p75 ?? '—'} 天内处理完毕。`
              : `目前统计样本中暂无足够的完整日期记录，通常生物医学期刊常规审稿周期在 4 至 12 周之间。`,
        },
        {
          question: `${journal.label} 的初审与修回阶段耗时情况如何？`,
          answer:
            journal.stages.first_revision.median !== null
              ? `在具备修回日期记录的文献中，从收稿至首个修订日期（First Revision）的中位数为 ${Math.round(journal.stages.first_revision.median)} 天。末次修回至最终接收中位数为 ${journal.stages.last_revision.median !== null ? Math.round(journal.stages.last_revision.median) : '—'} 天。`
              : `初审及审稿人意见反馈耗时通常在 4 至 8 周左右，具体取决于当期投稿量与同行评审专家回复进度。`,
        },
        {
          question: `如何查询 ${journal.label} 的官方影响因子（Impact Factor）与投稿须知？`,
          answer: `SciManu 专注于挖掘 PubMed 公开文献中的真实审稿与接收耗时数据。关于 ${journal.label} 的最新官方影响因子（Clarivate JCR IF）、中科院分区、版面费（APC）及作者投稿须知，请直接通过官方出版社网站或 PubMed 官方页面核对。`,
        },
      ]
    : [
        {
          question: `How long is the review time for ${journal.label}?`,
          answer:
            medianDays !== null
              ? `Based on ${acceptance.count} published articles in PubMed, the median duration from submission (received) to acceptance for ${journal.label} is ${medianDays} days (~${medianWeeks} weeks). The interquartile range (IQR, P25–P75) is ${acceptance.p25 ?? '—'} to ${acceptance.p75 ?? '—'} days.`
              : `Date records are currently limited for this journal cohort. Peer review turnaround typically spans 4 to 12 weeks for biomedical publications.`,
        },
        {
          question: `What is the timeline for first revision and decision for ${journal.label}?`,
          answer:
            journal.stages.first_revision.median !== null
              ? `For articles with reported revision milestones, the median time from receipt to first revision date is ${Math.round(journal.stages.first_revision.median)} days. The final revision to acceptance median is ${journal.stages.last_revision.median !== null ? Math.round(journal.stages.last_revision.median) : '—'} days.`
              : `First decision times depend on reviewer availability and editorial review, usually ranging between 4 to 8 weeks.`,
        },
        {
          question: `Where can I find ${journal.label}'s official Impact Factor and author guidelines?`,
          answer: `SciManu focuses on empirical submission-to-acceptance timelines extracted from PubMed records. For the official Journal Impact Factor (Clarivate JCR), CiteScore, Article Processing Charges (APC), and Author Guidelines, please visit the official ${journal.label} publisher portal or the PubMed catalog entry.`,
        },
      ]

  const faqJsonLd = buildFaqJsonLd(faqItems)

  const relatedJournals = data.scope.journals
    .filter(j => j.key !== journal.key && j.stages.acceptance.count > 0)
    .slice(0, 4)

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
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

      {/* Frequently Asked Questions */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8" aria-labelledby="journal-faq-heading">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-700">{isZh ? '常见问答' : 'Frequently Asked Questions'}</p>
          <h2 id="journal-faq-heading" className="mt-1 text-2xl font-bold text-slate-950">
            {isZh ? `${journal.label} 投稿与审稿问答` : `${journal.label} Review & Submission FAQ`}
          </h2>
        </div>
        <div className="space-y-4">
          {faqItems.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/70 p-5">
              <h3 className="text-base font-bold text-slate-900">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related & Comparable Journals */}
      {relatedJournals.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8" aria-labelledby="related-journals-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{isZh ? '期刊探索' : 'Journal Exploration'}</p>
              <h2 id="related-journals-heading" className="mt-1 text-xl font-bold text-slate-950">
                {isZh ? '其他同行评审候选期刊' : 'Comparable Peer-Reviewed Journals'}
              </h2>
            </div>
            <Link href="/journals" className="text-xs font-semibold text-orange-700 hover:underline">
              {isZh ? '查看全部期刊 →' : 'View all journals →'}
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedJournals.map(cand => {
              const candSlug = getJournalSlug(cand.label, cand.key)
              return (
                <div key={cand.key} className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-slate-200 hover:bg-slate-50">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                      <Link href={`/journals/${candSlug}`} className="hover:text-orange-700">
                        {cand.label}
                      </Link>
                    </h3>
                    <p className="mt-2 text-xs text-slate-500">
                      {isZh ? '接收中位数' : 'Median Acceptance'}: <strong className="text-slate-800">{cand.stages.acceptance.median !== null ? `${Math.round(cand.stages.acceptance.median)} ${isZh ? '天' : 'days'}` : '—'}</strong>
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200/60 pt-3">
                    <Link href={`/journals/${candSlug}`} className="text-xs font-semibold text-orange-700 hover:underline">
                      {isZh ? '查看详情' : 'Timeline'}
                    </Link>
                    <Link href={`/compare?journals=${encodeURIComponent(getJournalSlug(journal.label, journal.key))},${encodeURIComponent(candSlug)}`} className="text-xs text-slate-500 hover:text-slate-800">
                      {isZh ? '与此期刊对比' : 'Compare'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <p className="mt-8 text-center text-xs text-slate-400">
        {isZh ? '数据源自 PubMed 公开记录汇总 · ' : 'Aggregated from public PubMed records · '}
        <Link href="/about" className="underline hover:text-slate-600">
          {isZh ? '关于统计方法说明' : 'About Methodology'}
        </Link>
      </p>
    </main>
  )
}
