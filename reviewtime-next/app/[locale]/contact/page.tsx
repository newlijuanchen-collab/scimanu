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
            ? '欢迎反馈期刊名称、PubMed 日期统计或页面信息的问题，也可联系处理隐私请求和出版商更正请求。'
            : 'Contact us about journal names, PubMed date aggregates, page information, privacy requests, or publisher corrections.'}
        </p>
      </header>

      <section className="card-rt space-y-4 p-6">
        <h2 className="text-xl font-bold text-slate-950">{isZh ? '电子邮件' : 'Email'}</h2>
        <a
          href={`mailto:${contactEmail}`}
          className="inline-flex rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          {contactEmail}
        </a>
        <p className="text-sm leading-6 text-slate-600">
          {isZh
            ? '为便于核查，请在来信中附上期刊名称、PubMed 链接或 NLM ID，并说明需要更正的字段。此邮箱来自网站现有的出版商联络信息。'
            : 'For data questions, include the journal name, PubMed link or NLM ID, and the field you believe needs correction. This address is the publisher contact already listed on the site.'}
        </p>
      </section>

      <p className="text-sm text-slate-600">
        {isZh ? '数据来源与统计口径请见' : 'For data sources and methodology, see'}{' '}
        <Link href="/about" className="font-semibold text-orange-700 underline underline-offset-2">
          {isZh ? '关于与数据来源说明' : 'About & Data Provenance'}
        </Link>
        {isZh ? '；个人信息处理方式请见' : '. For information about data handling, see'}{' '}
        <Link href="/privacy" className="font-semibold text-orange-700 underline underline-offset-2">
          {isZh ? '隐私政策' : 'Privacy Policy'}
        </Link>.
      </p>
    </div>
  )
}
