import { useRef, useEffect, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { motion, AnimatePresence } from 'framer-motion'
import { useCityStore } from '@/stores/cityStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useUIStore } from '@/stores/uiStore'
import { gridToGeoJSON, lngLatToCell } from '@/utils/geoUtils'
import { ZONE_COLORS } from '@/utils/colorUtils'
import type { ZoneType } from '@/types/city.types'
import { MapControls } from './MapControls'
import { CellTooltip } from './CellTooltip'
import { PlacementIndicator } from './PlacementIndicator'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? 'pk.demo'

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

function buildZoneColorExpression(): mapboxgl.Expression {
  const expression: mapboxgl.Expression = ['match', ['get', 'zone_type']]
  Object.entries(ZONE_COLORS).forEach(([zone, color]) => {
    expression.push(zone, color)
  })
  expression.push('#1a2235')
  return expression
}
