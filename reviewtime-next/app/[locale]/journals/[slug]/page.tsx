import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { buildDatasetJsonLd, buildJournalBreadcrumbJsonLd, buildLocaleAlternates } from '@/lib/seo'
import { getJournalSlug } from '@/lib/journal-slug'
import {
  getOfficialJournalMetrics,
  OFFICIAL_JOURNAL_METRICS_VERIFIED_AT,
} from '@/lib/data/journal-official-metrics'
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

function formatPublisherMetric(value: string | undefined, isZh: boolean, fallback: string) {
  if (!value) return fallback
  if (!isZh) return value
  return value
    .replace(/^~/, '约')
    .replace(/\bdays?\b/gi, '天')
    .replace(/\bweeks?\b/gi, '周')
    .replace(/\(editorial triage\)/gi, '（编辑初筛）')
    .replace(/\(editorial screening\)/gi, '（编辑初筛）')
}

function formatPublishingModel(value: string | undefined, isZh: boolean) {
  if (!value) return isZh ? '以出版方当前政策为准' : 'Check the current publisher policy'
  if (!isZh) return value
  if (value === 'Gold Open Access') return '金色开放获取'
  return value.replace(/Open Access/gi, '开放获取').replace(/Subscription/gi, '订阅制')
}

function formatImpactQuartile(value: string | undefined, isZh: boolean) {
  if (!value) return '—'
  if (!isZh) return value
  return value.split('·')[0].replace(/^JCR\s+/i, '').trim()
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const resolved = await resolveJournal(params.slug)
  if (!resolved) return { title: 'Journal timeline | SciManu', robots: { index: false, follow: false } }
  const { data, journal, timeline } = resolved
  const nlmId = journal.key.split(':').pop()
  const official = getOfficialJournalMetrics(nlmId)
  const isZh = params.locale === 'zh'
  const isIndexable = timeline?.is_indexable === true
  const acceptance = journal.stages.acceptance
  const medianDays = acceptance.median !== null ? Math.round(acceptance.median) : null
  const medianWeeks = medianDays !== null ? (medianDays / 7).toFixed(1) : null
  const ifText = official?.impact_factor.value ? ` (IF ${official.impact_factor.value})` : ''
  const dataYear = data.scope.end.slice(0, 4)
  const publisherSpeed = formatPublisherMetric(
    official?.publisher_reported_speed.first_decision,
    isZh,
    isZh ? '约 2–4 周' : '~2–4 weeks',
  )
  const localeAlternates = buildLocaleAlternates(`/journals/${params.slug}`, params.locale)

  const title = isZh
    ? `${journal.label} 审稿周期与发表时间统计 [${dataYear}]${ifText}`
    : `${journal.label} Review Time & Acceptance Timeline [${dataYear}]${ifText}`

  const description = isZh
    ? `${journal.label} 审稿周期、发表时间与出版指标${ifText}：收稿至接收中位数 ${medianDays ?? '—'} 天${medianWeeks ? `（约 ${medianWeeks} 周）` : ''}，样本量 ${acceptance.count}，出版方初审参考 ${publisherSpeed}。`
    : `${journal.label} review time, received-to-acceptance timeline and publication metrics${ifText}: median ${medianDays ?? '—'} days${medianWeeks ? ` (~${medianWeeks} weeks)` : ''} across ${acceptance.count} records; publisher first-decision reference ${publisherSpeed}.`

  return {
    title,
    description,
    alternates: isIndexable ? localeAlternates : { canonical: localeAlternates.canonical },
    robots: {
      index: isIndexable,
      follow: true,
      googleBot: {
        index: isIndexable,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: localeAlternates.canonical,
      siteName: 'SciManu',
      images: [{ url: '/apple-icon.png', width: 180, height: 180, alt: 'SciManu' }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ['/apple-icon.png'],
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
  const isIndexable = timeline?.is_indexable === true
  const start = data.scope.start ?? data.scope.end
  const acceptance = journal.stages.acceptance
  const medianDays = acceptance.median !== null ? Math.round(acceptance.median) : null
  const medianWeeks = medianDays !== null ? (medianDays / 7).toFixed(1) : null
  const publisherSpeed = formatPublisherMetric(
    official?.publisher_reported_speed.first_decision,
    isZh,
    isZh ? '约 2–4 周' : '~2–4 weeks',
  )
  const publicationSpeed = formatPublisherMetric(
    official?.publisher_reported_speed.acceptance_to_publication,
    isZh,
    '—',
  )
  const publishingModel = formatPublishingModel(official?.publishing_model.type, isZh)
  const impactQuartile = formatImpactQuartile(official?.impact_factor.quartile, isZh)
  const sourceUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(`"${journal.label}"[Journal]`)}`

  const datasetJsonLd = buildDatasetJsonLd({
    journalName: journal.label,
    slug: params.slug,
    locale: params.locale,
    startDate: start,
    endDate: data.scope.end,
  })

  const breadcrumbJsonLd = buildJournalBreadcrumbJsonLd({
    journalName: journal.label,
    slug: params.slug,
    locale: params.locale,
  })

  const reviewTimeFaq = isZh
    ? {
        question: `${journal.label} 从收稿到接收大约需要多久？`,
        answer: medianDays !== null
          ? `根据本页 ${acceptance.count} 条 PubMed 日期记录，${journal.label} 从收稿（Received）到接收（Accepted）的中位数为 ${medianDays} 天（约 ${medianWeeks} 周），P25–P75 为 ${acceptance.p25 ?? '—'} 至 ${acceptance.p75 ?? '—'} 天。出版方提供的初审时间参考为 ${publisherSpeed}；该指标与完整接收周期不是同一口径。`
          : `当前数据中没有足够的完整收稿与接收日期记录，因此本页暂不提供周期估计。`,
      }
    : {
        question: `How long does ${journal.label} take from receipt to acceptance?`,
        answer: medianDays !== null
          ? `Across ${acceptance.count} PubMed date records on this page, the median received-to-accepted duration for ${journal.label} is ${medianDays} days (~${medianWeeks} weeks), with a P25–P75 range of ${acceptance.p25 ?? '—'} to ${acceptance.p75 ?? '—'} days. The publisher's first-decision reference is ${publisherSpeed}; it is not the same measure as the complete acceptance timeline.`
          : `The current dataset does not contain enough complete received and accepted dates to estimate this timeline.`,
      }

  const revisionFaq = journal.stages.first_revision.median !== null
    ? (isZh
        ? {
            question: `${journal.label} 的修回阶段耗时如何？`,
            answer: `在具备修回日期记录的文献中，从收稿至首次修订日期的中位数为 ${Math.round(journal.stages.first_revision.median)} 天；末次修订至接收的中位数为 ${journal.stages.last_revision.median !== null ? Math.round(journal.stages.last_revision.median) : '—'} 天。`,
          }
        : {
            question: `How long are the revision stages for ${journal.label}?`,
            answer: `For records with revision dates, the median time from receipt to the first revision date is ${Math.round(journal.stages.first_revision.median)} days, and the median from the final revision date to acceptance is ${journal.stages.last_revision.median !== null ? Math.round(journal.stages.last_revision.median) : '—'} days.`,
          })
    : null

  const publicationMetricsFaq = isZh
    ? {
        question: `${journal.label} 的出版指标和版面费是多少？`,
        answer: official
          ? `本页记录的 Journal Impact Factor 为 ${official.impact_factor.value}（${impactQuartile}，来源：${official.impact_factor.source}），CiteScore 为 ${official.citescore}${official.scimago ? `，SJR 为 ${official.scimago.sjr}（${official.scimago.quartile}，H-Index ${official.scimago.h_index}）` : ''}。出版模式为${publishingModel}${official.publishing_model.apc_usd !== null ? `，记录的 APC 为 $${official.publishing_model.apc_usd.toLocaleString()} USD` : ''}。这些出版指标核验于 ${OFFICIAL_JOURNAL_METRICS_VERIFIED_AT}；投稿前请以出版方当前政策为准。`
          : `本页暂未收录该期刊经过核验的出版指标。投稿前请以出版方当前政策为准。`,
      }
    : {
        question: `What publication metrics and APC are recorded for ${journal.label}?`,
        answer: official
          ? `This page records a Journal Impact Factor of ${official.impact_factor.value} (${impactQuartile}; source: ${official.impact_factor.source}), a CiteScore of ${official.citescore}${official.scimago ? `, and an SJR of ${official.scimago.sjr} (${official.scimago.quartile}, H-Index ${official.scimago.h_index})` : ''}. The publishing model is ${publishingModel}${official.publishing_model.apc_usd !== null ? `, with a recorded APC of $${official.publishing_model.apc_usd.toLocaleString()} USD` : ''}. These publication metrics were reviewed on ${OFFICIAL_JOURNAL_METRICS_VERIFIED_AT}; verify the publisher's current policy before submission.`
          : `This page does not yet contain reviewed publication metrics for the journal. Verify the publisher's current policy before submission.`,
      }

  const faqItems = [reviewTimeFaq, revisionFaq, publicationMetricsFaq]
    .filter((item): item is { question: string; answer: string } => item !== null)

  const relatedJournals = data.scope.journals
    .filter(j => j.key !== journal.key && j.stages.acceptance.count > 0)
    .sort((a, b) => {
      const currentMedian = journal.stages.acceptance.median ?? Number.POSITIVE_INFINITY
      const distanceA = Math.abs((a.stages.acceptance.median ?? Number.POSITIVE_INFINITY) - currentMedian)
      const distanceB = Math.abs((b.stages.acceptance.median ?? Number.POSITIVE_INFINITY) - currentMedian)
      return distanceA - distanceB || b.stages.acceptance.count - a.stages.acceptance.count
    })
    .slice(0, 4)

  return (
    <article className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {isIndexable && (
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        </>
      )}
      <nav className="text-sm text-slate-500" aria-label={isZh ? '面包屑' : 'Breadcrumb'}>
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-orange-700">{isZh ? '首页' : 'Home'}</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/journals" className="hover:text-orange-700">{isZh ? '期刊目录' : 'Journal directory'}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-800" aria-current="page">{journal.label}</li>
        </ol>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
            {official?.publisher || 'PubMed'} · {isZh ? '六个月统计队列' : 'Six-month cohort'}
          </p>
          {official?.homepage_url && (
            <a
              href={official.homepage_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-slate-500 hover:text-orange-700"
            >
              {isZh ? '访问官方期刊网站 ↗' : 'Official Journal Portal ↗'}
            </a>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              <span className="block">{journal.label}</span>
              <span className="mt-2 block text-lg font-bold tracking-normal text-slate-700 md:text-xl">
                {isZh ? '审稿周期与发表时间统计' : 'Review Time & Acceptance Timeline'}
              </span>
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {isZh ? `统计队列：${start} 至 ${data.scope.end}` : `Cohort: ${start} to ${data.scope.end}`}
              {(journal.issn || official?.issn?.online || official?.issn?.print) && (
                <> · ISSN {journal.issn || official?.issn?.online || official?.issn?.print}</>
              )}
              {official?.impact_factor.value && <> · <strong className="text-slate-800">IF {official.impact_factor.value}</strong></>}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isZh ? '出版指标核验：' : 'Publication metrics reviewed: '}{OFFICIAL_JOURNAL_METRICS_VERIFIED_AT}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              {official?.summary
                ? (isZh ? official.summary.zh : official.summary.en)
                : (isZh
                    ? `${journal.label} 是相关生物医学与生命科学领域的同行评审期刊。下方汇总公开文献中的审稿耗时与已记录的出版指标。`
                    : `${journal.label} is a peer-reviewed journal in biomedical and life sciences. The page summarizes publication timelines from public records and reviewed publication metrics.`)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/compare?journals=${encodeURIComponent(getJournalSlug(journal.label, journal.key))}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
              {isZh ? '加入期刊对比' : 'Compare journal'}
            </Link>
            {official?.submission_url && (
              <a
                href={official.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-orange-200 bg-orange-50/70 px-4 py-2 text-sm font-semibold text-orange-800 hover:bg-orange-100 transition shadow-sm"
              >
                {isZh ? '官方投稿入口' : 'Submit Manuscript'} ↗
              </a>
            )}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition shadow-sm"
            >
              {isZh ? '查看 PubMed 记录' : 'View PubMed records'} ↗
            </a>
          </div>
        </div>
      </header>

      <section aria-label={isZh ? '核心指标' : 'Core Journal Metrics'} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              {impactQuartile}
            </p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>CiteScore: <strong className="text-slate-800">{official?.citescore ?? '—'}</strong></span>
            <span className="text-[11px] text-slate-400">Scopus</span>
          </div>
        </article>

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
              <a
                href={official.scimago.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-orange-700 hover:underline"
              >
                {isZh ? 'SCImago 详情 ↗' : 'SCImago Profile ↗'}
              </a>
            ) : (
              <span className="text-[11px] text-slate-400">SCImago</span>
            )}
          </div>
        </article>

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
              {medianWeeks && (
                <span className="ml-1.5 text-xs font-semibold text-orange-700">
                  {isZh ? `(约 ${medianWeeks} 周)` : `(~${medianWeeks} wks)`}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {isZh ? '收稿至接收实测中位 · n = ' : 'Received-to-accepted median · n = '}{acceptance.count}
            </p>
          </div>
          <div className="mt-4 border-t border-orange-200/50 pt-3 flex flex-wrap items-center justify-between gap-y-1 text-xs">
            <div>
              <span className="text-slate-600">{isZh ? '出版方初审参考：' : 'Publisher first-decision reference: '}</span>
              <strong className="text-slate-800">{publisherSpeed}</strong>
            </div>
            {official?.publisher_reported_speed.acceptance_to_publication && (
              <div>
                <span className="text-slate-600">{isZh ? '接收至上线：' : 'Acceptance to publication: '}</span>
                <strong className="text-slate-800">{publicationSpeed}</strong>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{isZh ? '出版模式与版面费' : 'Publishing & APC'}</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                {official?.publishing_model.type.includes('Open Access')
                  ? (isZh ? '开放获取' : 'Open Access')
                  : (isZh ? '订阅制' : 'Subscription')}
              </span>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              {official?.publishing_model.apc_usd !== null && official?.publishing_model.apc_usd !== undefined
                ? (official.publishing_model.apc_usd === 0
                    ? (isZh ? '免费 / 学会资助' : 'Free / Society Sponsored')
                    : `$${official.publishing_model.apc_usd.toLocaleString()} USD`)
                : (isZh ? '请核对当前政策' : 'Check current policy')}
            </p>
            <p className="mt-1 text-xs text-slate-500 line-clamp-1" title={official?.publishing_model.apc_details ? (isZh ? official.publishing_model.apc_details.zh : official.publishing_model.apc_details.en) : undefined}>
              {official?.publishing_model.apc_details
                ? (isZh ? official.publishing_model.apc_details.zh : official.publishing_model.apc_details.en)
                : (isZh ? '标准原创论著版面费' : 'Standard article processing charge')}
            </p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{publishingModel}</span>
            {official?.homepage_url ? (
              <a
                href={official.homepage_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 shrink-0 text-orange-700 hover:underline"
              >
                {isZh ? '官网详情 ↗' : 'Publisher ↗'}
              </a>
            ) : (
              <span className="text-[11px] text-slate-400">{isZh ? '投稿前请复核' : 'Verify before submission'}</span>
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
                ? `结合 ${journal.label} 的期刊范围、方法报告要求与历史发表时效，评估具体论文手稿的投稿匹配度和准备情况。`
                : `Assess a manuscript's fit and submission readiness using ${journal.label}'s scope, reporting expectations, and historical publication timelines.`}
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

      {relatedJournals.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8" aria-labelledby="related-journals-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{isZh ? '期刊探索' : 'Journal Exploration'}</p>
              <h2 id="related-journals-heading" className="mt-1 text-xl font-bold text-slate-950">
                {isZh ? '审稿周期接近的期刊' : 'Journals with similar review timelines'}
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
    </article>
  )
}
