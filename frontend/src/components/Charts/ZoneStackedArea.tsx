import * as d3 from 'd3'
import { useMemo, useState } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'
import { exportSvg, useChartSize, zoneCountsByYear } from './chartUtils'

const keys = ['RES_LOW', 'RES_MED', 'RES_HIGH', 'RES_MIXED']
const colors: Record<string, string> = {
  RES_LOW: 'var(--zone-res-low)',
  RES_MED: 'var(--zone-res-med)',
  RES_HIGH: 'var(--zone-res-high)',
  RES_MIXED: 'var(--zone-mixed-use)',
}

export function ZoneStackedArea() {
  const { ref, width } = useChartSize<HTMLDivElement>()
  const [hover, setHover] = useState<any | null>(null)
  const frames = useSimulationStore((state) => state.frameHistory)
  const data = useMemo(() => {
    const rows = zoneCountsByYear(frames)
    return rows.length ? rows : d3.range(0, 51, 10).map((year) => ({ year, RES_LOW: 100 - year, RES_MED: 40 + year, RES_HIGH: year * 2, RES_MIXED: year * 1.4 }))
  }, [frames])
  const height = 180
  const margin = { top: 24, right: 14, bottom: 26, left: 44 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const series = d3.stack<any>().keys(keys)(data)
  const x = d3.scaleLinear().domain([0, 50]).range([0, innerW])
  const y = d3.scaleLinear().domain([0, d3.max(series, (s) => d3.max(s, (d) => d[1])) ?? 1]).range([innerH, 0]).nice()
  const area = d3.area<any>().x((d) => x(d.data.year)).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(d3.curveMonotoneX)
  return (
    <div ref={ref} style={{ position: 'relative', height }}>
      <button className="icon-btn" onClick={() => exportSvg('zone-stacked-area', 'zone-stacked-area')} style={{ position: 'absolute', right: 0, top: 0, width: 28, height: 28 }}>SVG</button>
      <svg id="zone-stacked-area" width={width} height={height} onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const year = Math.round(x.invert(event.clientX - rect.left - margin.left))
        setHover(data.reduce((prev, next) => Math.abs(next.year - year) < Math.abs(prev.year - year) ? next : prev, data[0]))
      }} onMouseLeave={() => setHover(null)}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {series.map((layer) => <path key={layer.key} d={area(layer) ?? ''} fill={colors[layer.key]} opacity="0.78" />)}
          {x.ticks(5).map((tick) => <text key={tick} x={x(tick)} y={innerH + 20} fill="var(--color-text-muted)" fontSize="10" textAnchor="middle">{tick}</text>)}
          {y.ticks(4).map((tick) => <g key={tick}><line x1={0} x2={innerW} y1={y(tick)} y2={y(tick)} stroke="var(--chart-grid)" /><text x={-8} y={y(tick) + 3} fill="var(--color-text-muted)" fontSize="10" textAnchor="end">{d3.format('.1s')(tick)}</text></g>)}
          {hover && <g transform={`translate(${x(hover.year)},8)`}><rect x="8" y="0" width="138" height="78" rx="8" fill="rgba(17,24,39,0.94)" stroke="rgba(255,255,255,0.2)" /><text x="18" y="20" fill="white" fontSize="11" fontWeight="700">Year {hover.year}</text>{keys.map((key, i) => <text key={key} x="18" y={38 + i * 12} fill="var(--color-text-secondary)" fontSize="10">{key}: {Math.round(hover[key]).toLocaleString()}</text>)}</g>}
        </g>
      </svg>
    </div>
  )
}
