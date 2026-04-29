import { motion } from 'framer-motion'
import { useCityStore } from '@/stores/cityStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useAIStore } from '@/stores/aiStore'
import { ZONE_LABELS, ZONE_ICONS, ZONE_COLORS } from '@/utils/colorUtils'

export function RightPanel() {
  const { hoveredCell, selectedCell, selectedCity } = useCityStore()
  const { currentMetrics, recentActions } = useSimulationStore()
  const { latestExplanation } = useAIStore()

  const cell = selectedCell ?? hoveredCell

  return (
    <div className="w-60 bg-bg-secondary border-l border-border-subtle flex flex-col overflow-hidden shrink-0">
      {/* Cell info */}
      <div className="p-3 border-b border-border-subtle shrink-0">
        <div className="text-xs text-text-muted uppercase tracking-wide mb-2">Cell Info</div>
        {cell ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-lg"
                style={{ backgroundColor: ZONE_COLORS[cell.zone_type] + '33' }}
              >
                {ZONE_ICONS[cell.zone_type]}
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">
                  {ZONE_LABELS[cell.zone_type]}
                </div>
                <div className="text-xs text-text-muted font-mono">
                  ({cell.x}, {cell.y})
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="text-text-muted">Lat</div>
              <div className="text-text-secondary font-mono">{cell.lat.toFixed(4)}</div>
              <div className="text-text-muted">Lng</div>
              <div className="text-text-secondary font-mono">{cell.lng.toFixed(4)}</div>
              <div className="text-text-muted">Flood Risk</div>
              <div className="text-text-secondary">{cell.flood_risk.toFixed(1)}/10</div>
              <div className="text-text-muted">Population</div>
              <div className="text-text-secondary">{cell.population.toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted">Hover over a cell to inspect</p>
        )}
      </div>

      {/* Latest AI explanation */}
      {latestExplanation && (
        <div className="p-3 border-b border-border-subtle shrink-0">
          <div className="text-xs text-text-muted uppercase tracking-wide mb-2">AI Insight</div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm">{ZONE_ICONS[latestExplanation.zone_type as keyof typeof ZONE_ICONS] ?? 'AI'}</span>
            <span className="text-xs font-medium text-text-secondary">{latestExplanation.zone_type}</span>
            <span className="text-xs text-text-muted">— Year {latestExplanation.year}</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{latestExplanation.explanation}</p>
          {latestExplanation.cached && (
            <span className="text-xs text-text-muted italic">cached</span>
          )}
        </div>
      )}

      {/* Recent actions */}
      <div className="p-3 flex-1 overflow-hidden flex flex-col">
        <div className="text-xs text-text-muted uppercase tracking-wide mb-2">Recent Actions</div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {recentActions.length === 0 ? (
            <p className="text-xs text-text-muted">No actions yet</p>
          ) : (
            recentActions.slice(0, 15).map((action, i) => (
              <motion.div
                key={`${action.x}-${action.y}-${i}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: ZONE_COLORS[action.zone_type] }}
                />
                <div className="text-xs text-text-secondary truncate flex-1">
                  {ZONE_LABELS[action.zone_type]}
                </div>
                <div className="text-xs text-text-muted font-mono shrink-0">
                  {action.sps_score.toFixed(2)}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* City vitals */}
      {currentMetrics && (
        <div className="p-3 border-t border-border-subtle shrink-0">
          <div className="text-xs text-text-muted uppercase tracking-wide mb-2">City Vitals</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="text-text-muted">Health</div>
            <div className="font-mono" style={{ color: currentMetrics.overall_health > 60 ? '#10b981' : currentMetrics.overall_health > 40 ? '#f59e0b' : '#ef4444' }}>
              {currentMetrics.overall_health.toFixed(0)}/100
            </div>
            <div className="text-text-muted">Happiness</div>
            <div className="text-text-secondary font-mono">{currentMetrics.happiness_index.toFixed(1)}/10</div>
            <div className="text-text-muted">Equity</div>
            <div className="text-text-secondary font-mono">{currentMetrics.equity_index.toFixed(1)}/10</div>
          </div>
        </div>
      )}
    </div>
  )
}
