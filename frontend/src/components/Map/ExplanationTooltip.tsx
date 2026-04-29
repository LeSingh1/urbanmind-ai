import { useEffect, useState } from 'react'
import { useAIStore } from '@/stores/aiStore'
import { useCityStore } from '@/stores/cityStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useUIStore } from '@/stores/uiStore'
import { getZoneColor } from '@/utils/colorUtils'

export function ExplanationTooltip({ hover }: { hover: { x: number; y: number; properties: any } }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const city = useCityStore((state) => state.selectedCity)
  const scenario = useScenarioStore((state) => state.activeScenario)
  const currentFrame = useSimulationStore((state) => state.currentFrame)
  const fetchExplanation = useAIStore((state) => state.fetchExplanation)
  const openDrawer = useUIStore((state) => state.openDrawer)
  const zone = hover.properties?.zone_type_id ?? 'RES_LOW_DETACHED'
  const display = humanize(zone)
  const action = currentFrame?.agent_actions.find((item) => item.zone_type_id === zone) ?? currentFrame?.agent_actions[0]

  useEffect(() => {
    let alive = true
    setLoading(true)
    setText('')
    const timer = window.setTimeout(() => {
      fetchExplanation({
        type: 'zone_explanation',
        zone_type_id: zone,
        zone_display_name: display,
        city_name: city?.name ?? 'the city',
        surrounding_context: 'Nearby zones, road access, service coverage, terrain conditions, and forecast growth pressure.',
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
  }, [city?.name, currentFrame?.metrics_snapshot, display, fetchExplanation, scenario, zone])

  const content = {
    zone_type_id: zone,
    zone_display_name: display,
    x: action?.x ?? Number(hover.properties?.x ?? 0),
    y: action?.y ?? Number(hover.properties?.y ?? 0),
    year: currentFrame?.year ?? 0,
    explanation_text: text || 'Loading...',
    metrics_delta: currentFrame?.metrics_snapshot ?? {},
    surrounding_context: 'Nearby zones, transit distance, terrain class, and scenario objective.',
  }
  const left = hover.x > window.innerWidth - 340 ? hover.x - 300 : hover.x + 14
  return (
    <button
      onClick={() => openDrawer(content)}
      style={{ position: 'absolute', left, top: hover.y + 70, zIndex: 20, maxWidth: 280, padding: 16, borderRadius: 12, textAlign: 'left', background: 'rgba(17,24,39,0.92)', border: '1px solid rgba(96,165,250,0.3)', backdropFilter: 'blur(16px)', boxShadow: 'var(--shadow-md)', color: 'white' }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: getZoneColor(zone) }} />
        {display}
      </div>
      {loading ? <Skeleton /> : <p style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '10px 0 8px', color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.45 }}>{text}</p>}
      <span style={{ color: 'var(--color-text-accent)', fontSize: 12, fontWeight: 700 }}>View full</span>
    </button>
  )
}

function Skeleton() {
  return <div style={{ margin: '12px 0', display: 'grid', gap: 6 }}>{[100, 82, 64].map((width) => <span key={width} className="skeleton" style={{ width: `${width}%`, height: 9, borderRadius: 999 }} />)}</div>
}

function humanize(value: string) {
  return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}
