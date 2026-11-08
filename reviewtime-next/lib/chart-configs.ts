import type { EChartsOption } from 'echarts'
import type { JournalStats, ReviewProcessPeriod, TimelinePoint, TimeSeriesPoint } from './types'
import { CHART_PALETTE } from './types'

export const CHART_THEME = {
  surface: '#ffffff',
  ink: '#151515',
  secondaryInk: '#505a68',
  mutedInk: '#505a68',
  grid: '#e7ebf1',
  axis: '#b3c6df',
  primary: '#5294ff',
  primaryArea: 'rgba(82, 148, 255, 0.12)',
  tooltip: '#151515',
  sequential: ['#e9f0fc', '#b9defa', '#9ec5ff', '#5294ff', '#2c528c'],
} as const

const axisLabelStyle = { color: CHART_THEME.mutedInk, fontSize: 11 }
const splitLineStyle = { show: true, lineStyle: { color: CHART_THEME.grid, type: 'solid' as const, width: 1 } }
const axisLineStyle = { show: true, lineStyle: { color: CHART_THEME.axis, width: 1 } }
const tooltipStyle = {
  backgroundColor: CHART_THEME.tooltip,
  borderWidth: 0,
  padding: [8, 10],
  textStyle: { color: '#ffffff', fontSize: 12 },
  extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(15,61,62,.16)',
}
const axisPointerStyle = { type: 'line' as const, lineStyle: { color: CHART_THEME.axis, width: 1 } }
const baseOption = {
  animationDuration: 260,
  animationDurationUpdate: 180,
  color: CHART_PALETTE,
  textStyle: {
    color: CHART_THEME.secondaryInk,
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  },
  aria: { enabled: true, decal: { show: false } },
}

export function buildBoxplotOption(journals: JournalStats[], maxJournals = 20): EChartsOption {
  const slice = journals.slice(0, maxJournals)
  return {
    ...baseOption,
    grid: { left: 50, right: 20, top: 20, bottom: 90 },
    tooltip: { ...tooltipStyle, trigger: 'item', confine: true },
    xAxis: {
      type: 'category',
      data: slice.map(j => j.label),
      axisLabel: { ...axisLabelStyle, rotate: 30, interval: 0 },
      axisLine: axisLineStyle,
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: axisLabelStyle,
      splitLine: splitLineStyle,
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'boxplot',
        data: slice.map(j => [j.min, j.p25, j.median, j.p75, j.max]),
        itemStyle: {
          borderColor: CHART_THEME.primary,
          borderWidth: 2,
          color: CHART_THEME.primaryArea,
        },
      },
    ],
  }
}

export function buildTrendOption(seriesData: TimeSeriesPoint[], timelinePoints: TimelinePoint[] = []): EChartsOption {
  const xData = seriesData.map(d => d.ym)
  const scopedPoints = timelinePoints.filter(point => xData.includes(point.ym))
  const series: EChartsOption['series'] = [
    {
      name: 'Monthly median',
      type: 'line',
      smooth: true,
      data: seriesData.map(d => d.median),
      lineStyle: { width: 2, color: CHART_THEME.primary, cap: 'round', join: 'round' },
      itemStyle: { color: CHART_THEME.primary, borderColor: CHART_THEME.surface, borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: CHART_THEME.primaryArea },
            { offset: 1, color: 'rgba(18, 135, 125, 0)' },
          ],
        },
      },
      symbolSize: 8,
      z: 3,
    },
  ]

  if (scopedPoints.length) {
    series.unshift({
      name: 'Published article',
      type: 'scatter',
      data: scopedPoints.map(point => [point.ym, point.days]),
      symbolSize: 8,
      itemStyle: { color: 'rgba(91, 100, 114, 0.35)', borderColor: CHART_THEME.surface, borderWidth: 2 },
      emphasis: { itemStyle: { color: CHART_THEME.primary } },
    })
  }

  return {
    ...baseOption,
    tooltip: { ...tooltipStyle, trigger: 'axis', confine: true, axisPointer: axisPointerStyle },
    legend: scopedPoints.length ? { top: 0, right: 0, textStyle: axisLabelStyle } : { show: false },
    grid: { left: 50, right: 20, top: 46, bottom: 50 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { ...axisLabelStyle, rotate: 30, interval: Math.max(0, Math.floor(xData.length / 10)) },
      axisLine: axisLineStyle,
      axisTick: { show: false },
    },
    yAxis: { type: 'value', axisLabel: axisLabelStyle, splitLine: splitLineStyle, axisLine: { show: false }, axisTick: { show: false } },
    series,
  }
}

export type ReviewProcessMetric = 'total_wait' | 'first_feedback' | 'revision_rounds' | 'final_acceptance_tail'

export function buildReviewProcessTrendOption(
  seriesData: ReviewProcessPeriod[],
  metric: ReviewProcessMetric,
): EChartsOption {
  const xData = seriesData.map(d => d.period)
  const label = {
    total_wait: 'Total wait',
    first_feedback: 'First feedback',
    revision_rounds: 'Revision rounds',
    final_acceptance_tail: 'Final revision tail',
  }[metric]
  const unit = metric === 'revision_rounds' ? 'rounds' : 'days'

  return {
    ...baseOption,
    tooltip: {
      ...tooltipStyle,
      trigger: 'axis',
      confine: true,
      axisPointer: axisPointerStyle,
      valueFormatter: value => value == null ? '—' : `${value} ${unit}`,
    },
    legend: { show: false },
    grid: { left: 50, right: 20, top: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { ...axisLabelStyle, rotate: 25, interval: 0 },
      axisLine: axisLineStyle,
      axisTick: { show: false },
    },
    yAxis: { type: 'value', axisLabel: axisLabelStyle, splitLine: splitLineStyle, axisLine: { show: false }, axisTick: { show: false } },
    series: [
      {
        name: `${label} median`,
        type: 'line',
        smooth: true,
        data: seriesData.map(d => d[metric].median),
        lineStyle: { width: 2, color: CHART_THEME.primary, cap: 'round', join: 'round' },
        itemStyle: { color: CHART_THEME.primary, borderColor: CHART_THEME.surface, borderWidth: 2 },
        symbolSize: 8,
      },
    ],
  }
}

export function buildHeatmapOption(journals: JournalStats[], minCellCount = 3): EChartsOption {
  const ymSet = new Set<string>()
  journals.forEach(j => (j.timeSeries ?? []).forEach(t => ymSet.add(t.ym)))
  const yms = Array.from(ymSet).sort().slice(-24)
  const names = journals.map(j => j.label)
  const values: [number, number, number][] = []

  journals.forEach((j, jIdx) => {
    yms.forEach((ym, ymIdx) => {
      const point = (j.timeSeries ?? []).find(t => t.ym === ym)
      if (point && point.count >= minCellCount) values.push([ymIdx, jIdx, point.median])
    })
  })

  const max = Math.max(1, ...values.map(v => v[2]))

  return {
    ...baseOption,
    tooltip: { ...tooltipStyle, trigger: 'item', position: 'top', confine: true },
    grid: { left: 120, right: 70, top: 20, bottom: 50 },
    xAxis: { type: 'category', data: yms, axisLabel: { ...axisLabelStyle, rotate: 30 }, axisLine: axisLineStyle, axisTick: { show: false } },
    yAxis: { type: 'category', data: names, axisLabel: { ...axisLabelStyle, fontSize: 10 }, axisLine: axisLineStyle, axisTick: { show: false } },
    visualMap: {
      min: 1,
      max,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: axisLabelStyle,
      inRange: { color: [...CHART_THEME.sequential] },
    },
    series: [{ type: 'heatmap', data: values }],
  }
}

export function buildCompareTrendOption(journals: JournalStats[], months = 24): EChartsOption {
  const ymSet = new Set<string>()
  journals.forEach(j => (j.timeSeries ?? []).slice(-months).forEach(p => ymSet.add(p.ym)))
  const yms = Array.from(ymSet).sort().slice(-months)

  return {
    ...baseOption,
    tooltip: { ...tooltipStyle, trigger: 'axis', confine: true, axisPointer: axisPointerStyle },
    legend: { type: 'scroll', top: 0, textStyle: axisLabelStyle },
    grid: { left: 50, right: 20, top: 40, bottom: 50 },
    xAxis: {
      type: 'category',
      data: yms,
      axisLabel: { ...axisLabelStyle, rotate: 30, interval: Math.max(0, Math.floor(yms.length / 10)) },
      axisLine: axisLineStyle,
      axisTick: { show: false },
    },
    yAxis: { type: 'value', axisLabel: axisLabelStyle, splitLine: splitLineStyle, axisLine: { show: false }, axisTick: { show: false } },
    series: journals.map((j, idx) => ({
      name: j.label,
      type: 'line',
      smooth: true,
      data: yms.map(ym => (j.timeSeries ?? []).find(p => p.ym === ym)?.median ?? null),
      lineStyle: { color: CHART_PALETTE[idx], width: 2, cap: 'round', join: 'round' },
      itemStyle: { color: CHART_PALETTE[idx], borderColor: CHART_THEME.surface, borderWidth: 2 },
      symbolSize: 8,
      connectNulls: false,
    })),
  }
}
