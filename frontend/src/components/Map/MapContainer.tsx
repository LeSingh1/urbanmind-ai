import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { motion, AnimatePresence } from 'framer-motion'
import { useCityStore } from '@/stores/cityStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useUIStore } from '@/stores/uiStore'
import { gridToGeoJSON, lngLatToCell } from '@/utils/geoUtils'
import { ZONE_COLORS, ZONE_LABELS } from '@/utils/colorUtils'
import type { ZoneType } from '@/types/city.types'
import { MapControls } from './MapControls'
import { CellTooltip } from './CellTooltip'
import { PlacementIndicator } from './PlacementIndicator'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const hasMapboxToken = typeof MAPBOX_TOKEN === 'string' && MAPBOX_TOKEN.startsWith('pk.')

if (hasMapboxToken) {
  mapboxgl.accessToken = MAPBOX_TOKEN
}

interface MapContainerProps {
  ws: { override: (x: number, y: number, zone: string) => void }
}

export function MapContainer({ ws }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  const { selectedCity, grid, setHoveredCell, setSelectedCell, updateCell } = useCityStore()
  const { lastFrame } = useSimulationStore()
  const { isPlacementMode, selectedZoneForPlacement, activeMapLayer, showGrid } = useUIStore()

  if (!hasMapboxToken) {
    return (
      <LocalMapFallback
        isPlacementMode={isPlacementMode}
        selectedZoneForPlacement={selectedZoneForPlacement}
        onPlace={(x, y) => {
          if (!selectedZoneForPlacement) return
          ws.override(x, y, selectedZoneForPlacement)
          updateCell(x, y, selectedZoneForPlacement as ZoneType)
        }}
      />
    )
  }

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const center: [number, number] = selectedCity
      ? [selectedCity.coordinates.lng, selectedCity.coordinates.lat]
      : [-74.006, 40.7128]

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom: selectedCity ? 11 : 10,
      pitch: 30,
      bearing: 0,
      antialias: true,
    })

    map.current.on('load', () => {
      const m = map.current!

      // Zone fill layer
      m.addSource('zones', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      m.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': buildZoneColorExpression(),
          'fill-opacity': 0.75,
        },
      })

      m.addLayer({
        id: 'zones-outline',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': 'rgba(255,255,255,0.1)',
          'line-width': 0.5,
        },
      })

      // Highlight layer (for hover)
      m.addSource('highlight', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      m.addLayer({
        id: 'highlight-fill',
        type: 'fill',
        source: 'highlight',
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': 0.2,
        },
      })

      // Last-placed zone flash
      m.addSource('flash', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      m.addLayer({
        id: 'flash-fill',
        type: 'fill',
        source: 'flash',
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': ['interpolate', ['linear'], ['get', 'opacity'], 0, 0, 1, 0.6],
        },
      })

      setMapReady(true)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update zone source when grid changes
  useEffect(() => {
    if (!map.current || !mapReady || !selectedCity || grid.length === 0) return
    const m = map.current
    const source = m.getSource('zones') as mapboxgl.GeoJSONSource
    if (!source) return
    source.setData(gridToGeoJSON(grid, selectedCity))
  }, [grid, mapReady, selectedCity])

  // Flash on new placement
  useEffect(() => {
    if (!map.current || !mapReady || !lastFrame || !selectedCity) return
    const m = map.current
    const flashSource = m.getSource('flash') as mapboxgl.GeoJSONSource
    if (!flashSource) return

    const { x, y } = lastFrame.action
    const cell = grid[y]?.[x]
    if (!cell) return

    const bb = selectedCity.bounding_box
    const latStep = (bb.north - bb.south) / selectedCity.grid_size.rows
    const lngStep = (bb.east - bb.west) / selectedCity.grid_size.cols

    const feature = {
      type: 'Feature' as const,
      properties: { opacity: 1 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [bb.west + x * lngStep, bb.north - (y + 1) * latStep],
          [bb.west + (x + 1) * lngStep, bb.north - (y + 1) * latStep],
          [bb.west + (x + 1) * lngStep, bb.north - y * latStep],
          [bb.west + x * lngStep, bb.north - y * latStep],
          [bb.west + x * lngStep, bb.north - (y + 1) * latStep],
        ]],
      },
    }

    flashSource.setData({ type: 'FeatureCollection', features: [feature] })
    setTimeout(() => flashSource.setData({ type: 'FeatureCollection', features: [] }), 600)
  }, [lastFrame, mapReady, selectedCity, grid])

  // Mouse events
  useEffect(() => {
    if (!map.current || !mapReady || !selectedCity) return
    const m = map.current

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const cell = lngLatToCell(e.lngLat.lng, e.lngLat.lat, selectedCity)
      if (cell) {
        const gridCell = grid[cell.y]?.[cell.x]
        if (gridCell) {
          setHoveredCell(gridCell)
          setTooltipPos({ x: e.point.x, y: e.point.y })

          // Update highlight
          const src = m.getSource('highlight') as mapboxgl.GeoJSONSource
          if (src) {
            const bb = selectedCity.bounding_box
            const latS = (bb.north - bb.south) / selectedCity.grid_size.rows
            const lngS = (bb.east - bb.west) / selectedCity.grid_size.cols
            src.setData({
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [bb.west + cell.x * lngS, bb.north - (cell.y + 1) * latS],
                    [bb.west + (cell.x + 1) * lngS, bb.north - (cell.y + 1) * latS],
                    [bb.west + (cell.x + 1) * lngS, bb.north - cell.y * latS],
                    [bb.west + cell.x * lngS, bb.north - cell.y * latS],
                    [bb.west + cell.x * lngS, bb.north - (cell.y + 1) * latS],
                  ]],
                },
              }],
            })
          }
        }
      } else {
        setHoveredCell(null)
        setTooltipPos(null)
      }
    }

    const handleMouseLeave = () => {
      setHoveredCell(null)
      setTooltipPos(null)
      const src = m.getSource('highlight') as mapboxgl.GeoJSONSource
      src?.setData({ type: 'FeatureCollection', features: [] })
    }

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!isPlacementMode || !selectedZoneForPlacement) return
      const cell = lngLatToCell(e.lngLat.lng, e.lngLat.lat, selectedCity)
      if (cell) {
        ws.override(cell.x, cell.y, selectedZoneForPlacement)
        updateCell(cell.x, cell.y, selectedZoneForPlacement as ZoneType)
      }
    }

    m.on('mousemove', handleMouseMove)
    m.on('mouseleave', handleMouseLeave)
    m.on('click', handleClick)

    return () => {
      m.off('mousemove', handleMouseMove)
      m.off('mouseleave', handleMouseLeave)
      m.off('click', handleClick)
    }
  }, [mapReady, selectedCity, grid, isPlacementMode, selectedZoneForPlacement, setHoveredCell, updateCell, ws])

  return (
    <div className="flex-1 relative overflow-hidden">
      <div ref={mapContainer} className={`w-full h-full ${isPlacementMode ? 'placement-cursor' : ''}`} />

      <AnimatePresence>
        {!mapReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg-primary flex items-center justify-center"
          >
            <div className="text-text-muted text-sm font-mono animate-pulse">Loading map...</div>
          </motion.div>
        )}
      </AnimatePresence>

      {mapReady && map.current && (
        <MapControls map={map.current} />
      )}

      {tooltipPos && <CellTooltip position={tooltipPos} />}

      {isPlacementMode && selectedZoneForPlacement && (
        <PlacementIndicator zone={selectedZoneForPlacement} />
      )}
    </div>
  )
}

function LocalMapFallback({
  isPlacementMode,
  selectedZoneForPlacement,
  onPlace,
}: {
  isPlacementMode: boolean
  selectedZoneForPlacement: string | null
  onPlace: (x: number, y: number) => void
}) {
  const { selectedCity } = useCityStore()
  const { recentActions } = useSimulationStore()
  const cols = 24
  const rows = 16
  const actionZones = new Map<string, ZoneType>()

  recentActions.forEach((action) => {
    const x = Math.max(0, Math.min(cols - 1, Math.floor((action.x / 64) * cols)))
    const y = Math.max(0, Math.min(rows - 1, Math.floor((action.y / 64) * rows)))
    actionZones.set(`${x}-${y}`, action.zone_type)
  })

  const cells = Array.from({ length: cols * rows }, (_, index) => {
    const x = index % cols
    const y = Math.floor(index / cols)
    const zone = actionZones.get(`${x}-${y}`) ?? seededZoneForCell(x, y, cols, rows, selectedCity?.id)
    return { x, y, zone }
  })

  const zoneCounts = cells.reduce<Record<string, number>>((counts, cell) => {
    counts[cell.zone] = (counts[cell.zone] ?? 0) + 1
    return counts
  }, {})
  const legendZones = Object.entries(zoneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)

  return (
    <div className="flex-1 relative overflow-hidden bg-bg-primary">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(#2d4a7a 1px, transparent 1px), linear-gradient(90deg, #2d4a7a 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="absolute inset-8 flex flex-col">
        <div className="mb-4">
          <div className="text-xs uppercase font-mono text-accent-cyan tracking-widest">
            Local Planning Grid
          </div>
          <h2 className="text-2xl font-bold text-text-primary">
            {selectedCity?.name ?? 'Selected City'}
          </h2>
          <p className="text-sm text-text-muted max-w-2xl">
            Add a VITE_MAPBOX_TOKEN to enable the live Mapbox basemap. This local grid keeps the
            planner usable without external map credentials.
          </p>
        </div>

        <div
          className="grid flex-1 min-h-0 border border-border-subtle bg-bg-secondary/70"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {cells.map((cell) => (
            <button
              key={`${cell.x}-${cell.y}`}
              type="button"
              onClick={() => isPlacementMode && selectedZoneForPlacement && onPlace(cell.x, cell.y)}
              className={`border border-border-subtle/50 transition ${
                isPlacementMode
                  ? 'hover:brightness-125 cursor-crosshair'
                  : 'hover:brightness-110'
              }`}
              style={{
                backgroundColor: ZONE_COLORS[cell.zone],
                boxShadow: actionZones.has(`${cell.x}-${cell.y}`)
                  ? 'inset 0 0 0 2px rgba(255,255,255,0.55)'
                  : undefined,
              }}
              title={`${ZONE_LABELS[cell.zone]} (${cell.x}, ${cell.y})`}
            >
              {(cell.x === Math.floor(cols / 2) || cell.y === Math.floor(rows / 2)) && (
                <span className="block w-full h-full bg-white/10" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-secondary">
          {legendZones.map(([zone, count]) => (
            <div key={zone} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm border border-white/20"
                style={{ backgroundColor: ZONE_COLORS[zone as ZoneType] }}
              />
              <span>{ZONE_LABELS[zone as ZoneType]}</span>
              <span className="text-text-muted font-mono">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {isPlacementMode && selectedZoneForPlacement && (
        <PlacementIndicator zone={selectedZoneForPlacement} />
      )}
    </div>
  )
}

function seededZoneForCell(
  x: number,
  y: number,
  cols: number,
  rows: number,
  cityId = 'city'
): ZoneType {
  const cx = (cols - 1) / 2
  const cy = (rows - 1) / 2
  const dx = x - cx
  const dy = y - cy
  const distance = Math.sqrt(dx * dx + dy * dy)
  const hash = cityId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const noise = Math.abs(Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + hash) * 43758.5453) % 1

  if (x === Math.floor(cols / 2) || y === Math.floor(rows / 2)) return 'TRANS_HIGHWAY'
  if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) return noise > 0.45 ? 'COM_OFFICE' : 'MIX_USE'
  if ((x < 3 || x > cols - 4) && y > rows * 0.55) return noise > 0.35 ? 'IND_LIGHT' : 'INFRA_POWER'
  if ((x + y + hash) % 17 === 0) return 'GREEN_PARK'
  if ((x * 3 + y + hash) % 29 === 0) return 'EDU_SCHOOL'
  if ((x + y * 5 + hash) % 37 === 0) return 'HEALTH_CLINIC'
  if (distance < 6) return noise > 0.35 ? 'RES_HIGH' : 'RES_MED'
  if (distance < 9) return noise > 0.2 ? 'RES_MED' : 'COM_RETAIL'
  return noise > 0.15 ? 'RES_LOW' : 'GREEN_FOREST'
}

function buildZoneColorExpression(): mapboxgl.Expression {
  const expression: mapboxgl.Expression = ['match', ['get', 'zone_type']]
  Object.entries(ZONE_COLORS).forEach(([zone, color]) => {
    expression.push(zone, color)
  })
  expression.push('#1a2235')
  return expression
}
