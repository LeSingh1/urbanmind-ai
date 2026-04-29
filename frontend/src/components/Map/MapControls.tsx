import { useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Plus, Minus, RotateCcw, Layers, Grid } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

const LAYER_OPTIONS = [
  { id: 'zones', label: 'Zones' },
  { id: 'population', label: 'Population' },
  { id: 'flood_risk', label: 'Flood Risk' },
  { id: 'transit', label: 'Transit' },
  { id: 'equity', label: 'Equity' },
] as const

interface MapControlsProps {
  map: maplibregl.Map
}

export function MapControls({ map }: MapControlsProps) {
  const { activeMapLayer, setActiveMapLayer, detailedGrid, setDetailedGrid } = useUIStore()
  const [showLayers, setShowLayers] = useState(false)

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2">
      {/* Zoom controls */}
      <div className="flex flex-col bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
        <button
          onClick={() => map.zoomIn()}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all border-b border-border-subtle"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => map.zoomOut()}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all"
        >
          <Minus size={14} />
        </button>
      </div>

      {/* Reset north */}
      <button
        onClick={() => map.resetNorth()}
        className="p-2 bg-bg-card border border-border-subtle rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all"
      >
        <RotateCcw size={14} />
      </button>

      {/* Detail Grid toggle */}
      <button
        onClick={() => setDetailedGrid(!detailedGrid)}
        title={detailedGrid ? 'Showing full grid — click for key areas only' : 'Showing key areas only — click for full grid'}
        className={`p-2 border rounded-lg transition-all ${detailedGrid ? 'border-accent-blue text-accent-blue bg-accent-blue/10' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-secondary'}`}
      >
        <Grid size={14} />
      </button>

      {/* Layer selector */}
      <div className="relative">
        <button
          onClick={() => setShowLayers((v) => !v)}
          className={`p-2 bg-bg-card border rounded-lg transition-all ${showLayers ? 'border-accent-blue text-accent-blue' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-secondary'}`}
        >
          <Layers size={14} />
        </button>
        {showLayers && (
          <div className="absolute right-10 top-0 bg-bg-card border border-border-subtle rounded-lg overflow-hidden w-32">
            {LAYER_OPTIONS.map((layer) => (
              <button
                key={layer.id}
                onClick={() => { setActiveMapLayer(layer.id); setShowLayers(false) }}
                className={`w-full px-3 py-1.5 text-xs text-left transition-all ${
                  activeMapLayer === layer.id
                    ? 'text-accent-blue bg-accent-blue/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
