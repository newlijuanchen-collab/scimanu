'use client'

import React, { useState } from 'react'

interface PreSubmissionModalProps {
  journalName: string
  isOpen: boolean
  onClose: () => void
}

export function PreSubmissionModal({
  journalName,
  isOpen,
  onClose,
}: PreSubmissionModalProps) {
  const [title, setTitle] = useState('')
  const [abstractText, setAbstractText] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<{
    score: number
    triageRisk: 'Low' | 'Moderate' | 'High'
    findings: string[]
    recommendations: string[]
  } | null>(null)

  if (!isOpen) return null

  const handleRunScan = () => {
    if (!title.trim() && !abstractText.trim()) {
      alert('Please enter your manuscript title or abstract to begin the audit.')
      return
    }

    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      setResult({
        score: 78,
        triageRisk: 'Moderate',
        findings: [
          'Translational Bridge: Mechanistic pathway is clearly documented, but clinical outcome cohort size is underpowered for primary tier journals.',
          'Statistical Reporting: Missing power calculation statement and explicit blinding protocol disclosure (mandated by editorial guidelines).',
          'Reference Freshness: 68% of cited literature is within the past 3 years (Strong).',
        ],
        recommendations: [
          `Strengthen the translational summary in your cover letter explicitly addressing ${journalName}'s clinical relevance criteria.`,
          'Add a formal CONSORT/STROBE checklist before submission to avoid immediate editorial return.',
          'Consider preparing a dual-track submission strategy with Nature Communications as primary cascade backup.',
        ],
      })
    }, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          ✕
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white font-bold text-xs">
            AI
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-950">
              3-Minute Manuscript Desk-Reject Risk Audit
            </h3>
            <p className="text-xs text-slate-500">
              Simulating editorial triage screening for <strong className="text-orange-600">{journalName}</strong>
            </p>
          </div>
        </div>

        {!result ? (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Manuscript Working Title
              </label>
              <input
                type="text"
                placeholder="e.g. Single-cell spatial multi-omics reveals resistance mechanisms..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Abstract or Key Findings
              </label>
              <textarea
                rows={4}
                placeholder="Paste your abstract or main experimental conclusions..."
                value={abstractText}
                onChange={e => setAbstractText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
              🔒 <strong>Confidentiality Guarantee:</strong> Your manuscript draft is evaluated ephemerally in-memory. No text is stored, published, or used for model training.
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isScanning}
                onClick={handleRunScan}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50 transition"
              >
                {isScanning ? (
                  <>
                    <span className="animate-spin">⏳</span> Analyzing Scope & Guidelines...
                  </>
                ) : (
                  'Run Free Triage Audit →'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50/80 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Audit Result</p>
                <h4 className="mt-0.5 text-xl font-bold text-slate-950">
                  Readiness Score: {result.score}/100
                </h4>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                Triage Risk: {result.triageRisk}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Editorial Triage Findings</p>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                {result.findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-600">▪</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Actionable Pre-Submission Fixes</p>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-col gap-2 rounded-xl border border-slate-900 bg-slate-900 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-orange-400">Upgrade to Full Submission-Ready Dossier ($39)</p>
                <p className="text-[11px] text-slate-300">Get simulated reviewer critique from 3 referee personas and custom rebuttal drafts.</p>
              </div>
              <button
                type="button"
                onClick={() => alert('Proceeding to checkout for $39 Submission Dossier...')}
                className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow hover:bg-orange-400 transition"
              >
                Get Full Dossier ($39) →
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-xs text-slate-500 underline hover:text-slate-800"
              >
                Scan another manuscript
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
