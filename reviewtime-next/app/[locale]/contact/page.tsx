import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { buildLocaleAlternates } from '@/lib/seo'

const contactEmail = 'support@scimanu.com'

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isZh = params.locale === 'zh'
  return {
    title: isZh ? '联系我们 | SciManu' : 'Contact SciManu',
    description: isZh
      ? '联系 SciManu 反馈数据问题、期刊信息更正或隐私请求。'
      : 'Contact SciManu about data corrections, journal information, or privacy requests.',
    alternates: buildLocaleAlternates('/contact', params.locale),
  }
}

export default function ContactPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  const isZh = params.locale === 'zh'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="border-b border-slate-200/90 pb-6">
        <p className="section-eyebrow">{isZh ? '联系与反馈' : 'Contact & Feedback'}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          {isZh ? '联系我们' : 'Contact SciManu'}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {isZh
            ? '如果您对期刊数据、统计方法有任何疑问、发现信息偏差，或希望建议新增收录期刊，欢迎随时与我们联系。'
            : 'If you have questions about journal metrics, notice any data discrepancies, or want to suggest new journals, we would love to hear from you.'}
        </p>
      </header>

      <section className="card-rt space-y-4 p-6">
        <h2 className="text-xl font-bold text-slate-950">{isZh ? '电子邮件' : 'Email'}</h2>
        <a
          href={`mailto:${contactEmail}`}
          className="inline-flex rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition"
        >
          {contactEmail}
        </a>
        <p className="text-sm leading-6 text-slate-600">
          {isZh
            ? '为便于我们快速定位并核实，来信时建议附上相关期刊名称、ISSN 或对应的 PubMed 链接。我们通常会在 1–2 个工作日内查阅并回复。'
            : 'To help us quickly locate and verify the data, please include the relevant journal name, ISSN, or PubMed link in your message. We typically review and respond within 1–2 business days.'}
        </p>
      </section>

      <p className="text-sm text-slate-600">
        {isZh ? '数据来源与统计说明请见' : 'For data sources and methodology, see'}{' '}
        <Link href="/about" className="font-semibold text-orange-700 underline underline-offset-2">
          {isZh ? '关于与统计方法' : 'About & Methodology'}
        </Link>
        {isZh ? '；隐私保护原则请见' : '. For information about privacy and data handling, see'}{' '}
        <Link href="/privacy" className="font-semibold text-orange-700 underline underline-offset-2">
          {isZh ? '隐私政策' : 'Privacy Policy'}
        </Link>.
      </p>
    </div>
  )
}
