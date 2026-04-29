import { useState } from 'react'
import { ScenarioComparison } from '@/components/Charts/ScenarioComparison'
import { scenarioColors, scenarioLabels, useScenarioStore } from '@/stores/scenarioStore'
import { useSimulationStore } from '@/stores/simulationStore'

export function SplitScreenView() {
  const [leftBasis, setLeftBasis] = useState(50)
  const active = useScenarioStore((state) => state.activeScenario)
  const metrics = useSimulationStore((state) => state.currentFrame?.metrics_snapshot)
  const startDrag = (event: React.PointerEvent) => {
    const target = event.currentTarget.parentElement
    if (!target) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const move = (moveEvent: PointerEvent) => {
      const rect = target.getBoundingClientRect()
      setLeftBasis(Math.max(30, Math.min(70, ((moveEvent.clientX - rect.left) / rect.width) * 100)))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', background: '#080B10' }}>
      <Pane basis={leftBasis} label={scenarioLabels[active]} color={scenarioColors[active]} metrics={metrics} />
      <div onPointerDown={startDrag} style={{ width: 4, cursor: 'col-resize', background: 'var(--color-border-subtle)', zIndex: 3 }} />
      <Pane basis={100 - leftBasis} label="Max Growth" color={scenarioColors.max_growth} metrics={metrics} />
      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 24, height: 230, border: '1px solid var(--color-border-subtle)', borderRadius: 8, background: 'rgba(17,24,39,0.9)', padding: 12 }}>
        <ScenarioComparison />
      </div>
    </div>
  )
}

function Pane({ basis, label, color, metrics }: { basis: number; label: string; color: string; metrics: any }) {
  return (
    <section style={{ flexBasis: `${basis}%`, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #111827, #0D1117)' }}>
      <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRight: `4px solid ${color}`, background: 'rgba(17,24,39,0.92)', padding: '0 12px', fontWeight: 800 }}>{label}</div>
      <div style={{ position: 'absolute', top: 48, left: 14, display: 'flex', gap: 8 }}>
        {[
          ['Pop', compact(metrics?.pop_total ?? 0)],
          ['Commute', `${Math.round(metrics?.mobility_commute ?? 0)}m`],
          ['Green', `${Math.round(metrics?.env_green_ratio ?? 0)}%`],
        ].map(([k, v]) => <span key={k} style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 8, background: 'rgba(13,17,23,0.72)', padding: '6px 8px', fontSize: 12 }}>{k} {v}</span>)}
      </div>
      <div style={{ position: 'absolute', inset: '32px 0 0', display: 'grid', placeItems: 'center', color: 'var(--color-text-muted)' }}>Synchronized scenario map</div>
    </section>
  )
}

function compact(value: number) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
