import { motion } from 'framer-motion'
import type { ZoneType } from '@/types/city.types'
import { ZONE_LABELS, ZONE_ICONS, ZONE_COLORS } from '@/utils/colorUtils'
import { useUIStore } from '@/stores/uiStore'

interface PlacementIndicatorProps {
  zone: ZoneType
}

export function PlacementIndicator({ zone }: PlacementIndicatorProps) {
  const { togglePlacementMode } = useUIStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-bg-card/95 border rounded-xl px-4 py-2.5 shadow-xl backdrop-blur-sm"
      style={{ borderColor: ZONE_COLORS[zone] + '66' }}
    >
      <div
        className="w-6 h-6 rounded flex items-center justify-center text-sm"
        style={{ backgroundColor: ZONE_COLORS[zone] + '33' }}
      >
        {ZONE_ICONS[zone]}
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: ZONE_COLORS[zone] }}>
          {ZONE_LABELS[zone]}
        </div>
        <div className="text-xs text-text-muted">Click on map to place zone</div>
      </div>
      <button
        onClick={togglePlacementMode}
        className="ml-2 text-xs text-text-muted hover:text-text-primary border border-border-subtle rounded px-2 py-1"
      >
        Cancel
      </button>
    </motion.div>
  )
}
