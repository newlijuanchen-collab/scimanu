/**
 * data-loader.js
 * Phase 1 data access layer:
 * 1. Prefer static JSON snapshots under web/data/
 * 2. Use local XLSX fallback only in local development
 */

const DataLoader = (() => {
  let _rows = null;
  let _journals = null;
  let _stats = null;
  let _trendBySlug = null;
  let _mode = null;

  const MIN_DAYS = 1;
  const MAX_DAYS = 1000;

  function rootPrefix() {
    return window.location.pathname.includes('/tools/') ? '../' : '';
  }

  function resolveSnapshotUrl(fileName) {
    return new URL(`${rootPrefix()}data/${fileName}`, window.location.href).toString();
  }

  function resolveXlsxUrl() {
    return new URL(`${rootPrefix()}data.xlsx`, window.location.href).toString();
  }

  function percentile(sorted, p) {
    if (!sorted || sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0];
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
  }

  function median(sorted) {
    return percentile(sorted, 50);
  }

  function toYM(dateVal) {
    if (!dateVal) return null;
    let d;
    if (dateVal instanceof Date) d = dateVal;
    else if (typeof dateVal === 'number') d = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    else d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function parseDate(val) {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') return new Date(Math.round((val - 25569) * 86400 * 1000));
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  function speedLabel(days) {
    if (days <= 30) return { label: '极快', color: '#2b8a3e', cls: 'text-green' };
    if (days <= 60) return { label: '快速', color: '#2fb344', cls: 'text-success' };
    if (days <= 90) return { label: '正常偏快', color: '#94d82d', cls: 'text-lime' };
    if (days <= 120) return { label: '正常', color: '#f59f00', cls: 'text-yellow' };
    if (days <= 180) return { label: '偏慢', color: '#f76707', cls: 'text-orange' };
    return { label: '慢速', color: '#d63939', cls: 'text-danger' };
  }

  async function fetchJson(url) {
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
    return resp.json();
  }

  async function fetchXLSX(url) {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS is not available for XLSX fallback');
    }
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
    const ab = await resp.arrayBuffer();
    const workbook = XLSX.read(ab, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: null });
  }

  function hydrateJournal(rawJournal, timeSeries) {
    const ts = Array.isArray(timeSeries) ? timeSeries : [];
    const byYM = {};
    ts.forEach(item => {
      byYM[item.ym] = {
        count: Number(item.count ?? 0),
        median: Number(item.median ?? 0),
        p25: Number(item.p25 ?? 0),
        p75: Number(item.p75 ?? 0),
      };
    });
    return {
      slug: rawJournal.slug,
      label: rawJournal.label,
      name: rawJournal.name || rawJournal.label,
      issn: rawJournal.issn || '',
      publisher: rawJournal.publisher || 'Unknown',
      subject: rawJournal.subject || 'Unknown',
      count: Number(rawJournal.count ?? 0),
      median: Number(rawJournal.median ?? 0),
      p25: Number(rawJournal.p25 ?? 0),
      p75: Number(rawJournal.p75 ?? 0),
      iqr: Number(rawJournal.iqr ?? (Number(rawJournal.p75 ?? 0) - Number(rawJournal.p25 ?? 0))),
      min: Number(rawJournal.min ?? 0),
      max: Number(rawJournal.max ?? 0),
      trend: Number(rawJournal.trend ?? 0),
      med3: rawJournal.med3 ?? null,
      med6: rawJournal.med6 ?? null,
      med12: rawJournal.med12 ?? null,
      med24: rawJournal.med24 ?? null,
      revisionShare: rawJournal.revisionShare ?? null,
      medianRevToAccept: rawJournal.medianRevToAccept ?? null,
      coverageStart: rawJournal.coverageStart ?? null,
      coverageEnd: rawJournal.coverageEnd ?? null,
      confidenceMedian: rawJournal.confidenceMedian ?? null,
      sourceMix: rawJournal.sourceMix ?? {},
      generatedAt: rawJournal.generatedAt ?? null,
      byYM,
      timeSeries: ts,
      articles: [],
    };
  }

  async function loadFromSnapshots() {
    const [summary, globalTimeSeries, journalRows, trendBySlug] = await Promise.all([
      fetchJson(resolveSnapshotUrl('global-summary.json')),
      fetchJson(resolveSnapshotUrl('global-trend.json')),
      fetchJson(resolveSnapshotUrl('journals.json')),
      fetchJson(resolveSnapshotUrl('journal-trend.json')),
    ]);

    _trendBySlug = trendBySlug || {};
    _journals = (journalRows || [])
      .map(j => hydrateJournal(j, _trendBySlug[j.slug] || []))
      .sort((a, b) => a.median - b.median);

    const publishers = Array.isArray(summary.publishers) && summary.publishers.length
      ? summary.publishers
      : [...new Set(_journals.map(j => j.publisher).filter(Boolean))].sort();
    const subjects = Array.isArray(summary.subjects) && summary.subjects.length
      ? summary.subjects
      : [...new Set(_journals.map(j => j.subject).filter(Boolean))].sort();

    const fastest = _journals.find(j => j.slug === summary.fastestSlug) || _journals[0] || null;

    _stats = {
      generatedAt: summary.generatedAt || null,
      totalJournals: Number(summary.totalJournals ?? _journals.length),
      totalArticles: Number(summary.totalArticles ?? 0),
      globalMedian: Number(summary.globalMedian ?? 0),
      globalP25: Number(summary.globalP25 ?? 0),
      globalP75: Number(summary.globalP75 ?? 0),
      publishers,
      subjects,
      globalTimeSeries: Array.isArray(globalTimeSeries) ? globalTimeSeries : [],
      fastest,
    };

    _rows = [];
    _mode = 'snapshot';
    return { rows: _rows, journals: _journals, stats: _stats };
  }

  function cleanRows(rows) {
    return rows
      .map(r => {
        const days = Number(
          r.days_received_to_accepted ??
          r['Days Received→Accepted'] ??
          r.days_review ?? 0
        );
        return {
          journal_name: String(r.journal_name ?? r['Journal Name'] ?? r.journal ?? '').trim(),
          journal_label: String(r.journal_label ?? r['Journal Label'] ?? r.journal_abbr ?? r.journal_name ?? r['Journal Name'] ?? '').trim(),
          issn: String(r.issn ?? r['ISSN'] ?? '').trim(),
          publisher: String(r.publisher ?? r['Publisher'] ?? 'Unknown').trim(),
          subject: String(r.subject ?? r['Subject'] ?? r.category ?? 'General').trim(),
          received_date: parseDate(r.received_date ?? r['Received Date'] ?? r.received),
          accepted_date: parseDate(r.accepted_date ?? r['Accepted Date'] ?? r.accepted),
          online_date: parseDate(r.online_date ?? r['Online Date'] ?? r.published),
          days,
          status: String(r.extraction_status ?? r['Status'] ?? 'ok').trim(),
          confidence: Number(r.confidence_score ?? r['Confidence'] ?? 1.0),
          doi: String(r.doi ?? r['DOI'] ?? '').trim(),
          title: String(r.title ?? r['Title'] ?? '').trim(),
        };
      })
      .filter(r => {
        if (!r.journal_label && !r.journal_name) return false;
        if (!r.journal_label) r.journal_label = r.journal_name;
        if (r.days < MIN_DAYS || r.days > MAX_DAYS) return false;
        return true;
      });
  }

  function aggregateByJournal(rows) {
    const map = new Map();
    rows.forEach(r => {
      const key = r.journal_label || r.journal_name;
      if (!map.has(key)) {
        map.set(key, {
          label: key,
          name: r.journal_name || key,
          issn: r.issn,
          publisher: r.publisher,
          subject: r.subject,
          days: [],
          byYM: {},
          articles: [],
          slug: key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'journal',
        });
      }
      const entry = map.get(key);
      entry.days.push(r.days);
      entry.articles.push(r);
      const ym = toYM(r.accepted_date) || toYM(r.received_date);
      if (ym) {
        if (!entry.byYM[ym]) entry.byYM[ym] = [];
        entry.byYM[ym].push(r.days);
      }
    });

    const result = [];
    map.forEach((entry, key) => {
      const sorted = [...entry.days].sort((a, b) => a - b);
      const byYMStats = {};
      Object.entries(entry.byYM).forEach(([ym, vals]) => {
        const s = [...vals].sort((a, b) => a - b);
        byYMStats[ym] = {
          count: s.length,
          median: Math.round(median(s)),
          p25: Math.round(percentile(s, 25)),
          p75: Math.round(percentile(s, 75)),
        };
      });
      const now = new Date();
      const cutoff6 = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const cutoff24 = new Date(now.getFullYear(), now.getMonth() - 24, 1);
      const recent6 = entry.articles.filter(a => a.accepted_date && a.accepted_date >= cutoff6).map(a => a.days).sort((a, b) => a - b);
      const recent24 = entry.articles.filter(a => a.accepted_date && a.accepted_date >= cutoff24).map(a => a.days).sort((a, b) => a - b);
      const med6 = recent6.length >= 3 ? Math.round(median(recent6)) : null;
      const med24 = recent24.length >= 3 ? Math.round(median(recent24)) : null;
      const trend = (med6 !== null && med24 !== null) ? med6 - med24 : 0;
      result.push({
        slug: entry.slug,
        label: key,
        name: entry.name,
        issn: entry.issn,
        publisher: entry.publisher,
        subject: entry.subject,
        count: sorted.length,
        median: Math.round(median(sorted)),
        p25: Math.round(percentile(sorted, 25)),
        p75: Math.round(percentile(sorted, 75)),
        iqr: Math.round(percentile(sorted, 75) - percentile(sorted, 25)),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        byYM: byYMStats,
        timeSeries: Object.entries(byYMStats).sort(([a], [b]) => a.localeCompare(b)).map(([ym, s]) => ({ ym, ...s })),
        trend,
        med3: null,
        med6,
        med12: null,
        med24,
        articles: entry.articles,
      });
    });
    return result.sort((a, b) => a.median - b.median);
  }

  function computeGlobalStats(rows, journals) {
    const allDays = rows.map(r => r.days).sort((a, b) => a - b);
    const publishers = [...new Set(rows.map(r => r.publisher).filter(Boolean))].sort();
    const subjects = [...new Set(rows.map(r => r.subject).filter(Boolean))].sort();
    const globalByYM = {};
    rows.forEach(r => {
      const ym = toYM(r.accepted_date) || toYM(r.received_date);
      if (!ym) return;
      if (!globalByYM[ym]) globalByYM[ym] = [];
      globalByYM[ym].push(r.days);
    });
    const globalTimeSeries = Object.entries(globalByYM)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, vals]) => {
        const s = [...vals].sort((a, b) => a - b);
        return {
          ym,
          count: s.length,
          median: Math.round(median(s)),
          p25: Math.round(percentile(s, 25)),
          p75: Math.round(percentile(s, 75)),
        };
      });
    return {
      generatedAt: null,
      totalJournals: journals.length,
      totalArticles: rows.length,
      globalMedian: Math.round(median(allDays)),
      globalP25: Math.round(percentile(allDays, 25)),
      globalP75: Math.round(percentile(allDays, 75)),
      publishers,
      subjects,
      globalTimeSeries,
      fastest: journals[0] || null,
    };
  }

  async function loadFromXlsx() {
    const raw = await fetchXLSX(resolveXlsxUrl());
    _rows = cleanRows(raw);
    _journals = aggregateByJournal(_rows);
    _stats = computeGlobalStats(_rows, _journals);
    _trendBySlug = Object.fromEntries(_journals.map(j => [j.slug, j.timeSeries]));
    _mode = 'xlsx';
    return { rows: _rows, journals: _journals, stats: _stats };
  }

  async function load(forceReload = false) {
    if (_journals && _stats && !forceReload) {
      return { rows: _rows || [], journals: _journals, stats: _stats };
    }
    try {
      return await loadFromSnapshots();
    } catch (snapshotErr) {
      const isLocalDev = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
      if (!isLocalDev) {
        throw new Error(`Snapshot loading failed: ${snapshotErr.message}`);
      }
      try {
        return await loadFromXlsx();
      } catch (xlsxErr) {
        throw new Error(`Snapshot and local XLSX fallback both failed. Snapshot error: ${snapshotErr.message}; XLSX error: ${xlsxErr.message}`);
      }
    }
  }

  function getJournalBySlug(slug) {
    if (!_journals) return null;
    return _journals.find(j => j.slug === slug) || null;
  }

  function getJournalByIssn(issn) {
    if (!_journals) return null;
    return _journals.find(j => (j.issn || '') === (issn || '')) || null;
  }

  async function getJournalArticles() {
    return [];
  }

  function filterJournals(journals, { publishers = [], subjects = [], minCount = 1, maxMedian = Infinity, minMedian = 0 } = {}) {
    return journals.filter(j => {
      if (j.count < minCount) return false;
      if (j.median < minMedian || j.median > maxMedian) return false;
      if (publishers.length && !publishers.includes(j.publisher)) return false;
      if (subjects.length && !subjects.includes(j.subject)) return false;
      return true;
    });
  }

  function getMode() {
    return _mode;
  }

  return { load, getJournalBySlug, getJournalByIssn, getJournalArticles, filterJournals, percentile, median, speedLabel, toYM, getMode };
})();

window.DataLoader = DataLoader;
