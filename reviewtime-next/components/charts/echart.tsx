'use client'

import { useEffect, useRef, useState } from 'react'
import type { ECharts, EChartsOption } from 'echarts'

interface EChartProps {
  option: EChartsOption
  className?: string
}

export function EChart({ option, className }: EChartProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const chartInstanceRef = useRef<ECharts | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let observer: ResizeObserver | null = null
    let handleResize: (() => void) | null = null

    import('echarts').then(echarts => {
      if (cancelled || !ref.current) return

      let chart = chartInstanceRef.current
      if (!chart) {
        chart = echarts.init(ref.current, undefined, { renderer: 'canvas' })
        chartInstanceRef.current = chart
      }
      chart.setOption(option)
      setIsReady(true)

      handleResize = () => chart?.resize()
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(handleResize)
        if (ref.current) observer.observe(ref.current)
      } else {
        window.addEventListener('resize', handleResize)
      }
    })

    return () => {
      cancelled = true
      observer?.disconnect()
      if (handleResize) window.removeEventListener('resize', handleResize)
      chartInstanceRef.current?.dispose()
      chartInstanceRef.current = null
    }
  }, [option])

  return (
    <div className={`relative ${className ?? 'h-80 w-full'}`}>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-50/60 animate-pulse text-xs text-slate-400">
          Loading chart...
        </div>
      )}
      <div ref={ref} className="h-full w-full" role="img" />
    </div>
  )
}
