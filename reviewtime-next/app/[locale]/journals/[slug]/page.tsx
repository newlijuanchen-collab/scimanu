import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { buildDatasetJsonLd, buildFaqJsonLd, buildLocaleAlternates } from '@/lib/seo'
import { getJournalSlug } from '@/lib/journal-slug'
import { getOfficialJournalMetrics } from '@/lib/data/journal-official-metrics'
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
  const nlmId = journal.key.split(':').pop()
  const official = getOfficialJournalMetrics(nlmId)
  const isZh = params.locale === 'zh'
  const acceptance = journal.stages.acceptance
  const medianDays = acceptance.median !== null ? Math.round(acceptance.median) : null
  const medianWeeks = medianDays !== null ? (medianDays / 7).toFixed(1) : null
  const ifText = official?.impact_factor.value ? ` (IF ${official.impact_factor.value})` : ''

  const title = isZh
    ? `${journal.label} 审稿周期与发表时间统计 [2026]${ifText}`
    : `${journal.label} Review Time & Acceptance Timeline [2026]${ifText}`

  const description = isZh
    ? `${journal.label} 审稿周期、发表时间与官方指标${ifText}：收稿至接收中位数 ${medianDays ?? '—'} 天${medianWeeks ? `（约 ${medianWeeks} 周）` : ''}，样本量 ${acceptance.count}，官方初审约 ${official?.publisher_reported_speed.first_decision ?? '2–4 周'}。`
    : `${journal.label} review time, submission timeline & official metrics${ifText}: median submission-to-acceptance ${medianDays ?? '—'} days${medianWeeks ? ` (~${medianWeeks} weeks)` : ''} (n = ${acceptance.count}), publisher 1st decision ${official?.publisher_reported_speed.first_decision ?? '~2–4 weeks'}.`

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
  const nlmId = journal.key.split(':').pop()
  const official = getOfficialJournalMetrics(nlmId)
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
              ? `根据 PubMed 收录的 ${acceptance.count} 篇文献真实日期统计，${journal.label} 从收稿（Received）到接收（Accepted）的中位数时间约为 ${medianDays} 天（约 ${medianWeeks} 周）。50% 的稿件在 ${acceptance.p25 ?? '—'} 至 ${acceptance.p75 ?? '—'} 天内处理完毕。相比期刊官方宣称的初审周期（${official?.publisher_reported_speed.first_decision ?? '约 2–4 周'}），完整从投到录通常需要经历修回与多轮同行评审。`
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
          question: `如何查询 ${journal.label} 的最新影响因子（Impact Factor）与官方投稿须知？`,
          answer: official
            ? `${journal.label} 最新影响因子为 ${official.impact_factor.value}（${official.impact_factor.quartile}，数据源自 ${official.impact_factor.source}），CiteScore 为 ${official.citescore}${official.scimago ? `，SCImago SJR 为 ${official.scimago.sjr}（${official.scimago.quartile}，H-Index ${official.scimago.h_index}）` : ''}。出版模式为 ${official.publishing_model.type}${official.publishing_model.apc_usd !== null ? `，文章处理版面费 (APC) 为 $${official.publishing_model.apc_usd.toLocaleString()} USD${official.publishing_model.apc_details ? `（${official.publishing_model.apc_details.zh}）` : ''}` : ''}。官方投稿须知与作者指南可直接通过其官方门户（${official.publisher}）查阅。`
            : `SciManu 专注于挖掘 PubMed 公开文献中的真实审稿与接收耗时数据。关于 ${journal.label} 的最新官方影响因子（Clarivate JCR IF）、中科院分区、版面费（APC）及作者投稿须知，请直接通过官方出版社网站或 PubMed 官方页面核对。`,
        },
      ]
    : [
        {
          question: `How long is the review time for ${journal.label}?`,
          answer:
            medianDays !== null
              ? `Based on ${acceptance.count} published articles in PubMed, the median duration from submission (received) to acceptance for ${journal.label} is ${medianDays} days (~${medianWeeks} weeks). The interquartile range (IQR, P25–P75) is ${acceptance.p25 ?? '—'} to ${acceptance.p75 ?? '—'} days. While the publisher advertises initial triage in ${official?.publisher_reported_speed.first_decision ?? '~2–4 weeks'}, complete acceptance accounts for multiple peer-review and revision loops.`
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
          answer: official
            ? `${journal.label} holds an official Journal Impact Factor of ${official.impact_factor.value} (${official.impact_factor.quartile}, source: ${official.impact_factor.source}), with a CiteScore of ${official.citescore}${official.scimago ? `, and an SCImago SJR of ${official.scimago.sjr} (${official.scimago.quartile}, H-Index ${official.scimago.h_index})` : ''}. It operates as ${official.publishing_model.type}${official.publishing_model.apc_usd !== null ? ` with an Article Processing Charge (APC) of $${official.publishing_model.apc_usd.toLocaleString()} USD${official.publishing_model.apc_details ? ` (${official.publishing_model.apc_details.en})` : ''}` : ''}. Official submission guidelines and author instructions can be accessed directly via ${official.publisher}.`
            : `SciManu focuses on empirical submission-to-acceptance timelines extracted from PubMed records. For the official Journal Impact Factor (Clarivate JCR), CiteScore, Article Processing Charges (APC), and Author Guidelines, please visit the official ${journal.label} publisher portal or the PubMed catalog entry.`,
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
            {official?.publisher || 'PubMed E-utilities'} · {isZh ? '六个月统计队列' : 'Six-month cohort'}
          </p>
          {official?.homepage_url && (
            <a href={official.homepage_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-500 hover:text-orange-700">
              {isZh ? '访问官方期刊网站 ↗' : 'Official Journal Portal ↗'}
            </a>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{journal.label}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {isZh ? `统计队列：${start} 至 ${data.scope.end}` : `Cohort: ${start} to ${data.scope.end}`}
              {(journal.issn || official?.issn?.online || official?.issn?.print) && (
                <> · ISSN {journal.issn || official?.issn?.online || official?.issn?.print}</>
              )}
              {official?.impact_factor.value && <> · <strong className="text-slate-800">IF {official.impact_factor.value}</strong></>}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              {official?.summary
                ? (isZh ? official.summary.zh : official.summary.en)
                : (isZh
                    ? `${journal.label} 是相关生物医学与生命科学领域的重要学术期刊，致力于发表同行评审的原创科研成果与前沿学术综述。下方汇总客观文献审稿耗时与官方出版指标。`
                    : `${journal.label} is an authoritative peer-reviewed journal dedicated to advancing discoveries across biomedical and life sciences. Explore empirical review timelines and official publication metrics below.`)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/compare?journals=${encodeURIComponent(getJournalSlug(journal.label, journal.key))}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
              {isZh ? '加入期刊对比' : 'Compare journal'}
            </Link>
            {official?.submission_url && (
              <a href={official.submission_url} target="_blank" rel="noreferrer" className="rounded-xl border border-orange-200 bg-orange-50/70 px-4 py-2 text-sm font-semibold text-orange-800 hover:bg-orange-100 transition shadow-sm">
                {isZh ? '官方投稿入口' : 'Submit Manuscript'} ↗
              </a>
            )}
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition shadow-sm">
              {isZh ? '查看 PubMed 记录' : 'View PubMed records'} ↗
            </a>
          </div>
        </div>
      </header>

      {/* 4 Core Dual-Track Metric Cards */}
      <section aria-label={isZh ? '核心指标' : 'Core Journal Metrics'} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Official Impact Factor */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{isZh ? '影响因子 (JCR)' : 'Impact Factor (JCR)'}</span>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {official?.impact_factor.quartile.split('·')[0].trim() || 'Q1'}
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {official?.impact_factor.value ?? '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500 line-clamp-1" title={official?.impact_factor.quartile}>
              {official?.impact_factor.quartile || (isZh ? 'Clarivate JCR 索引' : 'Clarivate JCR')}
            </p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>CiteScore: <strong className="text-slate-800">{official?.citescore ?? '—'}</strong></span>
            <span className="text-[11px] text-slate-400">Web of Science</span>
          </div>
        </article>

        {/* Card 2: SCImago & Scopus Rank (Dedicated Card) */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{isZh ? '学术评级 (SCImago)' : 'SCImago & Scopus'}</span>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                {official?.scimago?.quartile ? `Scopus ${official.scimago.quartile}` : 'Q1'}
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {official?.scimago?.sjr ?? '—'}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {isZh ? 'SJR 指标 · ' : 'SJR Metric · '}<strong className="text-slate-900 font-bold">H-Index {official?.scimago?.h_index ?? '—'}</strong>
            </p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{isZh ? 'Scopus 权威索引' : 'Scopus Indexed'}</span>
            {official?.scimago?.url ? (
              <a href={official.scimago.url} target="_blank" rel="noreferrer" className="text-orange-700 font-medium hover:underline">
                {isZh ? 'SCImago 详情 ↗' : 'SCImago Profile ↗'}
              </a>
            ) : (
              <span className="text-[11px] text-slate-400">Scopus DB</span>
            )}
          </div>
        </article>

        {/* Card 3: Dual-Track Review Duration (Empirical vs Claimed) */}
        <article className="rounded-2xl border border-orange-200/80 bg-orange-50/30 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-800">{isZh ? '审稿周期对照' : 'Review Timeline'}</span>
              <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-800">
                {isZh ? 'PubMed 实测' : 'PubMed Empirical'}
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {formatDays(acceptance.median, isZh)} <span className="text-sm font-medium text-slate-500">{isZh ? '天' : 'days'}</span>
              {medianWeeks && <span className="ml-1.5 text-xs font-semibold text-orange-700">(~{medianWeeks} {isZh ? '周' : 'wks'})</span>}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {isZh ? '收稿至接收实测中位 · n = ' : 'Submission to acceptance median · n = '}{acceptance.count}
            </p>
          </div>
          <div className="mt-4 border-t border-orange-200/50 pt-3 flex flex-wrap items-center justify-between gap-y-1 text-xs">
            <div>
              <span className="text-slate-600">{isZh ? '官方初审: ' : '1st decision: '}</span>
              <strong className="text-slate-800">{official?.publisher_reported_speed.first_decision || (isZh ? '约 2–4 周' : '~2–4 wks')}</strong>
            </div>
            {official?.publisher_reported_speed.acceptance_to_publication && (
              <div>
                <span className="text-slate-600">{isZh ? '上线: ' : 'Publish: '}</span>
                <strong className="text-slate-800">{official.publisher_reported_speed.acceptance_to_publication}</strong>
              </div>
            )}
          </div>
        </article>

        {/* Card 4: Publishing Model & APC */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{isZh ? '出版模式与版面费' : 'Publishing & APC'}</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                {official?.publishing_model.type.includes('Open Access') ? 'Open Access' : 'Subscription'}
              </span>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              {official?.publishing_model.apc_usd !== null && official?.publishing_model.apc_usd !== undefined
                ? (official.publishing_model.apc_usd === 0
                    ? (isZh ? '免费 / 学会资助' : 'Free / Society Sponsored')
                    : `$${official.publishing_model.apc_usd.toLocaleString()} USD`)
                : (isZh ? '见官网详情' : 'See Publisher Site')}
            </p>
            <p className="mt-1 text-xs text-slate-500 line-clamp-1" title={official?.publishing_model.apc_details ? (isZh ? official.publishing_model.apc_details.zh : official.publishing_model.apc_details.en) : undefined}>
              {official?.publishing_model.apc_details
                ? (isZh ? official.publishing_model.apc_details.zh : official.publishing_model.apc_details.en)
                : (isZh ? '标准原创论著版面费' : 'Standard article processing charge')}
            </p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="line-clamp-1">
              {isZh ? '录用机制: ' : 'Acceptance: '}
              <strong className="text-slate-800">
                {official?.acceptance_rate.rate
                  ? (typeof official.acceptance_rate.rate === 'object'
                      ? (isZh ? official.acceptance_rate.rate.zh : official.acceptance_rate.rate.en)
                      : official.acceptance_rate.rate)
                  : (isZh ? '同行评议择优录用' : 'Selective Peer Review')}
              </strong>
            </span>
            {official?.homepage_url && (
              <a href={official.homepage_url} target="_blank" rel="noreferrer" className="text-orange-700 hover:underline shrink-0 ml-1">
                {isZh ? '官网详情 ↗' : 'Publisher ↗'}
              </a>
            )}
          </div>
        </article>
      </section>

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

      {/* Service CTA: Objective, Pre-submission Audit for specific manuscript drafts */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-sm md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-block rounded-md bg-orange-500/20 px-2.5 py-1 text-xs font-bold text-orange-300 border border-orange-500/30">
              {isZh ? '深度选刊诊断服务' : 'Manuscript Submission Advisory'}
            </span>
            <h3 className="mt-3 text-xl font-bold text-white md:text-2xl">
              {isZh ? `计划向 ${journal.label} 投稿？` : `Planning to submit to ${journal.label}?`}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {isZh
                ? `针对具体论文手稿，全面评估其在 ${journal.label} 的学科契合度评分、同行评审送审几率与初审拒稿风险。公域详情仅展示客观事实数据，针对具体论文的适合度与送审建议在独立报告中交付。`
                : `Evaluate your manuscript draft against ${journal.label}'s publication scope, desk rejection risk factors, and method reporting standards. Public journal pages display empirical statistics; specific suitability and submission recommendations are delivered via customized paper audit reports.`}
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-500 transition"
            >
              {isZh ? '申请稿件适配诊断报告 →' : 'Request Manuscript Audit Report →'}
            </Link>
          </div>
        </div>
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
