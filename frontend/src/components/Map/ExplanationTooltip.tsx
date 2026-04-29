import { useEffect, useState } from 'react'
import { useAIStore } from '@/stores/aiStore'
import { useCityStore } from '@/stores/cityStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useUIStore } from '@/stores/uiStore'
import { getZoneColor } from '@/utils/colorUtils'

type DataSource = 'real' | 'estimated' | 'projected'

const DATA_SOURCE_STYLES: Record<DataSource, { label: string; color: string; bg: string }> = {
  real:      { label: 'Real Data',  color: '#4ADE80', bg: 'rgba(74,222,128,0.15)' },
  estimated: { label: 'Estimated',  color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  projected: { label: 'Projected',  color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
}

export function ExplanationTooltip({ hover }: { hover: { x: number; y: number; properties: any } }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const city = useCityStore((state) => state.selectedCity)
  const scenario = useScenarioStore((state) => state.activeScenario)
  const currentFrame = useSimulationStore((state) => state.currentFrame)
  const fetchExplanation = useAIStore((state) => state.fetchExplanation)
  const openDrawer = useUIStore((state) => state.openDrawer)

  const props = hover.properties ?? {}
  const zone = props.zone_type_id ?? 'RES_LOW_DETACHED'
  const display = humanize(zone)
  const buildingName: string | null = props.building_name ?? null
  const category: string | null = props.category ?? null
  const dataSource: DataSource = (props.data_source as DataSource) ?? 'estimated'
  const srcStyle = DATA_SOURCE_STYLES[dataSource] ?? DATA_SOURCE_STYLES.estimated
  const action = currentFrame?.agent_actions.find((item: any) => item.zone_type_id === zone) ?? currentFrame?.agent_actions[0]

  useEffect(() => {
    let alive = true
    setLoading(true)
    setText('')
    const timer = window.setTimeout(() => {
      fetchExplanation({
        type: 'zone_explanation',
        zone_type_id: zone,
        zone_display_name: buildingName ?? display,
        city_name: city?.name ?? 'the city',
        surrounding_context: buildingName
          ? `This tile represents ${buildingName}, a ${category ?? display} site. ${dataSource === 'real' ? 'Data sourced from real-world records.' : dataSource === 'projected' ? 'This is a projected future development.' : 'Data is estimated based on zoning and regional patterns.'}`
          : 'Nearby zones, road access, service coverage, terrain conditions, and forecast growth pressure.',
        metrics_delta: currentFrame?.metrics_snapshot ?? {},
        scenario_goal: scenario,
      }).then((result) => {
        if (alive) {
          setText(result)
          setLoading(false)
        }
      })
    }, 100)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [city?.name, currentFrame?.metrics_snapshot, display, fetchExplanation, scenario, zone, buildingName])

  const content = {
    zone_type_id: zone,
    zone_display_name: buildingName ?? display,
    x: action?.x ?? Number(props.x ?? 0),
    y: action?.y ?? Number(props.y ?? 0),
    year: currentFrame?.year ?? 0,
    explanation_text: text || 'Loading...',
    metrics_delta: currentFrame?.metrics_snapshot ?? {},
    surrounding_context: buildingName ? `${buildingName} — ${category ?? display}` : 'Nearby zones, transit distance, terrain class, and scenario objective.',
  }
  const left = hover.x > window.innerWidth - 340 ? hover.x - 300 : hover.x + 14

  return (
    <button
      onClick={() => openDrawer(content)}
      style={{ position: 'absolute', left, top: hover.y + 70, zIndex: 20, maxWidth: 290, padding: 16, borderRadius: 12, textAlign: 'left', background: 'rgba(17,24,39,0.94)', border: '1px solid rgba(96,165,250,0.3)', backdropFilter: 'blur(16px)', boxShadow: 'var(--shadow-md)', color: 'white' }}
    >
      {/* Zone color dot + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: buildingName ? 2 : 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: getZoneColor(zone), flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700 }}>{buildingName ?? display}</span>
      </div>

      {/* Building → zone type subline */}
      {buildingName && (
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8, paddingLeft: 18 }}>
          {category ? `${category} · ` : ''}{display}
        </div>
      )}

      {/* Data source badge */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: srcStyle.bg, color: srcStyle.color, marginBottom: 10 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: srcStyle.color }} />
        {srcStyle.label}
      </span>

      {/* AI explanation */}
      {loading ? <Skeleton /> : (
        <p style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0 0 8px', color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.45 }}>{text}</p>
      )}

      <span style={{ color: 'var(--color-text-accent)', fontSize: 12, fontWeight: 700 }}>View full</span>
    </button>
  )
}

function Skeleton() {
  return <div style={{ margin: '8px 0 10px', display: 'grid', gap: 6 }}>{[100, 82, 64].map((width) => <span key={width} className="skeleton" style={{ width: `${width}%`, height: 9, borderRadius: 999 }} />)}</div>
}

function humanize(value: string) {
  return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}
