import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { motion } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulationStore'
import { METRIC_CONFIGS, type MetricConfig } from '@/utils/metricsUtils'
import type { CityMetrics } from '@/types/city.types'

const CATEGORIES = ['mobility', 'economy', 'environment', 'social', 'infrastructure'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_COLORS: Record<Category, string> = {
  mobility: '#3b82f6',
  economy: '#f59e0b',
  environment: '#10b981',
  social: '#8b5cf6',
  infrastructure: '#06b6d4',
}

export function MetricsDashboard() {
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const { currentMetrics, metricsHistory } = useSimulationStore()

  const visibleMetrics = METRIC_CONFIGS.filter(
    (m) => activeCategory === 'all' || m.category === activeCategory
  ).slice(0, 12)

  return (
    <div className="p-3 space-y-4">
      {/* Category filter */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-2 py-0.5 rounded text-xs transition-all ${activeCategory === 'all' ? 'bg-text-muted/20 text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-0.5 rounded text-xs transition-all capitalize ${activeCategory === cat ? 'text-white' : 'text-text-muted hover:text-text-secondary'}`}
            style={activeCategory === cat ? { backgroundColor: CATEGORY_COLORS[cat] + '33', color: CATEGORY_COLORS[cat] } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {!currentMetrics ? (
        <div className="text-center py-8 text-text-muted text-sm">
          Start simulation to see live metrics
        </div>
      ) : (
        <>
          {/* Overall health gauge */}
          <HealthGauge value={currentMetrics.overall_health} />

          {/* Metric bars */}
          <div className="space-y-2">
            {visibleMetrics.map((config) => (
              <MetricRow
                key={config.key}
                config={config}
                metrics={currentMetrics}
                history={metricsHistory}
              />
            ))}
          </div>

          {/* Time series chart */}
          {metricsHistory.length > 2 && (
            <MetricsChart history={metricsHistory} />
          )}
        </>
      )}
    </div>
  )
}

function HealthGauge({ value }: { value: number }) {
  const color = value > 70 ? '#10b981' : value > 50 ? '#f59e0b' : '#ef4444'
  const angle = -135 + (value / 100) * 270

  return (
    <div className="flex flex-col items-center py-2">
      <div className="relative w-24 h-14 overflow-hidden">
        <svg viewBox="0 0 100 60" className="w-full h-full">
          <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#1e2d47" strokeWidth="8" strokeLinecap="round" />
          <motion.path
            d="M 10 55 A 40 40 0 0 1 90 55"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="125.7"
            strokeDashoffset={125.7}
            animate={{ strokeDashoffset: 125.7 - (value / 100) * 125.7 }}
            transition={{ duration: 0.5 }}
          />
          <line
            x1="50" y1="55"
            x2={50 + 28 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={55 + 28 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="50" cy="55" r="3" fill={color} />
        </svg>
      </div>
      <div className="text-center -mt-1">
        <div className="text-2xl font-bold font-mono" style={{ color }}>{value.toFixed(0)}</div>
        <div className="text-xs text-text-muted">City Health Score</div>
      </div>
    </div>
  )
}

function MetricRow({ config, metrics, history }: {
  config: MetricConfig
  metrics: CityMetrics
  history: CityMetrics[]
}) {
  const value = metrics[config.key] as number
  const pct = Math.max(0, Math.min(100, ((value - config.min) / (config.max - config.min)) * 100))
  const isGood = config.higherIsBetter ? pct > 60 : pct < 40
  const color = isGood ? '#10b981' : pct > 30 && pct < 70 ? '#f59e0b' : '#ef4444'

  const prev = history.length > 1 ? history[history.length - 2][config.key] as number : null
  const delta = prev !== null ? value - prev : null

  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs text-text-secondary">{config.label}</span>
        <div className="flex items-center gap-1">
          {delta !== null && Math.abs(delta) > 0.001 && (
            <span className={`text-xs font-mono ${
              (config.higherIsBetter ? delta > 0 : delta < 0) ? 'text-accent-green' : 'text-accent-red'
            }`}>
              {delta > 0 ? '▲' : '▼'}
            </span>
          )}
          <span className="text-xs font-mono text-text-primary">{config.format(value)}</span>
        </div>
      </div>
      <div className="h-1 bg-bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  )
}

function MetricsChart({ history }: { history: CityMetrics[] }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || history.length < 2) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth || 240
    const height = 80
    const margin = { top: 8, right: 8, bottom: 16, left: 24 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const xScale = d3.scaleLinear().domain([0, history.length - 1]).range([0, innerW])
    const yScale = d3.scaleLinear().domain([0, 100]).range([innerH, 0])

    const metrics: Array<{ key: keyof CityMetrics; color: string; label: string }> = [
      { key: 'mobility_score', color: '#3b82f6', label: 'Mobility' },
      { key: 'economic_score', color: '#f59e0b', label: 'Economy' },
      { key: 'sustainability_score', color: '#10b981', label: 'Sustain.' },
      { key: 'overall_health', color: '#e2e8f0', label: 'Health' },
    ]

    metrics.forEach(({ key, color }) => {
      const line = d3.line<CityMetrics>()
        .x((_, i) => xScale(i))
        .y((d) => yScale(d[key] as number))
        .curve(d3.curveCatmullRom)

      g.append('path')
        .datum(history)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.8)
        .attr('d', line)
    })

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(4).tickFormat((d) => `Y${history[d as number]?.year ?? ''}`))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('text').attr('fill', '#64748b').style('font-size', '9px'))
      .call((g) => g.selectAll('line').attr('stroke', '#1e2d47'))

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(3))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('text').attr('fill', '#64748b').style('font-size', '9px'))
      .call((g) => g.selectAll('line').attr('stroke', '#1e2d47'))

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${margin.left},${height - 2})`)
    metrics.forEach(({ color, label }, i) => {
      const g2 = legend.append('g').attr('transform', `translate(${i * 55},0)`)
      g2.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 10).attr('y2', 0)
        .attr('stroke', color).attr('stroke-width', 1.5)
      g2.append('text').attr('x', 13).attr('y', 3)
        .attr('fill', '#64748b').style('font-size', '8px').text(label)
    })
  }, [history])

  return (
    <div>
      <div className="text-xs text-text-muted mb-1">Score History</div>
      <svg ref={svgRef} className="w-full" height={96} />
    </div>
  )
}
