import { motion } from 'framer-motion'
import type { ZoneType } from '@/types/city.types'
import { ZONE_LABELS, ZONE_ICONS, ZONE_COLORS } from '@/utils/colorUtils'
import { useUIStore } from '@/stores/uiStore'
import { useCityStore } from '@/stores/cityStore'
import { useSimulationStore } from '@/stores/simulationStore'

const ZONE_CATEGORIES: { label: string; zones: ZoneType[] }[] = [
  { label: 'Residential', zones: ['RES_LOW', 'RES_MED', 'RES_HIGH'] },
  { label: 'Commercial', zones: ['COM_RETAIL', 'COM_OFFICE', 'MIX_USE'] },
  { label: 'Industrial', zones: ['IND_LIGHT', 'IND_HEAVY'] },
  { label: 'Green Space', zones: ['GREEN_PARK', 'GREEN_FOREST'] },
  { label: 'Health & Edu', zones: ['HEALTH_CLINIC', 'HEALTH_HOSP', 'EDU_SCHOOL', 'EDU_UNIVERSITY'] },
  { label: 'Infrastructure', zones: ['INFRA_POWER', 'INFRA_WATER', 'TRANS_HUB', 'TRANS_HIGHWAY'] },
  { label: 'Safety', zones: ['SAFETY_FIRE', 'SAFETY_POLICE'] },
]

interface ZonePaletteProps {
  ws: { override: (x: number, y: number, zone: string) => void }
}

export function ZonePalette({ ws: _ws }: ZonePaletteProps) {
  const {
    selectedZoneForPlacement,
    setSelectedZoneForPlacement,
    isPlacementMode,
    togglePlacementMode,
  } = useUIStore()
  const { selectedCell } = useCityStore()
  const { session } = useSimulationStore()

  const handleZoneSelect = (zone: ZoneType) => {
    setSelectedZoneForPlacement(zone)
    if (!isPlacementMode) togglePlacementMode()
  }

  return (
    <div className="p-3 space-y-4">
      {/* Instructions */}
      <div className="bg-bg-card rounded-lg p-3 text-xs text-text-secondary leading-relaxed">
        Select a zone type then click on the map to place it. The AI will calculate the consequence of your override.
      </div>

      {/* Placement mode toggle */}
      <button
        onClick={togglePlacementMode}
        disabled={!session}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
          isPlacementMode
            ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
            : 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30 hover:bg-accent-blue/30'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isPlacementMode ? 'x Exit Placement Mode' : '+ Enter Placement Mode'}
      </button>

      {/* Zone categories */}
      {ZONE_CATEGORIES.map(({ label, zones }) => (
        <div key={label}>
          <div className="text-xs text-text-muted uppercase tracking-wide mb-1.5">{label}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {zones.map((zone) => (
              <motion.button
                key={zone}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleZoneSelect(zone)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all text-left ${
                  selectedZoneForPlacement === zone
                    ? 'border-current'
                    : 'border-border-subtle hover:border-border-active'
                }`}
                style={
                  selectedZoneForPlacement === zone
                    ? {
                        backgroundColor: ZONE_COLORS[zone] + '22',
                        borderColor: ZONE_COLORS[zone] + '88',
                        color: ZONE_COLORS[zone],
                      }
                    : {}
                }
              >
                <span className="text-sm shrink-0">{ZONE_ICONS[zone]}</span>
                <span className="text-xs text-text-secondary truncate">
                  {ZONE_LABELS[zone]}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      ))}

      {/* Clear zone */}
      <button
        onClick={() => handleZoneSelect('EMPTY')}
        className="w-full py-1.5 border border-dashed border-border-subtle rounded-lg text-xs text-text-muted hover:text-text-secondary hover:border-border-active transition-all"
      >
        Clear Zone (EMPTY)
      </button>
    </div>
  )
}
