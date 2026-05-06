import type { EChartsOption } from 'echarts'
import type { JournalStats, TimeSeriesPoint } from './types'
import { CHART_PALETTE } from './types'

const axisLabelStyle = { color: '#626976', fontSize: 11 }
const splitLineStyle = { lineStyle: { color: '#f0f2f5', type: 'dashed' as const } }

export function buildBoxplotOption(journals: JournalStats[], maxJournals = 20): EChartsOption {
  const slice = journals.slice(0, maxJournals)
  return {
    grid: { left: 50, right: 20, top: 20, bottom: 90 },
    tooltip: { trigger: 'item' },
    xAxis: {
      type: 'category',
      data: slice.map(j => j.label),
      axisLabel: { ...axisLabelStyle, rotate: 30, interval: 0 },
    },
    yAxis: {
      type: 'value',
      axisLabel: axisLabelStyle,
      splitLine: splitLineStyle,
    },
    series: [
      {
        type: 'boxplot',
        data: slice.map(j => [j.min, j.p25, j.median, j.p75, j.max]),
      },
    ],
  }
}

export function buildTrendOption(seriesData: TimeSeriesPoint[]): EChartsOption {
  const xData = seriesData.map(d => d.ym)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 50 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { ...axisLabelStyle, rotate: 30, interval: Math.max(0, Math.floor(xData.length / 10)) },
    },
    yAxis: { type: 'value', axisLabel: axisLabelStyle, splitLine: splitLineStyle },
    series: [
      {
        name: 'Median',
        type: 'line',
        smooth: true,
        data: seriesData.map(d => d.median),
        lineStyle: { width: 2.5, color: '#206bc4' },
      },
    ],
  }
}

export function buildHeatmapOption(journals: JournalStats[], minCellCount = 3): EChartsOption {
  const ymSet = new Set<string>()
  journals.forEach(j => j.timeSeries.forEach(t => ymSet.add(t.ym)))
  const yms = [...ymSet].sort().slice(-24)
  const names = journals.map(j => j.label)
  const values: [number, number, number][] = []

  journals.forEach((j, jIdx) => {
    yms.forEach((ym, ymIdx) => {
      const point = j.timeSeries.find(t => t.ym === ym)
      if (point && point.count >= minCellCount) values.push([ymIdx, jIdx, point.median])
    })
  })

  const max = Math.max(1, ...values.map(v => v[2]))

  return {
    tooltip: { position: 'top' },
    grid: { left: 120, right: 70, top: 20, bottom: 50 },
    xAxis: { type: 'category', data: yms, axisLabel: { ...axisLabelStyle, rotate: 30 } },
    yAxis: { type: 'category', data: names, axisLabel: { ...axisLabelStyle, fontSize: 10 } },
    visualMap: {
      min: 1,
      max,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#2fb344', '#f59f00', '#d63939'] },
    },
    series: [{ type: 'heatmap', data: values }],
  }
}

export function buildCompareTrendOption(journals: JournalStats[], months = 24): EChartsOption {
  const ymSet = new Set<string>()
  journals.forEach(j => j.timeSeries.slice(-months).forEach(p => ymSet.add(p.ym)))
  const yms = [...ymSet].sort().slice(-months)

  return {
    tooltip: { trigger: 'axis' },
    legend: { type: 'scroll', top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 50 },
    xAxis: {
      type: 'category',
      data: yms,
      axisLabel: { ...axisLabelStyle, rotate: 30, interval: Math.max(0, Math.floor(yms.length / 10)) },
    },
    yAxis: { type: 'value', axisLabel: axisLabelStyle, splitLine: splitLineStyle },
    series: journals.map((j, idx) => ({
      name: j.label,
      type: 'line',
      smooth: true,
      data: yms.map(ym => j.timeSeries.find(p => p.ym === ym)?.median ?? null),
      lineStyle: { color: CHART_PALETTE[idx % CHART_PALETTE.length], width: 2 },
      itemStyle: { color: CHART_PALETTE[idx % CHART_PALETTE.length] },
      connectNulls: false,
    })),
  }
}
