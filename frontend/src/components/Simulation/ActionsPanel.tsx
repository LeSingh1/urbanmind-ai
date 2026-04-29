import { motion } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulationStore'
import { ZONE_LABELS, ZONE_ICONS, ZONE_COLORS } from '@/utils/colorUtils'
import type { PlacementAction } from '@/types/simulation.types'

export function ActionsPanel() {
  const { recentActions, currentYear, currentStep, totalSteps } = useSimulationStore()

  return (
    <div className="p-3 space-y-3">
      {/* Progress */}
      <div className="bg-bg-card rounded-lg p-3">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-text-muted">Simulation Progress</span>
          <span className="text-text-secondary font-mono">
            Step {currentStep}/{totalSteps}
          </span>
        </div>
        <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full"
            animate={{ width: `${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-2 text-center text-xs text-text-muted">
          Year {currentYear} of {2024 + 50}
        </div>
      </div>

      {/* Zone placement counts */}
      {recentActions.length > 0 && (
        <div>
          <div className="text-xs text-text-muted mb-2">Zone Distribution</div>
          <ZoneDistribution actions={recentActions} />
        </div>
      )}

      {/* Action log */}
      <div>
        <div className="text-xs text-text-muted mb-2">
          Action Log ({recentActions.length} recent)
        </div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {recentActions.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">
              No zone placements yet
            </p>
          ) : (
            recentActions.map((action, i) => (
              <motion.div
                key={`${action.x}-${action.y}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 py-1 border-b border-border-subtle/50 last:border-0"
              >
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: ZONE_COLORS[action.zone_type] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-secondary truncate">
                    {ZONE_ICONS[action.zone_type]} {ZONE_LABELS[action.zone_type]}
                  </div>
                  <div className="text-xs text-text-muted font-mono">
                    ({action.x}, {action.y})
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono" style={{
                    color: action.sps_score > 0.7 ? '#10b981' : action.sps_score > 0.4 ? '#f59e0b' : '#ef4444'
                  }}>
                    {action.sps_score.toFixed(2)}
                  </div>
                  <div className="text-xs text-text-muted">SPS</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function ZoneDistribution({ actions }: { actions: PlacementAction[] }) {
  const counts: Record<string, number> = {}
  actions.forEach((a) => {
    counts[a.zone_type] = (counts[a.zone_type] ?? 0) + 1
  })

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const max = sorted[0]?.[1] ?? 1

  return (
    <div className="space-y-1">
      {sorted.map(([zone, count]) => (
        <div key={zone} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-sm shrink-0"
            style={{ backgroundColor: ZONE_COLORS[zone as keyof typeof ZONE_COLORS] ?? '#888' }}
          />
          <div className="text-xs text-text-muted w-20 truncate">{ZONE_LABELS[zone as keyof typeof ZONE_LABELS] ?? zone}</div>
          <div className="flex-1 h-1 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(count / max) * 100}%`,
                backgroundColor: ZONE_COLORS[zone as keyof typeof ZONE_COLORS] ?? '#888',
              }}
            />
          </div>
          <div className="text-xs font-mono text-text-muted w-5 text-right">{count}</div>
        </div>
      ))}
    </div>
  )
}
