import * as d3 from 'd3'
import { useMemo, useState } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'
import { exportSvg, useChartSize } from './chartUtils'
import { getZoneColor } from '@/utils/colorUtils'

const weights: Record<string, number> = { TRANSIT_HUB: 5, HEALTH_HOSPITAL: 4, EDU_UNIVERSITY: 3, INTL_AIRPORT: 8, NUCLEAR_PLANT: 6 }

export function InfraGrowthScatter() {
  const { ref, width } = useChartSize<HTMLDivElement>()
  const [hover, setHover] = useState<any | null>(null)
  const frames = useSimulationStore((state) => state.frameHistory)
  const points = useMemo(() => buildPoints(frames), [frames])
  const data = points.length ? points : d3.range(0, 50, 5).map((year) => ({ year, investment: 10 + year * 1.3, growth: 1.1 + Math.sin(year / 10) * 0.5, zone: 'TRANSIT_HUB' }))
  const height = 180
  const margin = { top: 24, right: 18, bottom: 32, left: 42 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const x = d3.scaleLinear().domain([0, d3.max(data, (d) => d.investment) ?? 10]).range([0, innerW]).nice()
  const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.growth) ?? 3]).range([innerH, 0]).nice()
  const regression = leastSquares(data)
  return (
    <div ref={ref} style={{ position: 'relative', height }}>
      <button className="icon-btn" onClick={() => exportSvg('infra-growth-scatter', 'infra-growth-scatter')} style={{ position: 'absolute', right: 0, top: 0, width: 28, height: 28 }}>SVG</button>
      <svg id="infra-growth-scatter" width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {x.ticks(5).map((tick) => <line key={tick} x1={x(tick)} x2={x(tick)} y1={0} y2={innerH} stroke="var(--chart-grid)" />)}
          {y.ticks(4).map((tick) => <g key={tick}><line x1={0} x2={innerW} y1={y(tick)} y2={y(tick)} stroke="var(--chart-grid)" /><text x={-8} y={y(tick) + 3} fill="var(--color-text-muted)" fontSize="10" textAnchor="end">{tick.toFixed(1)}%</text></g>)}
          <line x1={x(0)} y1={y(regression.intercept)} x2={x(d3.max(data, (d) => d.investment) ?? 1)} y2={y(regression.slope * (d3.max(data, (d) => d.investment) ?? 1) + regression.intercept)} stroke="white" strokeDasharray="5 4" opacity="0.65" />
          {data.map((point) => <circle key={point.year} cx={x(point.investment)} cy={y(point.growth)} r={6} fill={getZoneColor(point.zone)} onMouseEnter={() => setHover(point)} onMouseLeave={() => setHover(null)} />)}
          <text x={innerW - 8} y={12} fill="var(--color-text-secondary)" fontSize="11" textAnchor="end">R2 {regression.r2.toFixed(2)}</text>
          {hover && <g transform={`translate(${x(hover.investment) + 10},${y(hover.growth) - 26})`}><rect width="142" height="50" rx="8" fill="rgba(17,24,39,0.94)" stroke="rgba(255,255,255,0.18)" /><text x="10" y="19" fill="white" fontSize="11">Years {hover.year}-{hover.year + 5}</text><text x="10" y="36" fill="var(--color-text-secondary)" fontSize="10">Growth {hover.growth.toFixed(2)}%, infra {hover.investment}</text></g>}
        </g>
      </svg>
    </div>
  )
}

function buildPoints(frames: any[]) {
  const points = []
  for (let start = 0; start < 50; start += 5) {
    const bucket = frames.filter((frame) => frame.year >= start && frame.year < start + 5)
    if (!bucket.length) continue
    const investment = bucket.flatMap((frame) => frame.agent_actions).reduce((sum, action) => sum + Object.entries(weights).reduce((w, [key, value]) => action.zone_type_id.includes(key) ? value : w, 0), 0)
    const first = bucket[0]?.metrics_snapshot?.pop_total ?? 1
    const last = bucket.at(-1)?.metrics_snapshot?.pop_total ?? first
    const dominant = bucket.flatMap((frame) => frame.agent_actions)[0]?.zone_type_id ?? 'RES_LOW_DETACHED'
    points.push({ year: start, investment, growth: ((last - first) / first) * 100, zone: dominant })
  }
  return points
}

function leastSquares(data: Array<{ investment: number; growth: number }>) {
  const n = data.length || 1
  const sx = d3.sum(data, (d) => d.investment)
  const sy = d3.sum(data, (d) => d.growth)
  const sxy = d3.sum(data, (d) => d.investment * d.growth)
  const sx2 = d3.sum(data, (d) => d.investment ** 2)
  const slope = (n * sxy - sx * sy) / Math.max(1e-6, n * sx2 - sx ** 2)
  const intercept = (sy - slope * sx) / n
  const mean = sy / n
  const ssTot = d3.sum(data, (d) => (d.growth - mean) ** 2)
  const ssRes = d3.sum(data, (d) => (d.growth - (slope * d.investment + intercept)) ** 2)
  return { slope, intercept, r2: ssTot ? 1 - ssRes / ssTot : 0 }
}
