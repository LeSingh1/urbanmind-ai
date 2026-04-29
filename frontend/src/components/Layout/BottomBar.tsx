import { useMemo } from 'react'
import * as d3 from 'd3'
import { useSimulationStore } from '@/stores/simulationStore'
import { getZoneColor } from '@/utils/colorUtils'

export function BottomBar() {
  const currentYear = useSimulationStore((state) => state.currentYear)
  const frameHistory = useSimulationStore((state) => state.frameHistory)
  const scrubToYear = useSimulationStore((state) => state.scrubToYear)
  const zoneCounts = useMemo(() => {
    const counts = new Map<string, number>()
    const features = frameHistory.at(-1)?.zones_geojson.features ?? []
    features.forEach((feature) => {
      const zone = String(feature.properties?.zone_type_id ?? feature.properties?.zone_type ?? 'ZONE')
      counts.set(zone, (counts.get(zone) ?? 0) + 1)
    })
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [frameHistory])

  return (
    <footer style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, zIndex: 50, display: 'flex', background: 'var(--color-bg-sidebar)', borderTop: '1px solid var(--color-border-subtle)' }}>
      <div style={{ width: '70%', padding: '10px 22px' }}>
        <Timeline currentYear={currentYear} years={frameHistory.map((frame) => frame.year)} onScrub={scrubToYear} />
      </div>
      <div style={{ width: '30%', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 18px', borderLeft: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
        {zoneCounts.length === 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Zone legend appears as the simulation expands.</span>}
        {zoneCounts.map(([zone]) => (
          <button key={zone} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, border: '1px solid var(--color-border-subtle)', borderRadius: 4, background: 'transparent', color: 'var(--color-text-muted)', fontSize: 10, textTransform: 'uppercase' }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: getZoneColor(zone) }} />
            {zone.replace(/_/g, ' ').slice(0, 16)}
          </button>
        ))}
      </div>
    </footer>
  )
}

function Timeline({ currentYear, years, onScrub }: { currentYear: number; years: number[]; onScrub: (year: number) => void }) {
  const width = 760
  const height = 40
  const maxYear = Math.max(50, ...years, currentYear)
  const x = d3.scaleLinear().domain([0, maxYear]).range([16, width - 16])
  const progress = x(currentYear)
  const events = years.filter((year) => year % 10 === 0)
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} onClick={(event) => {
      const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect()
      const raw = ((event.clientX - rect.left) / rect.width) * width
      onScrub(Math.round(x.invert(raw)))
    }}>
      <line x1="16" x2={width - 16} y1="22" y2="22" stroke="var(--color-bg-card)" strokeWidth="4" strokeLinecap="round" />
      <line x1="16" x2={progress} y1="22" y2="22" stroke="var(--color-brand-accent)" strokeWidth="4" strokeLinecap="round" />
      {events.map((year) => <circle key={year} cx={x(year)} cy="22" r="5" fill={year % 20 === 0 ? '#8E44AD' : '#E67E22'}><title>Planning event · Year {year}</title></circle>)}
      <circle cx={progress} cy="22" r="8" fill="white" stroke="var(--color-brand-accent)" strokeWidth="2" />
      <text x={progress} y="11" fill="var(--color-text-secondary)" fontSize="11" textAnchor="middle">Year {currentYear}</text>
    </svg>
  )
}
