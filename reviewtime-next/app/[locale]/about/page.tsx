import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { buildLocaleAlternates } from '@/lib/seo'

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isZh = params.locale === 'zh'

  return {
    title: isZh ? '关于我们：第三方期刊时效观察 | SciManu' : 'About SciManu: Third-Party Journal Timelines | SciManu',
    description: isZh
      ? '了解 SciManu 的定位：从第三方文献计量角度，依据 PubMed 公开记录为学者提供期刊发表周期的补充性参考。'
      : 'Learn about SciManu: an independent third-party bibliometric resource offering complementary journal publication timeline references from public PubMed data.',
    alternates: buildLocaleAlternates('/about', params.locale),
  }
}

export default function AboutPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  const isZh = params.locale === 'zh'

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12">
      {/* Hero Header */}
      <header className="border-b border-slate-200/90 pb-9">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-700">
          <span>📖</span>
          <span>{isZh ? '关于我们 · About SciManu' : 'About SciManu'}</span>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl md:text-[2.5rem] md:leading-tight">
          {isZh
            ? '从第三方视角，为学术投稿提供多维度的时效参考'
            : 'A complementary, third-party perspective on journal publication timelines'}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
          {isZh
            ? '在学术出版过程中，许多期刊官网都会提供非常专业、详实的审稿与决策周期指引。SciManu 作为一个独立的第三方学术观察工具，依据 PubMed 公开书目记录对历史发表文献进行统计回溯，旨在为研究人员在选择期刊与规划发表进度时，提供一个多维度的补充参考视角。'
            : 'In academic publishing, many journals provide official turnaround metrics and guidelines on their websites. As an independent third-party academic resource, SciManu analyzes public bibliographic records from PubMed to offer researchers a complementary, retrospective look at historical publication timelines.'}
        </p>
      </header>

      {/* Section 1: Positioning */}
      <section className="card-rt p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>01</span>
          <span>{isZh ? '项目定位' : 'Our Role & Perspective'}</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {isZh
            ? '期刊官方指引与第三方回溯统计相互补充'
            : 'Complementing Official Guidelines with Retrospective Data'}
        </h2>
        <div className="space-y-3.5 text-sm leading-relaxed text-slate-600">
          <p>
            {isZh
              ? '各大期刊和学术出版机构在组织严谨的同行评议流程中付出了大量心力，许多期刊官网也会定期发布初审平均周期（Time to First Decision）等指标，为作者提供权威指导。'
              : 'Scholarly publishers and editorial teams dedicate substantial care to coordinating rigorous peer review, and many official journal sites publish helpful turnaround metrics, such as median time to first decision.'}
          </p>
          <p>
            {isZh
              ? 'SciManu 的初衷并非替代期刊的官方指引，而是从文献计量学（Bibliometrics）的角度，基于已被 PubMed 索引的公开文献历史时间戳，提供一个横向的、跨时间段的宏观统计视角（如历史中位数、四分位分布与月度波动），方便学者在制定投稿规划时综合参照。'
              : 'SciManu is designed not to replace official journal guidelines, but to provide a complementary bibliometric vantage point—summarizing historical date milestones from PubMed-indexed cohorts (such as medians, interquartile distributions, and monthly trends) to help authors cross-reference when planning submissions.'}
          </p>
        </div>
      </section>

      {/* Section 2: Methodology */}
      <section className="card-rt p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>02</span>
          <span>{isZh ? '数据来源与处理' : 'Data Provenance & Aggregation'}</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {isZh ? '基于公开记录的客观文献计量统计' : 'Objective Aggregation from Public Records'}
        </h2>
        <p className="text-sm leading-relaxed text-slate-600">
          {isZh
            ? 'SciManu 的统计基于美国国家医学图书馆（NLM）PubMed 的公开书目元数据，通过官方 NCBI E-utilities 开放接口获取：'
            : 'All metrics on SciManu are derived from publicly available bibliographic metadata indexed by the U.S. National Library of Medicine (NLM) via PubMed NCBI E-utilities:'}
        </p>

        <div className="grid gap-3.5 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-xs font-bold text-slate-800">{isZh ? '公开历史时间戳' : 'Public Milestones'}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-600">
              {isZh
                ? '提取已发表论文中公开记录的 Received、Revised、Accepted 等时间节点。'
                : 'We parse public date events (Received, Revised, Accepted) documented in published papers.'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-xs font-bold text-slate-800">{isZh ? '分位数分布呈现' : 'Distribution Metrics'}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-600">
              {isZh
                ? '通过中位数与四分位区间（P25–P75），展示历史已见刊论文的宏观时效分布。'
                : 'Medians and interquartile ranges (P25–P75) illustrate overall cohort turnaround distributions.'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-xs font-bold text-slate-800">{isZh ? '纯宏观群体汇总' : 'Cohort Aggregates Only'}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-600">
              {isZh
                ? '仅展示期刊和月份维度的聚合数据，不展示论文正文或作者个人信息，尊重学术版权。'
                : 'Only aggregated journal- and month-level metrics are displayed; no full-text content or author personal details are stored.'}
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Interpretation & Nuance */}
      <section className="card-rt p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>03</span>
          <span>{isZh ? '数据理解与建议' : 'Understanding the Metrics'}</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {isZh ? '如何客观看待统计结果' : 'Interpreting the Metrics Thoughtfully'}
        </h2>
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <div className="border-l-2 border-slate-300 pl-4 py-0.5">
            <h3 className="font-semibold text-slate-900">
              {isZh ? '回溯性样本的特征说明' : 'Nature of Retrospective Data'}
            </h3>
            <p className="mt-1 text-slate-600">
              {isZh
                ? '本站数据源自已被顺利录用并公开见刊的历史论文样本，反映的是该群体的历史回溯经验。不同子研究方向、文章体裁在审稿周期上可能存在自然差异。'
                : 'Our metrics reflect historical cohorts of accepted and published papers. Review duration naturally varies across specific sub-disciplines, article formats, and seasonal submission volumes.'}
            </p>
          </div>

          <div className="border-l-2 border-slate-300 pl-4 py-0.5">
            <h3 className="font-semibold text-slate-900">
              {isZh ? '同行评议的学术专业性' : 'The Value of Peer Review'}
            </h3>
            <p className="mt-1 text-slate-600">
              {isZh
                ? '严肃的同行评议是确保学术严谨性的基石，审稿专家和期刊编辑倾注了大量学术精力。具体稿件的实际处理时长取决于研究复杂度、审稿专家反馈节奏及修改质量，统计数据仅供规划参考，并非对未来处理速度的承诺。'
                : 'Thorough peer review is essential for scientific integrity, driven by dedicated volunteer reviewers and editors. Individual turnaround depends on study complexity, reviewer availability, and revision rounds; historical metrics serve as guideposts rather than service commitments.'}
            </p>
          </div>

          <div className="border-l-2 border-slate-300 pl-4 py-0.5">
            <h3 className="font-semibold text-slate-900">
              {isZh ? '建议综合参考官方投稿指南' : 'Recommended: Consult Journal Websites'}
            </h3>
            <p className="mt-1 text-slate-600">
              {isZh
                ? '我们始终建议作者在投稿前，查阅目标期刊官网的“作者须知（Instructions for Authors）”以获取编辑部发布的最新政策、审稿周期说明及格式要求。'
                : 'We always encourage authors to visit the official journal homepages and Author Guidelines for the most up-to-date editorial policies, scope descriptions, and official turnaround timelines.'}
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Friendly & Polite Contact */}
      <section id="contact" className="card-rt p-6 md:p-8 space-y-4 bg-slate-50/60">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>04</span>
          <span>{isZh ? '沟通与反馈' : 'Feedback & Inquiries'}</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {isZh ? '意见交流与持续完善' : 'Feedback & Ongoing Improvement'}
        </h2>
        <p className="text-sm leading-relaxed text-slate-600">
          {isZh
            ? 'SciManu 秉持开放、谦逊的态度为科研社区服务。如果您是科研人员、期刊编辑部或出版机构同仁，在浏览中发现任何数据需要核对、期刊分类建议，或有其他宝贵意见，非常欢迎随时与我们沟通：'
            : 'SciManu is committed to serving the scholarly community with openness and care. Whether you are a researcher, editorial board member, or publisher representative, we welcome any suggestions, corrections, or feedback you wish to share:'}
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">{isZh ? '联系邮箱：' : 'Contact Email:'}</p>
              <a
                href="mailto:support@scimanu.com"
                className="mt-1 inline-block font-mono text-base font-bold text-slate-900 hover:text-orange-700 underline underline-offset-4"
              >
                support@scimanu.com
              </a>
            </div>
            <div className="text-xs text-slate-500 sm:text-right">
              {isZh
                ? '欢迎附上相关期刊名称或 PubMed 链接，我们将认真查阅并持续优化'
                : 'Feel free to include relevant journal names or PubMed links for review'}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-sm text-slate-500">
        <Link href="/journals" className="font-semibold text-slate-700 hover:text-slate-900">
          ← {isZh ? '浏览期刊目录' : 'Explore Journal Directory'}
        </Link>
        <Link href="/statistics" className="font-semibold text-slate-700 hover:text-slate-900">
          {isZh ? '前往统计数据中心' : 'View Global Statistics'} →
        </Link>
      </div>
    </div>
  )
}
