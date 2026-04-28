import { useCityStore } from '@/stores/cityStore'
import { ZONE_LABELS, ZONE_ICONS, ZONE_COLORS } from '@/utils/colorUtils'

interface CellTooltipProps {
  position: { x: number; y: number }
}

export function CellTooltip({ position }: CellTooltipProps) {
  const { hoveredCell } = useCityStore()
  if (!hoveredCell) return null

  const { zone_type, x, y, population, flood_risk } = hoveredCell

  return (
    <div
      className="absolute pointer-events-none z-10 bg-bg-card/95 border border-border-subtle rounded-lg p-2.5 text-xs shadow-xl backdrop-blur-sm"
      style={{
        left: position.x + 12,
        top: position.y - 10,
        transform: position.x > window.innerWidth - 200 ? 'translateX(-110%)' : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: ZONE_COLORS[zone_type] }}
        />
        <span className="font-medium text-text-primary">{ZONE_LABELS[zone_type]}</span>
        <span className="text-lg">{ZONE_ICONS[zone_type]}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
        <span className="text-text-muted">Grid</span>
        <span className="text-text-secondary font-mono">({x}, {y})</span>
        <span className="text-text-muted">Population</span>
        <span className="text-text-secondary">{population.toLocaleString()}</span>
        <span className="text-text-muted">Flood risk</span>
        <span className={flood_risk > 7 ? 'text-accent-red' : flood_risk > 4 ? 'text-accent-amber' : 'text-accent-green'}>
          {flood_risk.toFixed(1)}/10
        </span>
      </div>
    </div>
  )
}
