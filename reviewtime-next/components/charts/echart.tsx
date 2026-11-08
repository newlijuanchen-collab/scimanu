'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

interface EChartProps {
  option: EChartsOption
  className?: string
}

export function EChart({ option, className }: EChartProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const element = ref.current
    const chart = echarts.init(element, undefined, { renderer: 'canvas' })
    chart.setOption(option)

    const onResize = () => chart.resize()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize)
    observer?.observe(element)
    if (!observer) window.addEventListener('resize', onResize)
    return () => {
      observer?.disconnect()
      if (!observer) window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [option])

  return <div ref={ref} className={className ?? 'h-80 w-full'} role="img" />
}
