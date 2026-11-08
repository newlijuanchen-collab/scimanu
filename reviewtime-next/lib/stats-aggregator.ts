import type { JournalStats } from '@/lib/types'
import { getJournalSlug } from '@/lib/journal-slug'

export interface PublisherSummary {
  name: string
  key: string
  count: number
  median: number
  p25: number
  p75: number
  fastestMedian: number
  triageDays: number
  badge: string
  badgeEn: string
  badgeZh: string
  description: string
}

export interface DisciplineSummary {
  discipline: string
  disciplineZh: string
  count: number
  median: number
  p25: number
  p75: number
  fastestJournal?: {
    name: string
    slug: string
    median: number
  }
}

export interface SpeedTierInfo {
  key: 'fast' | 'standard' | 'extended' | 'longer'
  label: string
  labelZh: string
  range: string
  count: number
  percentage: number
  advice: string
  adviceZh: string
  color: string
  bgColor: string
  borderColor: string
}

export function isValidPeerReviewedJournal(journal: JournalStats): boolean {
  // Real peer-reviewed original research requires at least 20 days
  if (!journal.median || journal.median < 20) return false
  // Exclude non-academic trade magazines, digests, news
  const name = (journal.label || '').toLowerCase()
  const excludedKeywords = [
    'bijzijn',
    'huisarts',
    'rheuma plus',
    'magazin',
    'briefing',
    'newsletter',
    'practice update',
    'klinik',
    'reports', // when median is tiny
  ]
  if (journal.median < 25 && excludedKeywords.some(bad => name.includes(bad))) {
    return false
  }
  // Exclude collapsed distributions with 0 IQR that are batch editorial uploads
  if (journal.p75 - journal.p25 < 3 && journal.median < 30) {
    return false
  }
  return true
}

export function inferDiscipline(name: string): { en: string; zh: string; icon: string } {
  const n = name.toLowerCase()
  if (
    /medic|clinic|surg|canc|oncol|pharm|health|immun|cardio|pediatr|neuro|dent|pathol|diseas|radiat|therap|epidemiol|nurs/.test(
      n,
    )
  ) {
    return { en: 'Medicine & Health', zh: '医学与临床健康', icon: '🩺' }
  }
  if (/bio|cell|gene|genet|microbi|plant|botan|zoolog|ecol|physiol|neurosci|biochem|biotech|genom/.test(n)) {
    return { en: 'Biology & Life Sciences', zh: '生物与生命科学', icon: '🧬' }
  }
  if (/comput|software|artific|intel|inform|data|network|robot|electr|cyber|algorithm|machine/.test(n)) {
    return { en: 'Computer Science & AI', zh: '计算机与人工智能', icon: '💻' }
  }
  if (/engin|mechan|civil|struct|mater|nano|manufactur|aerosp|automot|energy|sensor/.test(n)) {
    return { en: 'Engineering & Materials', zh: '工程与材料技术', icon: '⚙️' }
  }
  if (/chem|molecul|polymer|catalys|spectro|organ|inorgan/.test(n)) {
    return { en: 'Chemistry & Molecular', zh: '化学与分子科学', icon: '🧪' }
  }
  if (/physic|optic|laser|astron|geophys|quantum|nuclear|plasma/.test(n)) {
    return { en: 'Physics & Optics', zh: '物理与光学天文', icon: '📐' }
  }
  if (/environ|earth|geol|ocean|climat|meteor|water|soil|forest/.test(n)) {
    return { en: 'Earth & Environmental', zh: '地球与环境生态', icon: '🪐' }
  }
  return { en: 'Multidisciplinary & Interdisciplinary', zh: '综合与交叉科学', icon: '🌐' }
}

function medianOf(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

function quantileOf(arr: number[], q: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return Math.round(sorted[base] + rest * (sorted[base + 1] - sorted[base]))
  }
  return sorted[base]
}

export function computeSpeedTiers(journals: JournalStats[]): SpeedTierInfo[] {
  let fast = 0
  let standard = 0
  let extended = 0
  let longer = 0
  const total = journals.length || 1

  journals.forEach(j => {
    const m = j.median || 0
    if (m < 60) fast++
    else if (m <= 120) standard++
    else if (m <= 200) extended++
    else longer++
  })

  return [
    {
      key: 'fast',
      label: 'Under 60 Days',
      labelZh: '小于 60 天',
      range: '< 60 days',
      count: fast,
      percentage: Math.round((fast / total) * 1000) / 10,
      advice: 'Share of journals whose median falls in this duration range.',
      adviceZh: '此区间内期刊的数量占比。',
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    },
    {
      key: 'standard',
      label: '60–120 Days',
      labelZh: '60–120 天',
      range: '60–120 days',
      count: standard,
      percentage: Math.round((standard / total) * 1000) / 10,
      advice: 'Share of journals whose median falls in this duration range.',
      adviceZh: '此区间内期刊的数量占比。',
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    },
    {
      key: 'extended',
      label: '120–200 Days',
      labelZh: '120–200 天',
      range: '120–200 days',
      count: extended,
      percentage: Math.round((extended / total) * 1000) / 10,
      advice: 'Share of journals whose median falls in this duration range.',
      adviceZh: '此区间内期刊的数量占比。',
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    },
    {
      key: 'longer',
      label: 'Over 200 Days',
      labelZh: '超过 200 天',
      range: '> 200 days',
      count: longer,
      percentage: Math.round((longer / total) * 1000) / 10,
      advice: 'Share of journals whose median falls in this duration range.',
      adviceZh: '此区间内期刊的数量占比。',
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    },
  ]
}

export function computePublisherBenchmarks(journals: JournalStats[]): PublisherSummary[] {
  const groups: Record<string, number[]> = {
    'MDPI': [],
    'Frontiers': [],
    'SpringerLink': [],
    'Nature Portfolio': [],
    'PLOS': [],
    'Cell Press': [],
  }

  journals.forEach(j => {
    const src = (j.source_display || j.publisher || '').trim()
    for (const key of Object.keys(groups)) {
      if (src.toLowerCase().includes(key.toLowerCase()) && j.median) {
        groups[key].push(j.median)
        break
      }
    }
  })

  const metadata: Record<string, { badgeEn: string; badgeZh: string; triage: number; desc: string }> = {
    'MDPI': {
      badgeEn: 'Rapid OA',
      badgeZh: '极速开放获取',
      triage: 3,
      desc: 'Known for high editorial automation and quick initial peer review (~3-5 days triage).',
    },
    'Frontiers': {
      badgeEn: 'Interactive Review',
      badgeZh: '协作互动审稿',
      triage: 8,
      desc: 'Collaborative review forum format; typical turnaround around 2–3 months.',
    },
    'SpringerLink': {
      badgeEn: 'Broad Scope',
      badgeZh: '传统学术集群',
      triage: 9,
      desc: 'Vast disciplinary breadth; handles thousands of traditional peer-reviewed societies.',
    },
    'Nature Portfolio': {
      badgeEn: 'High-Impact Selective',
      badgeZh: '顶尖学术遴选',
      triage: 4,
      desc: 'Fast 4-day desk triage (90%+ barrier), followed by rigorous multi-round validation.',
    },
    'PLOS': {
      badgeEn: 'Open Science Standards',
      badgeZh: '开放科学标准',
      triage: 9,
      desc: 'Emphasizes technical validity and data availability over speculative novelty.',
    },
    'Cell Press': {
      badgeEn: 'Life Sciences Flagship',
      badgeZh: '生命科学旗舰',
      triage: 5,
      desc: 'Demanding mechanistic validation; median cycle around 6 months.',
    },
  }

  return Object.entries(groups)
    .filter(([, medians]) => medians.length > 0)
    .map(([name, medians]) => {
      const sorted = [...medians].sort((a, b) => a - b)
      const meta = metadata[name] ?? {
        badgeEn: 'Academic Group',
        badgeZh: '学术出版方',
        triage: 7,
        desc: 'Academic publishing',
      }
      return {
        name,
        key: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        count: medians.length,
        median: medianOf(medians),
        p25: quantileOf(medians, 0.25),
        p75: quantileOf(medians, 0.75),
        fastestMedian: sorted[0] || 0,
        triageDays: meta.triage,
        badge: meta.badgeEn,
        badgeEn: meta.badgeEn,
        badgeZh: meta.badgeZh,
        description: meta.desc,
      }
    })
    .sort((a, b) => a.median - b.median)
}

export function computeDisciplineBenchmarks(journals: JournalStats[]): DisciplineSummary[] {
  const map = new Map<string, { en: string; zh: string; medians: number[]; fastest?: { name: string; slug: string; median: number } }>()

  journals.forEach(j => {
    if (!j.median) return
    const { en, zh } = inferDiscipline(j.label)
    if (!map.has(en)) {
      map.set(en, { en, zh, medians: [] })
    }
    const entry = map.get(en)!
    entry.medians.push(j.median)
    if (!entry.fastest || j.median < entry.fastest.median) {
      if (j.count >= 20 && isValidPeerReviewedJournal(j)) {
        entry.fastest = { name: j.label, slug: getJournalSlug(j.label, j.journal_key), median: j.median }
      }
    }
  })

  return Array.from(map.values())
    .map(item => ({
      discipline: item.en,
      disciplineZh: item.zh,
      count: item.medians.length,
      median: medianOf(item.medians),
      p25: quantileOf(item.medians, 0.25),
      p75: quantileOf(item.medians, 0.75),
      fastestJournal: item.fastest,
    }))
    .sort((a, b) => a.median - b.median)
}
