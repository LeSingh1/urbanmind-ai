import * as d3 from 'd3'
import { useMemo, useState } from 'react'
import { useCityStore } from '@/stores/cityStore'
import { scenarioColors, useScenarioStore } from '@/stores/scenarioStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { ensureHistory, exportSvg, useChartSize } from './chartUtils'

export function PopulationTimeline() {
  const { ref, width } = useChartSize<HTMLDivElement>()
  const [hoverYear, setHoverYear] = useState<number | null>(null)
  const city = useCityStore((state) => state.selectedCity)
  const history = useSimulationStore((state) => state.metricsHistory)
  const currentYear = useSimulationStore((state) => state.currentYear)
  const scrubToYear = useSimulationStore((state) => state.scrubToYear)
  const frames = useSimulationStore((state) => state.frameHistory)
  const activeScenario = useScenarioStore((state) => state.activeScenario)
  const data = ensureHistory(history, city?.population_current)
  const chartId = 'population-timeline-chart'
  const height = 260
  const margin = { top: 28, right: 32, bottom: 36, left: 58 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const projection = useMemo(() => project(data), [data])
  const allPop = projection.flatMap((d) => [d.pop_total * 0.85, d.pop_total * 1.15])
  const x = d3.scaleLinear().domain([0, 50]).range([0, innerW])
  const y = d3.scaleLinear().domain([Math.min(...allPop) * 0.95, Math.max(...allPop) * 1.05]).range([innerH, 0]).nice()
  const line = d3.line<any>().x((d) => x(d.year)).y((d) => y(d.pop_total)).curve(d3.curveMonotoneX)
  const area = d3.area<any>().x((d) => x(d.year)).y0((d) => y(d.pop_total * 0.85)).y1((d) => y(d.pop_total * 1.15)).curve(d3.curveMonotoneX)
  const baseline = baselineFromCity(city, projection)
  const eventActions = frames.flatMap((frame) => frame.agent_actions.map((action) => ({ ...action, year: frame.year }))).filter((action) => ['TRANSIT_HUB', 'HEALTH_HOSPITAL', 'EDU_UNIVERSITY', 'INTL_AIRPORT'].some((prefix) => action.zone_type_id.includes(prefix)))
  const hover = hoverYear == null ? null : projection.reduce((prev, next) => Math.abs(next.year - hoverYear) < Math.abs(prev.year - hoverYear) ? next : prev, projection[0])

  return (
    <div ref={ref} style={{ position: 'relative', height }}>
      <button className="icon-btn" onClick={() => exportSvg(chartId, 'population-timeline')} style={{ position: 'absolute', right: 4, top: 4, width: 28, height: 28, zIndex: 2 }} aria-label="Export population timeline SVG">SVG</button>
      <svg
        id={chartId}
        width={width}
        height={height}
        role="img"
        aria-label="Population timeline chart"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          setHoverYear(Math.round(x.invert(event.clientX - rect.left - margin.left)))
        }}
        onMouseLeave={() => setHoverYear(null)}
        onClick={() => hover && scrubToYear(hover.year)}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {d3.range(0, 51, 5).map((year) => <line key={year} x1={x(year)} x2={x(year)} y1={0} y2={innerH} stroke="var(--chart-grid)" strokeDasharray="4 4" />)}
          {y.ticks(5).map((tick) => <g key={tick}><line x1={0} x2={innerW} y1={y(tick)} y2={y(tick)} stroke="var(--chart-grid)" /><text x={-10} y={y(tick) + 4} textAnchor="end" fill="var(--color-text-muted)" fontSize="11">{d3.format('.2s')(tick)}</text></g>)}
          <path d={area(projection) ?? ''} fill="rgba(96,165,250,0.15)" />
          <path d={line(projection) ?? ''} fill="none" stroke={scenarioColors[activeScenario]} strokeWidth="2.5" />
          <path d={line(baseline) ?? ''} fill="none" stroke="var(--chart-line-baseline)" strokeWidth="1.5" strokeDasharray="6 5" />
          <line x1={0} x2={innerW} y1={y(Math.max(...projection.map((d) => d.pop_total)) * 1.08)} y2={y(Math.max(...projection.map((d) => d.pop_total)) * 1.08)} stroke="var(--color-brand-danger)" strokeDasharray="4 4" />
          <line x1={x(currentYear)} x2={x(currentYear)} y1={0} y2={innerH} stroke="var(--color-brand-accent)" strokeDasharray="3 4" />
          {eventActions.map((action, index) => <g key={`${action.year}-${index}`} transform={`translate(${x(action.year)},0)`}><line y1={0} y2={innerH} stroke="rgba(255,255,255,0.35)" strokeDasharray="1 5" /><text transform="rotate(-45)" x={6} y={-4} fill="var(--color-text-secondary)" fontSize="10">{action.zone_display_name}</text></g>)}
          <g transform={`translate(0,${innerH})`}>{x.ticks(10).map((tick) => <text key={tick} x={x(tick)} y={24} fill="var(--color-text-muted)" fontSize="11" textAnchor="middle">{tick}</text>)}</g>
          {hover && <g transform={`translate(${x(hover.year)},0)`}><line y1={0} y2={innerH} stroke="white" opacity="0.55" /><rect x={8} y={14} width={170} height={76} rx={8} fill="rgba(17,24,39,0.94)" stroke="rgba(96,165,250,0.35)" /><text x={18} y={36} fill="white" fontSize="12" fontWeight="700">Year {hover.year}</text><text x={18} y={56} fill="var(--color-text-secondary)" fontSize="12">{Math.round(hover.pop_total).toLocaleString()} people</text><text x={18} y={74} fill="var(--color-text-muted)" fontSize="11">RES low/med/high/mixed</text></g>}
        </g>
      </svg>
    </div>
  )
}

function project(data: any[]) {
  const sorted = [...data].sort((a, b) => a.year - b.year)
  const last = sorted.at(-1) ?? { year: 0, pop_total: 1000000 }
  const projected = [...sorted]
  for (let year = last.year + 1; year <= 50; year += 1) {
    const growth = 1 + Math.max(0.006, (last.pop_growth_rate ?? 1.1) / 100)
    projected.push({ ...last, year, pop_total: last.pop_total * growth ** (year - last.year) })
  }
  return projected
}

function baselineFromCity(city: any, projection: any[]) {
  if (!city?.historical_snapshots?.length) return projection.map((d) => ({ ...d, pop_total: projection[0].pop_total * (1 + d.year * 0.011) }))
  const start = city.historical_snapshots[0].population
  const end = city.population_current
  return projection.map((d) => ({ ...d, pop_total: start + ((end - start) * d.year) / 50 }))
}
