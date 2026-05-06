/**
 * charts.js
 * ECharts configuration factory for ReviewTime visualizations.
 * All functions return ECharts option objects; call ec.setOption(option) yourself.
 */

const Charts = (() => {

  // ── Colour helpers ───────────────────────────────────────────────────────────

  const SPEED_COLORS = ['#2b8a3e','#2fb344','#94d82d','#f59f00','#f76707','#d63939'];

  function speedColor(days) {
    if (days <= 30)  return SPEED_COLORS[0];
    if (days <= 60)  return SPEED_COLORS[1];
    if (days <= 90)  return SPEED_COLORS[2];
    if (days <= 120) return SPEED_COLORS[3];
    if (days <= 180) return SPEED_COLORS[4];
    return SPEED_COLORS[5];
  }

  const PALETTE = [
    '#206bc4','#2fb344','#f76707','#d63939','#ae3ec9',
    '#0ca678','#f59f00','#4dabf7','#e64980','#74c0fc',
  ];

  // ── Shared tooltip / axis styles ─────────────────────────────────────────────

  const tooltipBase = {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#e6eaf0',
    borderWidth: 1,
    textStyle: { color: '#1d273b', fontSize: 12 },
    extraCssText: 'box-shadow:0 4px 12px rgba(0,0,0,.1);border-radius:6px;',
  };

  const axisLabelStyle = { color: '#626976', fontSize: 11 };
  const splitLineStyle = { lineStyle: { color: '#f0f2f5', type: 'dashed' } };

  // ── 1. Boxplot ────────────────────────────────────────────────────────────────
  /**
   * @param {Array} journals - array of journal objects with label, min, p25, median, p75, max
   * @param {number} maxJournals - how many to show (sorted by median)
   */
  function boxplot(journals, maxJournals = 20) {
    const slice = journals.slice(0, maxJournals);
    const names = slice.map(j => j.label);
    // ECharts boxplot data: [min, Q1, median, Q3, max]
    const data  = slice.map(j => [j.min, j.p25, j.median, j.p75, j.max]);

    return {
      tooltip: {
        ...tooltipBase,
        formatter(params) {
          const j = slice[params.dataIndex];
          if (!j) return '';
          return `<strong>${j.label}</strong><br/>
            中位数: <b>${j.median}</b> 天<br/>
            P25–P75: ${j.p25}–${j.p75} 天<br/>
            最小–最大: ${j.min}–${j.max} 天<br/>
            样本量: ${j.count}`;
        },
        trigger: 'item',
      },
      grid: { left: 60, right: 20, top: 20, bottom: 100 },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { ...axisLabelStyle, rotate: 35, interval: 0 },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        name: '天数',
        nameTextStyle: { color: '#626976', fontSize: 11 },
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series: [{
        name: '审稿周期',
        type: 'boxplot',
        data,
        itemStyle: {
          color: params => speedColor(params.value[2]),
          borderColor: '#aaa',
          borderWidth: 1,
        },
        emphasis: { itemStyle: { borderWidth: 2 } },
      }],
    };
  }

  // ── 2. Global trend line (with P25–P75 band) ─────────────────────────────────
  /**
   * @param {Array} timeSeries - [{ym, median, p25, p75, count}]
   */
  function trendLine(timeSeries) {
    const xData = timeSeries.map(d => d.ym);
    return {
      tooltip: {
        ...tooltipBase,
        formatter(params) {
          const i = params[0]?.dataIndex;
          if (i == null) return '';
          const d = timeSeries[i];
          return `<strong>${d.ym}</strong><br/>
            中位数: <b>${d.median}</b> 天<br/>
            P25–P75: ${d.p25}–${d.p75} 天<br/>
            样本量: ${d.count}`;
        },
      },
      legend: { data: ['中位审稿天数'], top: 5, textStyle: { fontSize: 11 } },
      grid: { left: 55, right: 20, top: 40, bottom: 50 },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: { ...axisLabelStyle, rotate: 30, interval: Math.floor(xData.length / 12) },
      },
      yAxis: {
        type: 'value',
        name: '天数',
        nameTextStyle: { color: '#626976', fontSize: 11 },
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series: [
        // P25–P75 band (area between two lines via stack trick)
        {
          name: 'P25',
          type: 'line',
          data: timeSeries.map(d => d.p25),
          lineStyle: { opacity: 0 },
          stack: 'band',
          symbol: 'none',
          areaStyle: { opacity: 0 },
          tooltip: { show: false },
        },
        {
          name: 'P25–P75区间',
          type: 'line',
          data: timeSeries.map(d => d.p75 - d.p25),
          lineStyle: { opacity: 0 },
          stack: 'band',
          symbol: 'none',
          areaStyle: { color: 'rgba(32,107,196,0.12)', opacity: 1 },
          tooltip: { show: false },
        },
        // Median line
        {
          name: '中位审稿天数',
          type: 'line',
          data: timeSeries.map(d => d.median),
          smooth: true,
          lineStyle: { color: '#206bc4', width: 2.5 },
          itemStyle: { color: '#206bc4' },
          symbol: 'circle',
          symbolSize: 5,
          emphasis: { scale: true },
        },
      ],
    };
  }

  // ── 3. Heatmap (journal × month) ─────────────────────────────────────────────
  /**
   * @param {Array} journals - filtered list with timeSeries
   * @param {number} minCellCount - hide cells with fewer samples
   */
  function heatmap(journals, minCellCount = 3) {
    // Collect all unique YMs across journals
    const ymSet = new Set();
    journals.forEach(j => j.timeSeries.forEach(t => ymSet.add(t.ym)));
    const yms = [...ymSet].sort();

    // Keep only last 24 months
    const recentYMs = yms.slice(-24);
    const jNames = journals.map(j => j.label);

    const data = [];
    journals.forEach((j, jIdx) => {
      recentYMs.forEach((ym, ymIdx) => {
        const ts = j.timeSeries.find(t => t.ym === ym);
        if (ts && ts.count >= minCellCount) {
          data.push([ymIdx, jIdx, ts.median]);
        }
      });
    });

    const maxVal = data.reduce((m, d) => Math.max(m, d[2]), 0) || 1;

    return {
      tooltip: {
        position: 'top',
        formatter(p) {
          const j = jNames[p.data[1]];
          const ym = recentYMs[p.data[0]];
          const v = p.data[2];
          return `${j}<br/>${ym}<br/>中位: <b>${v}</b> 天`;
        },
      },
      grid: { left: 120, right: 80, top: 20, bottom: 60 },
      xAxis: {
        type: 'category',
        data: recentYMs,
        splitArea: { show: true },
        axisLabel: { ...axisLabelStyle, rotate: 30, interval: 1 },
      },
      yAxis: {
        type: 'category',
        data: jNames,
        splitArea: { show: true },
        axisLabel: { ...axisLabelStyle, fontSize: 10 },
      },
      visualMap: {
        min: 1,
        max: maxVal,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 5,
        inRange: { color: ['#2fb344','#f59f00','#d63939'] },
        text: ['慢', '快'],
        textStyle: { color: '#626976', fontSize: 10 },
      },
      series: [{
        type: 'heatmap',
        data,
        label: {
          show: jNames.length <= 15,
          formatter: p => p.data[2],
          fontSize: 9,
        },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
      }],
    };
  }

  // ── 4. Journal time series (single journal sparkline/line) ───────────────────
  function journalTimeLine(journal) {
    const ts = journal.timeSeries.slice(-18);
    return {
      tooltip: { ...tooltipBase },
      grid: { left: 40, right: 10, top: 10, bottom: 40 },
      xAxis: {
        type: 'category',
        data: ts.map(d => d.ym),
        axisLabel: { ...axisLabelStyle, rotate: 25, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: '天数',
        axisLabel: { ...axisLabelStyle, fontSize: 10 },
        splitLine: splitLineStyle,
      },
      series: [{
        type: 'line',
        data: ts.map(d => d.median),
        smooth: true,
        lineStyle: { color: '#206bc4', width: 2 },
        itemStyle: { color: '#206bc4' },
        areaStyle: { color: 'rgba(32,107,196,0.1)' },
        symbolSize: 5,
      }],
    };
  }

  // ── 5. Compare — multi-journal boxplot ───────────────────────────────────────
  function compareBoxplot(journals) {
    const colors = journals.map((_, i) => PALETTE[i % PALETTE.length]);
    return {
      tooltip: {
        trigger: 'item',
        ...tooltipBase,
        formatter(p) {
          const j = journals[p.dataIndex];
          if (!j) return '';
          return `<strong>${j.label}</strong><br/>
            中位: ${j.median} 天 | P25: ${j.p25} | P75: ${j.p75}<br/>
            最小: ${j.min} | 最大: ${j.max} | n=${j.count}`;
        },
      },
      grid: { left: 50, right: 20, top: 20, bottom: 80 },
      xAxis: {
        type: 'category',
        data: journals.map(j => j.label),
        axisLabel: { ...axisLabelStyle, rotate: 30, interval: 0 },
      },
      yAxis: {
        type: 'value',
        name: '天数',
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series: [{
        type: 'boxplot',
        data: journals.map(j => [j.min, j.p25, j.median, j.p75, j.max]),
        itemStyle: { borderWidth: 2 },
        colorBy: 'data',
        color: colors,
      }],
    };
  }

  // ── 6. Compare — multi-journal trend lines ───────────────────────────────────
  function compareTrend(journals, months = 24) {
    // Collect all YMs
    const ymSet = new Set();
    journals.forEach(j => j.timeSeries.slice(-months).forEach(t => ymSet.add(t.ym)));
    const yms = [...ymSet].sort().slice(-months);

    const series = journals.map((j, i) => ({
      name: j.label,
      type: 'line',
      smooth: true,
      data: yms.map(ym => {
        const t = j.timeSeries.find(d => d.ym === ym);
        return t ? t.median : null;
      }),
      connectNulls: false,
      lineStyle: { width: 2, color: PALETTE[i % PALETTE.length] },
      itemStyle: { color: PALETTE[i % PALETTE.length] },
      symbolSize: 5,
    }));

    return {
      tooltip: { ...tooltipBase },
      legend: {
        data: journals.map(j => j.label),
        top: 5,
        textStyle: { fontSize: 10 },
        type: 'scroll',
      },
      grid: { left: 55, right: 20, top: 40, bottom: 50 },
      xAxis: {
        type: 'category',
        data: yms,
        axisLabel: { ...axisLabelStyle, rotate: 30, interval: Math.floor(yms.length / 8) },
      },
      yAxis: {
        type: 'value',
        name: '天数',
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series,
    };
  }

  // ── 7. Scatter — IF vs Review Time (Phase 2) ─────────────────────────────────
  /**
   * @param {Array} points - [{label, issn, median, impact, subject}]
   */
  function ifScatter(points) {
    const medianMedian = points.reduce((s, p) => s + p.median, 0) / points.length || 60;
    const medianIF     = points.reduce((s, p) => s + p.impact, 0) / points.length || 3;
    const subjectSet = [...new Set(points.map(p => p.subject))];
    const series = subjectSet.map((sub, i) => ({
      name: sub,
      type: 'scatter',
      data: points
        .filter(p => p.subject === sub)
        .map(p => [p.median, p.impact, p.label]),
      symbolSize: 10,
      itemStyle: { color: PALETTE[i % PALETTE.length], opacity: 0.8 },
      label: {
        show: false,
        formatter: p => p.data[2],
        position: 'right',
        fontSize: 9,
      },
      emphasis: { label: { show: true } },
      markLine: {
        silent: true,
        symbol: 'none',
        label: { show: false },
        lineStyle: { color: '#ccc', type: 'dashed' },
        data: [
          { xAxis: medianMedian },
          { yAxis: medianIF },
        ],
      },
    }));

    return {
      tooltip: {
        trigger: 'item',
        ...tooltipBase,
        formatter(p) {
          return `<strong>${p.data[2]}</strong><br/>
            中位审稿: ${p.data[0]} 天<br/>
            Impact (2yr): ${p.data[1].toFixed(2)}`;
        },
      },
      legend: { data: subjectSet, type: 'scroll', top: 5, textStyle: { fontSize: 10 } },
      grid: { left: 60, right: 20, top: 40, bottom: 60 },
      xAxis: {
        name: '中位审稿天数',
        nameLocation: 'middle',
        nameGap: 30,
        type: 'value',
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      yAxis: {
        name: '2-Year Mean Citedness',
        nameLocation: 'middle',
        nameGap: 50,
        type: 'value',
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series,
    };
  }

  // ── 8. Citation graph (force-directed, Phase 2) ──────────────────────────────
  /**
   * @param {Object} centerPaper - {id, title}
   * @param {Array} refs  - [{id, title}]
   * @param {Array} cites - [{id, title}]
   */
  function citationGraph(centerPaper, refs = [], cites = []) {
    const nodes = [
      { id: centerPaper.id, name: centerPaper.title?.slice(0, 40) || centerPaper.id,
        symbolSize: 20, itemStyle: { color: '#206bc4' }, category: 0 },
      ...refs.map(r  => ({ id: r.id, name: r.title?.slice(0, 30) || r.id,
        symbolSize: 10, category: 1 })),
      ...cites.map(c => ({ id: c.id, name: c.title?.slice(0, 30) || c.id,
        symbolSize: 10, category: 2 })),
    ];
    const links = [
      ...refs.map(r  => ({ source: r.id,         target: centerPaper.id })),
      ...cites.map(c => ({ source: centerPaper.id, target: c.id })),
    ];
    return {
      tooltip: { trigger: 'item', formatter: p => p.data.name || p.data.id },
      legend: [{ data: ['目标论文','引用来源','被引文章'], textStyle: { fontSize: 10 } }],
      series: [{
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        categories: [
          { name: '目标论文', itemStyle: { color: '#206bc4' } },
          { name: '引用来源', itemStyle: { color: '#2fb344' } },
          { name: '被引文章', itemStyle: { color: '#f76707' } },
        ],
        nodes,
        links,
        label: { show: true, fontSize: 9, position: 'right' },
        lineStyle: { curveness: 0.3, opacity: 0.6 },
        force: { repulsion: 120, edgeLength: 100 },
      }],
    };
  }

  // ── Public ───────────────────────────────────────────────────────────────────

  return {
    boxplot,
    trendLine,
    heatmap,
    journalTimeLine,
    compareBoxplot,
    compareTrend,
    ifScatter,
    citationGraph,
    speedColor,
    PALETTE,
  };
})();

window.Charts = Charts;
