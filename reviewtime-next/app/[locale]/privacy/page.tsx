import type { Metadata } from 'next'
import { buildLocaleAlternates } from '@/lib/seo'

const contactEmail = 'support@scimanu.com'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isZh = params.locale === 'zh'
  return {
    title: isZh ? '隐私政策 | SciManu' : 'Privacy Policy | SciManu',
    description: isZh
      ? '了解 SciManu 网站访问、偏好设置及未来广告服务相关的信息处理方式。'
      : 'Learn how SciManu handles site access, preferences, and any future advertising services.',
    alternates: buildLocaleAlternates('/privacy', params.locale),
  }
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  const isZh = params.locale === 'zh'

  return (
    <article className="mx-auto max-w-4xl space-y-7 text-slate-700">
      <header className="border-b border-slate-200/90 pb-6">
        <p className="section-eyebrow">{isZh ? '隐私与数据' : 'Privacy & Data'}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          {isZh ? '隐私政策' : 'Privacy Policy'}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {isZh ? '最后更新：2026 年 11 月 8 日' : 'Last updated: November 8, 2026'}
        </p>
        <p className="mt-4 text-sm leading-6">
          {isZh
            ? '本政策说明 SciManu 网站可能处理哪些信息、用途及联系渠道。网站数据统计基于 PubMed 书目记录，与访问者个人信息相互独立。'
            : 'This policy explains what information SciManu may process, why it is used, and how to contact us. Journal statistics are derived from PubMed bibliographic records and are separate from visitor information.'}
        </p>
      </header>

      <section className="card-rt space-y-3 p-6">
        <h2 className="text-xl font-bold text-slate-950">{isZh ? '网站当前的访问信息' : 'Information used to operate the site'}</h2>
        <p className="text-sm leading-6">
          {isZh
            ? '当前网站没有用户账户、评论或站内提交表单。侧栏折叠状态会保存在访问者浏览器的 localStorage 中（键名 rt_sidebar_collapsed），以记住界面偏好；清除浏览器存储即可删除。'
            : 'The site currently has no user accounts, comments, or on-site submission forms. The sidebar collapsed state is saved in browser localStorage under rt_sidebar_collapsed to remember this display preference; clearing browser storage removes it.'}
        </p>
        <p className="text-sm leading-6">
          {isZh
            ? '部署网站的主机或 CDN 可能为安全、故障排查和服务运行处理请求日志，例如请求时间、请求路径、IP 地址和浏览器信息。具体日志范围与保存期限取决于实际部署服务的配置。'
            : 'The site host or CDN may process request logs for security, troubleshooting, and service operation, such as request time, path, IP address, and browser information. The exact fields and retention period depend on the deployed hosting configuration.'}
        </p>
        <p className="text-sm leading-6">
          {isZh
            ? '当前应用源码未接入 Google Analytics、AdSense 或其他广告/分析脚本。若部署配置发生变化，本政策应同步更新。'
            : 'The current application source does not include Google Analytics, AdSense, or other advertising or analytics scripts. This policy should be updated if the deployed configuration changes.'}
        </p>
      </section>

      <section className="card-rt space-y-3 p-6">
        <h2 className="text-xl font-bold text-slate-950">{isZh ? 'PubMed 数据与第三方链接' : 'PubMed data and third-party links'}</h2>
        <p className="text-sm leading-6">
          {isZh
            ? '期刊时间统计由 PubMed E-utilities 可用日期汇总生成，不用于识别网站访问者。页面可能链接到 PubMed 或其他外部网站；访问这些网站时，其各自的隐私政策和设置适用。'
            : 'Journal timeline aggregates are calculated from dates available through PubMed E-utilities and are not used to identify site visitors. Pages may link to PubMed or other external sites; their own privacy policies and settings apply when you visit them.'}
        </p>
      </section>

      <section className="card-rt space-y-3 p-6">
        <h2 className="text-xl font-bold text-slate-950">{isZh ? '广告 Cookie 与个性化广告' : 'Advertising cookies and personalized ads'}</h2>
        <p className="text-sm leading-6">
          {isZh
            ? '截至本政策更新日期，SciManu 尚未在应用源码中接入 AdSense，也未展示 Google 广告。若未来启用 AdSense，第三方广告供应商（包括 Google）可能使用 Cookie、网络信标、IP 地址或其他标识符，根据用户此前访问本网站或其他网站的情况提供和衡量广告。'
            : 'As of this policy date, SciManu has not integrated AdSense in the application source and does not display Google ads. If AdSense is enabled in the future, third-party vendors, including Google, may use cookies, web beacons, IP addresses, or other identifiers to serve and measure ads based on a user’s prior visits to this or other sites.'}
        </p>
        <p className="text-sm leading-6">
          {isZh
            ? '启用个性化广告后，用户可在'
            : 'If personalized ads are enabled, users can manage them in'}{' '}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="font-semibold text-orange-700 underline underline-offset-2">
            {isZh ? 'Google 广告设置' : 'Google Ads Settings'}
          </a>
          {isZh ? '管理偏好，或通过' : ' or use'}{' '}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer" className="font-semibold text-orange-700 underline underline-offset-2">
            {isZh ? 'AboutAds.info' : 'AboutAds.info'}
          </a>
          {isZh ? '退出部分第三方个性化广告。实际合作的广告技术供应商将以启用时的配置为准，并在届时更新本政策。' : 'to opt out of some third-party personalized ads. The vendors actually used will depend on the configuration when ads are enabled, and this policy will be updated then.'}
        </p>
        <p className="text-sm leading-6">
          {isZh
            ? '如向欧洲经济区、英国或瑞士用户投放 AdSense 广告，启用前需要配置符合 Google 要求的、经过认证并集成 IAB TCF 的 CMP。'
            : 'Before serving AdSense ads to users in the EEA, UK, or Switzerland, the site must configure a Google-certified CMP integrated with the IAB TCF.'}
        </p>
      </section>

      <section className="card-rt space-y-3 p-6">
        <h2 className="text-xl font-bold text-slate-950">{isZh ? '联系与政策更新' : 'Contact and policy updates'}</h2>
        <p className="text-sm leading-6">
          {isZh ? '如有隐私相关问题或请求，请联系：' : 'For privacy questions or requests, contact:'}{' '}
          <a href={`mailto:${contactEmail}`} className="font-semibold text-orange-700 underline underline-offset-2">{contactEmail}</a>
        </p>
        <p className="text-sm leading-6">
          {isZh
            ? '我们会在网站功能、数据处理或广告配置发生变化时更新本政策，并在此页面标示修订日期。'
            : 'This policy will be revised when site features, data handling, or advertising configuration changes. The revision date will be shown on this page.'}
        </p>
      </section>
    </article>
  )
}
