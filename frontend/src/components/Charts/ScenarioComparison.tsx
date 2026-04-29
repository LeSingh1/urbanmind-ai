import * as d3 from 'd3'
import { useSimulationStore } from '@/stores/simulationStore'
import { exportSvg, useChartSize } from './chartUtils'

export function ScenarioComparison() {
  const { ref, width } = useChartSize<HTMLDivElement>()
  const m = useSimulationStore((state) => state.currentFrame?.metrics_snapshot)
  const groups = [
    ['Population', norm((m?.pop_total ?? 0) / 40000000), norm((m?.pop_total ?? 0) / 35000000)],
    ['Commute', 100 - (m?.mobility_commute ?? 40), 100 - (m?.mobility_commute ?? 40) + 8],
    ['Equity', 100 - (m?.equity_infra_gini ?? 30), 100 - (m?.equity_infra_gini ?? 30) + 12],
    ['CO2', 100 - (m?.env_co2_est ?? 50) / 10, 100 - (m?.env_co2_est ?? 50) / 12],
    ['GDP', norm((m?.econ_gdp_est ?? 0) / 1e12), norm((m?.econ_gdp_est ?? 0) / 1.2e12)],
    ['Green Space', m?.env_green_ratio ?? 20, (m?.env_green_ratio ?? 20) + 10],
  ]
  const height = 200
  const margin = { top: 28, right: 16, bottom: 36, left: 36 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const x0 = d3.scaleBand().domain(groups.map((g) => g[0] as string)).range([0, innerW]).padding(0.2)
  const x1 = d3.scaleBand().domain(['a', 'b']).range([0, x0.bandwidth()]).padding(0.12)
  const y = d3.scaleLinear().domain([0, 100]).range([innerH, 0])
  return (
    <div ref={ref} style={{ position: 'relative', height }}>
      <button className="icon-btn" onClick={() => exportSvg('scenario-comparison', 'scenario-comparison')} style={{ position: 'absolute', right: 0, top: 0, width: 28, height: 28 }}>SVG</button>
      <svg id="scenario-comparison" width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {groups.map(([label, a, b]) => {
            const base = x0(label as string) ?? 0
            const better = Number(b) >= Number(a)
            return <g key={label as string} transform={`translate(${base},0)`}><rect x={x1('a')} y={y(Number(a))} width={x1.bandwidth()} height={innerH - y(Number(a))} fill="var(--color-brand-secondary)" /><rect x={x1('b')} y={y(Number(b))} width={x1.bandwidth()} height={innerH - y(Number(b))} fill="var(--color-brand-accent)" /><text x={x0.bandwidth() / 2} y={Math.min(y(Number(a)), y(Number(b))) - 6} textAnchor="middle" fontSize="10" fill={better ? 'var(--color-brand-accent)' : 'var(--color-brand-danger)'}>{better ? '+' : ''}{Math.round(Number(b) - Number(a))}%</text><text x={x0.bandwidth() / 2} y={innerH + 22} textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">{label}</text></g>
          })}
        </g>
      </svg>
    </div>
  )
}

function norm(value: number) {
  return Math.max(0, Math.min(100, value * 100))
}
