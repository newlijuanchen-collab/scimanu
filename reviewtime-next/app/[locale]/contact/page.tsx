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
    title: isZh ? '致作者与学界朋友的一封信' : 'A Welcome Letter to Authors & Scholars',
    description: isZh
      ? 'SciManu 致学术作者与科研工作者：透明呈现审稿周期与发表指标，欢迎与我们随时交流。'
      : 'A welcome note from the SciManu team to researchers and authors worldwide.',
    alternates: buildLocaleAlternates('/contact', params.locale),
  }
}

export default function ContactPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  const isZh = params.locale === 'zh'

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <header className="border-b border-slate-200/90 pb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
          {isZh ? '团队来信 · 欢迎与交流' : 'Welcome Note · Community & Contact'}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
          {isZh ? '致学术作者与科研朋友的一封信' : 'A Welcome Letter to Authors & Scholars'}
        </h1>
      </header>

      {/* Humble, warm official welcome letter */}
      <article className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-10 space-y-6 text-slate-700 leading-relaxed text-[15px]">
        <p className="font-semibold text-slate-900">
          {isZh ? '尊敬的科研同仁、青年学者与作者朋友们：' : 'Dear researchers, authors, and scholars,'}
        </p>

        <p>
          {isZh
            ? '您好。每一篇沉甸甸的学术手稿背后，往往凝聚着数月乃至数年日夜兼程的探索、不计其数的实验验证与反复推敲。学术探索本就充满挑战，而投稿发表过程中漫长而未知的时间周期，更常常让研究者们在等待中耗费宝贵的学术心力。'
            : 'Every scientific manuscript represents countless hours of rigorous inquiry, meticulous experimentation, and dedicated focus. The research journey is inherently demanding, and the uncertainty surrounding journal review timelines often adds undue anxiety to the publication process.'}
        </p>

        <p>
          {isZh
            ? 'SciManu 的初衷极为朴素：我们希望通过对公开文献客观事实日期的挖掘，构建一个真实、透明的期刊审稿与发表数据参照系，为学术界提供兼具客观经验与官方口径的对照参考，帮助每一位作者在规划投稿时多一份从容与确信。'
            : 'Our mission at SciManu is straightforward: to bring clarity and transparency to academic publishing by extracting empirical submission milestones from public literature and presenting them alongside official journal benchmarks. We aim to help authors navigate journal selection with confidence and empirical clarity.'}
        </p>

        <p>
          {isZh
            ? '作为一个持续生长的学术数据项目，我们深知目前还有诸多不完善之处。无论您是有宝贵的意见建议、学术交流探讨，还是希望与我们团队沟通学术期刊相关议题，我们都怀着由衷的敬意，随时期待您的来信。'
            : 'As an evolving academic initiative, we remain deeply humble and continually strive to refine our datasets. Whether you have insights, constructive suggestions, or would like to discuss academic publishing and manuscript evaluation, our team would be honored to hear from you.'}
        </p>

        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              {isZh ? '联系与交流邮箱' : 'Direct Inquiries'}
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-1 inline-block text-lg font-bold text-orange-700 hover:text-orange-800 hover:underline"
            >
              {contactEmail}
            </a>
          </div>
          <div className="text-right sm:text-right">
            <p className="text-xs text-slate-400">
              {isZh ? '愿每一次严谨探索皆得适时发表' : 'With sincere respect for your research'}
            </p>
            <p className="mt-1 font-serif text-base font-semibold text-slate-900">
              — SciManu Editorial & Engineering Team
            </p>
          </div>
        </div>
      </article>

      <p className="text-center text-xs text-slate-500">
        {isZh ? '查阅数据统计方法可浏览' : 'Learn more about our methodology at'}{' '}
        <Link href="/about" className="font-semibold text-orange-700 hover:underline">
          {isZh ? '关于与方法学' : 'About & Methodology'}
        </Link>
        {isZh ? '，或查阅' : ' and '}{' '}
        <Link href="/privacy" className="font-semibold text-orange-700 hover:underline">
          {isZh ? '隐私政策' : 'Privacy Policy'}
        </Link>。
      </p>
    </div>
  )
}
