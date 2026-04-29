import * as d3 from 'd3'
import { useMemo } from 'react'
import { useScenarioStore, scenarioColors } from '@/stores/scenarioStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { ensureHistory, exportSvg } from './chartUtils'

const axes = [
  'Housing Affordability',
  'Job Growth',
  'Transit Coverage',
  'Green Space',
  'School Access',
  'Healthcare',
  'Climate Safety',
  'GDP Growth',
]

export function GrowthRadar() {
  const history = ensureHistory(useSimulationStore((state) => state.metricsHistory))
  const activeScenario = useScenarioStore((state) => state.activeScenario)
  const current = normalize(history.at(-1)!)
  const baseline = normalize(history[0])
  const size = 240
  const center = size / 2
  const radius = 82
  const angle = d3.scaleLinear().domain([0, axes.length]).range([-Math.PI / 2, Math.PI * 1.5])
  const path = (values: number[]) => values.map((value, index) => point(center, radius * (value / 100), angle(index))).map((p) => p.join(',')).join(' ')
  const color = scenarioColors[activeScenario]

  const grid = useMemo(() => [0.25, 0.5, 0.75, 1].map((scale) => axes.map((_, index) => point(center, radius * scale, angle(index))).map((p) => p.join(',')).join(' ')), [angle])

  return (
    <div style={{ position: 'relative', height: 240 }}>
      <button className="icon-btn" onClick={() => exportSvg('growth-radar', 'growth-radar')} style={{ position: 'absolute', right: 0, top: 0, width: 28, height: 28 }}>SVG</button>
      <svg id="growth-radar" width="100%" height="240" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Growth factor radar chart">
        {grid.map((points, index) => <polygon key={index} points={points} fill="none" stroke="var(--chart-grid)" />)}
        {axes.map((axis, index) => {
          const end = point(center, radius + 8, angle(index))
          const label = point(center, radius + 28, angle(index))
          return <g key={axis}><line x1={center} y1={center} x2={end[0]} y2={end[1]} stroke="var(--chart-grid)" /><text x={label[0]} y={label[1]} textAnchor="middle" fill="white" fontSize="9">{axis.split(' ')[0]}</text></g>
        })}
        <polygon points={path(baseline)} fill="none" stroke="var(--color-text-muted)" strokeDasharray="5 4" />
        <polygon points={path(current)} fill={color} fillOpacity="0.4" stroke={color} strokeWidth="2" />
      </svg>
    </div>
  )
}

function point(center: number, radius: number, angle: number) {
  return [center + Math.cos(angle) * radius, center + Math.sin(angle) * radius]
}

function normalize(m: any) {
  return [
    clamp(m.econ_housing_afford),
    clamp((m.econ_jobs_created / 500000) * 100),
    clamp(m.mobility_transit_coverage),
    clamp(m.env_green_ratio * 2.5),
    clamp(m.equity_school_access),
    clamp(m.equity_hosp_coverage),
    clamp(100 - m.env_flood_exposure),
    clamp((m.econ_gdp_est / Math.max(1, m.pop_total)) / 1000),
  ]
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value || 0))
}
