'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

interface ToolsViewProps {
  kind: 'citation' | 'impact'
}

export function ToolsView({ kind }: ToolsViewProps) {
  const t = useTranslations(`tools.${kind}`)
  const locale = useLocale()
  const isZh = locale === 'zh'

  // Calculator state for citation / timeline estimation
  const [targetMonths, setTargetMonths] = useState<number>(6)
  const estimatedDays = targetMonths * 30

  return (
    <div className="space-y-7 max-w-4xl mx-auto">
      <header className="border-b border-slate-200/90 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-100/80 px-3 py-1 text-xs font-bold text-orange-800">
          <span>🛠️</span>
          <span>{kind === 'citation' ? (isZh ? '选刊时间规划工具' : 'Submission Timeline Planner') : (isZh ? '影响因子与时效定位' : 'Impact & Speed Matrix')}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-base text-slate-600 leading-relaxed">
          {t('subtitle')}
        </p>
      </header>

      {kind === 'citation' ? (
        <div className="space-y-6">
          {/* Interactive Calculator */}
          <section className="card-rt p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-950">
              {isZh ? '🎓 结题 / 毕业倒计时发表周期规划器' : '🎓 Submission Deadline & Review Window Estimator'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {isZh
                ? '输入距离您最终接收或见刊截止日期的预留时间，系统将为您匹配合理的期刊审稿中位数区间，帮您规避长周期延期风险。'
                : 'Enter your remaining time before required acceptance. We compute the recommended median turnaround threshold to avoid delay risks.'}
            </p>

            <div className="mt-4 rounded-2xl bg-slate-50 p-5 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {isZh ? '预留发表周期（月）' : 'Target Window (Months)'}: <span className="text-orange-600 font-black text-sm">{targetMonths} {isZh ? '个月' : 'months'} (~{estimatedDays} {isZh ? '天' : 'days'})</span>
              </label>
              <input
                type="range"
                min={2}
                max={18}
                step={1}
                value={targetMonths}
                onChange={e => setTargetMonths(Number(e.target.value))}
                className="mt-3 w-full accent-orange-600 cursor-pointer"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>2 {isZh ? '个月' : 'mo'} (紧迫)</span>
                <span>6 {isZh ? '个月' : 'mo'} (典型)</span>
                <span>12 {isZh ? '个月' : 'mo'} (充裕)</span>
                <span>18 {isZh ? '个月' : 'mo'}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="text-xs font-bold text-emerald-900">
                  {isZh ? '建议投递期刊中位数门槛' : 'Recommended Median Turnaround'}
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-950">
                  ≤ {Math.round(estimatedDays * 0.65)} {isZh ? '天' : 'days'}
                </p>
                <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                  {isZh
                    ? '预留约 35% 时间用于修回实验补交与出版排版，确保在截止日前平稳录用。'
                    : 'Leaves ~35% safety margin for revision experiments and proof corrections.'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-slate-700">
                  {isZh ? '长尾安全线 (P90)' : 'Long-tail Safety Bound (P90)'}
                </p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  ≤ {estimatedDays} {isZh ? '天' : 'days'}
                </p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {isZh
                    ? '所选期刊的 90% 稿件在此天数内完成，降低沦为极慢特例的概率。'
                    : 'Ensures 90% of peer-reviewed articles complete within your deadline.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href={`/fast-review-journals?speed=${Math.round(estimatedDays * 0.65)}`}
                className="btn-primary text-xs"
              >
                {isZh ? `立即筛选中位 ≤ ${Math.round(estimatedDays * 0.65)} 天期刊 →` : `Filter Journals ≤ ${Math.round(estimatedDays * 0.65)} Days →`}
              </Link>
              <Link
                href="/compare"
                className="btn-secondary text-xs"
              >
                {isZh ? '进入横向对比工作台' : 'Open Compare Workbench'}
              </Link>
            </div>
          </section>

          {/* Guidelines */}
          <section className="card-rt p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-950">
              {isZh ? '📌 期刊发表周期评估与防延期建议' : '📌 Review Timeline Planning Guidelines'}
            </h3>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-2 leading-relaxed">
              <li>{isZh ? '不要只看期刊官网声称的“初审几周”，必须结合 PubMed 真实论文从收稿到接收（Received-to-Accepted）的中位数与 P75 区间。' : 'Do not rely only on marketed first-decision speeds; check real PubMed received-to-accepted median and P75.'}</li>
              <li>{isZh ? '若有毕业、评奖或基金结题硬性时间要求，建议优先选择样本量 N ≥ 20 且 IQR 区间窄的期刊，避免落入长尾延迟。' : 'For hard deadlines, prioritize journals with N ≥ 20 and narrow IQR ranges to avoid unpredictable tails.'}</li>
            </ul>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Impact Matrix Section */}
          <section className="card-rt p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-950">
              {isZh ? '⚖️ 影响因子与审稿时效权衡矩阵' : '⚖️ Impact Factor & Turnaround Efficiency Matrix'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {isZh
                ? '高影响因子并不一定意味着漫长的审稿。综合对比期刊影响因子、分区与真实论文录用耗时，能帮助学者制定最优投稿梯队策略。'
                : 'High impact factor does not always imply lengthy peer review. Balancing IF, quartile rankings, and true acceptance timeline yields optimal submission strategy.'}
            </p>

            <div className="grid gap-3 sm:grid-cols-3 pt-2">
              <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
                <span className="text-lg">⚡</span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">{isZh ? '极速快审通道' : 'Fast-Track High Impact'}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {isZh ? '中位数 < 60 天，适合抢先发表重大发现或时效性要求极高的竞争性研究。' : 'Median < 60 days, ideal for competitive discoveries with urgent priority.'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-lg">⏱️</span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">{isZh ? '稳健主流优选' : 'Balanced Mainstream'}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {isZh ? '中位数 60–120 天，拥有严格的同行评审与稳定的学术口碑，预期周期透明。' : 'Median 60–120 days, disciplined peer review with stable academic reputation.'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-lg">⏳</span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">{isZh ? '深度长线大刊' : 'Long-Cycle Flags'}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {isZh ? '中位数 > 150 天，通常包含多轮深度实验验证与仲裁，建议预留充裕时间。' : 'Median > 150 days, usually requires extensive validation and multiple revisions.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/journals" className="btn-primary text-xs">
                {isZh ? '进入跨学科期刊库探索 →' : 'Explore Journal Directory →'}
              </Link>
              <Link href="/statistics" className="btn-secondary text-xs">
                {isZh ? '查看学术大盘统计分析' : 'View Global Statistics'}
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}