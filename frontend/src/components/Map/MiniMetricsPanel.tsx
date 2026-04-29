import { useUIStore } from '@/stores/uiStore'
import { useSimulationStore } from '@/stores/simulationStore'

export function MiniMetricsPanel() {
  const metrics = useSimulationStore((state) => state.currentFrame?.metrics_snapshot)
  const openDashboard = useUIStore((state) => state.openDashboard)
  const cards = [
    ['Population', compact(metrics?.pop_total ?? 0), ''],
    ['Commute', Math.round(metrics?.mobility_commute ?? 0), 'min'],
    ['Equity', Math.round(100 - (metrics?.equity_infra_gini ?? 0)), ''],
    ['CO2', Math.round(metrics?.env_co2_est ?? 0), 'kt'],
  ]
  return (
    <button onMouseEnter={openDashboard} style={{ position: 'absolute', right: 18, bottom: 18, zIndex: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, border: 0, background: 'transparent' }}>
      {cards.map(([label, value, unit]) => (
        <div key={label} style={{ width: 90, height: 70, border: '1px solid var(--color-border-subtle)', borderRadius: 8, background: 'var(--color-bg-panel)', boxShadow: 'var(--shadow-md)', padding: 10, color: 'white', textAlign: 'left' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
          <strong style={{ fontSize: 20 }}>{value}</strong>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}> {unit}</span>
        </div>
      ))}
    </button>
  )
}

function compact(value: number) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
