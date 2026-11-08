import type { Metadata } from 'next'
import { buildLocaleAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isZh = params.locale === 'zh'

  return {
    title: isZh ? '关于与数据来源合规说明 | SciManu' : 'About & Data Provenance | SciManu',
    description: isZh
      ? '了解 SciManu 如何依据 PubMed E-utilities 可用的书目信息和日期字段，计算期刊级时间统计及其局限。'
      : 'Learn how SciManu summarizes journal timelines from dates available through PubMed E-utilities and what the aggregates can and cannot show.',
    alternates: buildLocaleAlternates('/about', params.locale),
  }
}

export default function AboutPage({ params }: { params: { locale: string } }) {
  const isZh = params.locale === 'zh'

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <header className="border-b border-slate-200/90 pb-7">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-100/80 px-3 py-1 text-xs font-bold text-orange-800">
          <span>🏛️</span>
          <span>{isZh ? '数据来源与学术合规说明' : 'Data Provenance & Compliance Statement'}</span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          {isZh ? '关于 SciManu 与数据合规准则' : 'About SciManu & Data Provenance'}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          {isZh
            ? 'SciManu 是一项独立的期刊时间统计服务，依据 PubMed 中可用的公开书目信息计算期刊级时间指标，为研究者提供历史样本参考。'
            : 'SciManu is an independent journal timeline service that calculates journal-level metrics from bibliographic dates available in PubMed and provides historical sample references for researchers.'}
        </p>
      </header>

      {/* Section 1: Provenance from PubMed */}
      <section className="card-rt p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-700 font-bold text-sm">
            01
          </span>
          <h2 className="text-xl font-bold text-slate-950">
            {isZh ? '数据来源：PubMed E-utilities' : 'Data source: PubMed E-utilities'}
          </h2>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          {isZh
            ? '当前时间统计依据美国国家医学图书馆（NLM）的 PubMed 书目记录，通过 NCBI E-utilities EFetch 获取；本试点仅覆盖页面列出的所选生物医学期刊。'
            : 'Current timeline statistics use PubMed bibliographic records retrieved through NCBI E-utilities EFetch, operated by the U.S. National Library of Medicine (NLM). This pilot covers only the selected biomedical journals listed on the site.'}
        </p>
        <p className="text-sm leading-6 text-slate-600">
          {isZh
            ? '系统只使用 PubMed 记录中可用的 Received、Revised、Accepted 等日期字段计算聚合耗时。修回日期并非每条记录都有，缺少日期的阶段不会显示统计；修回日期也不代表完整的审稿轮次。'
            : 'The pipeline uses available Received, Revised, and Accepted date fields in PubMed records to calculate aggregate durations. Revised dates are absent from many records, so stages without usable dates are omitted; revised dates do not represent complete review rounds.'}
        </p>
      </section>

      {/* Section 2: Zero Copyright Metadata Exposure */}
      <section className="card-rt p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">
            02
          </span>
          <h2 className="text-xl font-bold text-slate-950">
            {isZh ? '数据展示范围与内容使用' : 'Data Display Scope & Content Use'}
          </h2>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          {isZh
            ? '网站展示的是 PubMed 日期字段计算出的期刊和月份级聚合统计，不提供论文全文或文章级投稿日期：'
            : 'The site presents journal- and month-level aggregates calculated from PubMed date fields. It does not provide article full text or article-level submission dates:'}
        </p>
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-xs leading-5 text-slate-700 space-y-2">
          <p className="font-bold text-slate-900">
              {isZh ? '展示边界：' : 'Display boundaries:'}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>
              <strong className="text-slate-800">{isZh ? '不展示论文正文：' : 'No Full-Text Display: '}</strong>
              {isZh
                ? '网站页面不展示论文摘要、正文段落、实验图表或补充材料。'
                : 'Public pages do not display abstracts, full-text passages, figures, or supplemental materials.'}
            </li>
            <li>
              <strong className="text-slate-800">{isZh ? '杜绝单篇个案反查：' : 'No Single-Article Tracking: '}</strong>
              {isZh
                ? '前端界面不展示单篇论文标题、作者名单、隶属机构、DOI 或具体投稿日历，仅提供群体宏观时效指标。'
                : 'Our public interface never displays individual paper titles, author rosters, affiliations, DOIs, or exact submission calendar dates.'}
            </li>
            <li>
              <strong className="text-slate-800">{isZh ? '聚合统计指标：' : 'Aggregated Statistics: '}</strong>
              {isZh
                ? '对外展示按期刊和月份汇总的中位数、P25–P75 区间、P90 耗时和样本量，不公开单篇文章的日期记录。'
                : 'Published values are journal- and month-level medians, P25–P75 ranges, P90 durations, and sample counts. Individual article date records are not displayed.'}
            </li>
            <li>
              <strong className="text-slate-800">{isZh ? '无期刊隶属或背书：' : 'No Journal Affiliation or Endorsement: '}</strong>
              {isZh
                ? 'SciManu 与所列期刊及出版商没有隶属或背书关系。统计只反映 PubMed 中日期信息可用的已发表样本，不代表期刊对所有投稿的服务承诺。'
                : 'SciManu is not affiliated with or endorsed by the listed journals or publishers. Statistics describe published records with usable PubMed dates and are not service guarantees for all submissions.'}
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3: Publishing Authority definition */}
      <section className="card-rt p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-700 font-bold text-sm">
            03
          </span>
          <h2 className="text-xl font-bold text-slate-950">
            {isZh ? '出版集团分类与统计口径说明' : 'Publisher Classification & Editorial Disclaimers'}
          </h2>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          {isZh
            ? '当前筛选器中的期刊及来源标签依据本次 PubMed 试点整理的期刊信息；标签用于检索和分组，不代表出版商对统计结果的认可。'
            : 'Journal and source labels in current filters are based on the selected PubMed pilot metadata. They support search and grouping and do not imply publisher endorsement of the statistics.'}
        </p>
        <p className="text-sm leading-6 text-slate-600">
          {isZh
            ? '特别免责说明：统计所反映的“投稿至录用（Received to Accepted）”仅代表已成功录用并公开发表的历史论文样本，不代表期刊官方的合同保证或服务水平承诺（SLA）。每篇论文的审稿时长均受稿件质量、审稿人响应速度、同行评议轮次及修改要求等多重变量影响。'
            : 'Editorial Disclaimer: "Received to Accepted" timelines represent historical cohorts of successfully accepted and published manuscripts. They do not constitute official turnaround guarantees, service level agreements (SLAs), or binding commitments by any journal or editorial board. Actual turnaround varies based on paper complexity, reviewer availability, and editorial decisions.'}
        </p>
      </section>

      {/* Section 4: Journal and publisher identification */}
      <section className="card-rt p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">
            04
          </span>
          <h2 className="text-xl font-bold text-slate-950">
            {isZh ? '期刊名称与出版商标识' : 'Journal Names & Publisher Identification'}
          </h2>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          {isZh
            ? '期刊名称和出版商名称用于识别 PubMed 记录中的期刊，不表示 SciManu 与相关期刊或出版商存在隶属、赞助、合作或背书关系。'
            : 'Journal and publisher names identify journals in PubMed records. Their use does not imply affiliation, sponsorship, partnership, or endorsement by the journals or publishers.'}
        </p>
        <p className="text-sm leading-6 text-slate-600">
          {isZh
            ? '我们不访问需要登录的出版商平台或内部审稿管理系统。当前时间数据来自 PubMed 书目记录，不是从出版商审稿系统中提取。'
            : 'SciManu does not access password-protected publisher portals or editorial management systems. Current timeline inputs are PubMed bibliographic records retrieved through NCBI E-utilities; they are not extracted from publisher review systems.'}
        </p>
      </section>

      {/* Section 5: Notice & Takedown / Publisher Contact */}
      <section id="contact" className="card-rt p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">
            05
          </span>
          <h2 className="text-xl font-bold text-slate-950">
            {isZh ? '出版商与编辑部沟通通道' : 'Publisher Inquiries & Direct Collaboration'}
          </h2>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          {isZh
            ? '如您发现期刊名称、PubMed 记录或页面统计存在问题，或需要提交出版商更正请求，请通过以下邮箱联系我们：'
            : 'Contact us if you find an issue with a journal name, PubMed record, or displayed aggregate, or if you need to submit a publisher correction request:'}
        </p>
        <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-4 text-xs leading-5 text-blue-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-bold text-blue-950">{isZh ? '出版机构专属联络邮箱：' : 'Editorial & Compliance Desk:'}</p>
            <a href="mailto:compliance@reviewtime.org" className="mt-0.5 block font-mono text-sm font-semibold text-blue-800 underline underline-offset-2">compliance@reviewtime.org</a>
            <p className="text-[11px] text-blue-700 mt-1">
              {isZh ? '请在来信中附上期刊名称、PubMed 链接或 NLM ID，以及需要核对的内容。' : 'Please include the journal name, PubMed link or NLM ID, and the information you would like us to review.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
