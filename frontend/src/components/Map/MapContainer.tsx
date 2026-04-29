import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { useCityStore } from '@/stores/cityStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useUIStore } from '@/stores/uiStore'
import { getZoneColor, lightenHex } from '@/utils/colorUtils'
import { ExplanationTooltip } from './ExplanationTooltip'
import { MiniMetricsPanel } from './MiniMetricsPanel'
import { SplitScreenView } from '@/components/Layout/SplitScreenView'

const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
const OPENFREEMAP_STYLE = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty'

export function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [hovered, setHovered] = useState<{ x: number; y: number; lngLat: maplibregl.LngLat; properties: any } | null>(null)
  const city = useCityStore((state) => state.selectedCity)
  const frame = useSimulationStore((state) => state.currentFrame)
  const activeLayers = useUIStore((state) => state.activeLayers)
  const selectedOverrideZone = useUIStore((state) => state.selectedOverrideZone)
  const isSplitScreen = useUIStore((state) => state.isSplitScreen)

  const fallbackFrame = useMemo(() => city ? makeInitialCityFrame(city) : null, [city])
  const visibleFrame = frame ?? fallbackFrame

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: city ? [city.center_lng, city.center_lat] : [-74.01, 40.71],
      zoom: city?.default_zoom ?? 10,
      pitch: 45,
      bearing: 0,
    })
    mapRef.current.on('load', () => {
      addSourcesAndLayers(mapRef.current!)
      setLoaded(true)
    })
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !loaded || !city) return
    mapRef.current.flyTo({ center: [city.center_lng, city.center_lat], zoom: city.default_zoom, pitch: activeLayers.has('3D Buildings') ? 45 : 0, duration: 2000 })
    setSource('boundary-source', boundaryGeojson(city))
  }, [activeLayers, city, loaded])

  useEffect(() => {
    if (!mapRef.current || !loaded || !visibleFrame) return
    setSource('zones-source', withZonePaint(visibleFrame.zones_geojson))
    setSource('roads-source', visibleFrame.roads_geojson)
    setSource('buildings-source', withZonePaint(visibleFrame.zones_geojson))
    setSource('heatmap-source', zoneCentroids(visibleFrame.zones_geojson))
    flashNewZones(mapRef.current, visibleFrame)
  }, [loaded, visibleFrame])

  useEffect(() => {
    if (!mapRef.current || !loaded) return
    const m = mapRef.current
    setVisibility(m, ['zones-fill', 'zones-outline'], activeLayers.has('Zones'))
    setVisibility(m, ['roads-line'], activeLayers.has('Roads'))
    setVisibility(m, ['building-extrusion'], activeLayers.has('3D Buildings'))
    setVisibility(m, ['population-heatmap'], activeLayers.has('Population Heatmap'))
    m.easeTo({ pitch: activeLayers.has('3D Buildings') ? 45 : 0, duration: 450 })
  }, [activeLayers, loaded])

  useEffect(() => {
    if (!mapRef.current || !loaded) return
    const m = mapRef.current
    const move = (event: maplibregl.MapMouseEvent) => {
      const features = m.queryRenderedFeatures(event.point, { layers: ['zones-fill'] })
      if (features[0]) {
        m.getCanvas().style.cursor = selectedOverrideZone ? 'crosshair' : 'pointer'
        setHovered({ x: event.point.x, y: event.point.y, lngLat: event.lngLat, properties: features[0].properties })
      } else {
        m.getCanvas().style.cursor = selectedOverrideZone ? 'crosshair' : ''
        setHovered(null)
      }
    }
    const leave = () => setHovered(null)
    m.on('mousemove', move)
    m.on('mouseleave', leave)
    return () => {
      m.off('mousemove', move)
      m.off('mouseleave', leave)
    }
  }, [loaded, selectedOverrideZone])

  return (
    <main tabIndex={0} aria-label={`City simulation map for ${city?.name ?? 'selected city'}, currently showing Year ${visibleFrame?.year ?? 0}`} style={{ position: 'fixed', top: 56, left: 320, right: 0, bottom: 64, background: '#080B10' }}>
      {isSplitScreen ? <SplitScreenView /> : <div ref={containerRef} style={{ width: '100%', height: '100%' }} />}
      {hovered && <ExplanationTooltip hover={hovered} />}
      <MiniMetricsPanel />
    </main>
  )

  function setSource(id: string, data: GeoJSON.FeatureCollection) {
    const source = mapRef.current?.getSource(id) as maplibregl.GeoJSONSource | undefined
    source?.setData(data)
  }
}

function addSourcesAndLayers(map: maplibregl.Map) {
  map.addSource('boundary-source', { type: 'geojson', data: empty })
  map.addLayer({ id: 'boundary-fill', type: 'fill', source: 'boundary-source', paint: { 'fill-color': '#2E86C1', 'fill-opacity': 0.06 } })
  map.addLayer({ id: 'boundary-line', type: 'line', source: 'boundary-source', paint: { 'line-color': '#60A5FA', 'line-width': 2, 'line-dasharray': [2, 2] } })

  map.addSource('zones-source', { type: 'geojson', data: empty })
  map.addLayer({ id: 'zones-fill', type: 'fill', source: 'zones-source', paint: { 'fill-color': ['coalesce', ['get', 'fill'], '#27AE60'], 'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.46] } })
  map.addLayer({ id: 'zones-outline', type: 'line', source: 'zones-source', paint: { 'line-color': 'rgba(13,17,23,0.42)', 'line-width': 0.35 } })

  map.addSource('roads-source', { type: 'geojson', data: empty })
  map.addLayer({
    id: 'roads-line',
    type: 'line',
    source: 'roads-source',
    paint: {
      'line-width': ['match', ['get', 'road_type'], 'HIGHWAY', 6, 'ARTERIAL', 4, 'COLLECTOR', 2.5, 1.5],
      'line-color': ['interpolate', ['linear'], ['coalesce', ['get', 'congestion_pct'], 0], 0, '#27AE60', 50, '#F39C12', 75, '#E74C3C', 100, '#8E0000'],
    },
  })

  map.addSource('buildings-source', { type: 'geojson', data: empty })
  map.addLayer({
    id: 'building-extrusion',
    type: 'fill-extrusion',
    source: 'buildings-source',
    minzoom: 12,
    paint: {
      'fill-extrusion-color': ['coalesce', ['get', 'extrudeFill'], '#5AA8D8'],
      'fill-extrusion-height': ['min', 400, ['*', ['coalesce', ['get', 'population_density'], 5000], 0.004]],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.85,
    },
  })

  map.addSource('heatmap-source', { type: 'geojson', data: empty })
  map.addLayer({
    id: 'population-heatmap',
    type: 'heatmap',
    source: 'heatmap-source',
    layout: { visibility: 'none' },
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['coalesce', ['get', 'population_density'], 0], 0, 0, 80000, 1],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 15, 12, 30, 14, 50],
      'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(255,255,178,0)', 0.3, '#FEE391', 0.55, '#FEC44F', 0.8, '#FB6A4A', 1, '#7F0000'],
    },
  })
}

function setVisibility(map: maplibregl.Map, ids: string[], visible: boolean) {
  ids.forEach((id) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
  })
}

function withZonePaint(collection: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
  return {
    ...collection,
    features: collection.features.map((feature) => {
      const props: any = feature.properties ?? {}
      const zone = props.zone_type_id ?? props.zone_type ?? 'RES_LOW_DETACHED'
      const fill = getZoneColor(zone)
      return { ...feature, properties: { ...props, zone_type_id: zone, fill, fillOpacity: props.fillOpacity ?? 0.46, extrudeFill: lightenHex(fill), population_density: props.population_density ?? props.population ?? 12000 } }
    }),
  }
}

function boundaryGeojson(city: any): GeoJSON.FeatureCollection {
  const [west, south, east, north] = city.bbox
  return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] } }] }
}

function zoneCentroids(collection: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: collection.features.map((feature) => {
      const coords = (feature.geometry as any).coordinates?.[0] ?? []
      const lng = coords.reduce((sum: number, c: number[]) => sum + c[0], 0) / Math.max(1, coords.length)
      const lat = coords.reduce((sum: number, c: number[]) => sum + c[1], 0) / Math.max(1, coords.length)
      return { type: 'Feature', properties: feature.properties, geometry: { type: 'Point', coordinates: [lng, lat] } }
    }),
  }
}

function makeInitialCityFrame(city: any) {
  const [west, south, east, north] = city.bbox
  const rows = 58
  const cols = 74
  const zones = ['RES_LOW_DETACHED', 'RES_MED_APARTMENT', 'RES_HIGH_TOWER', 'COM_SMALL_SHOP', 'COM_OFFICE_PLAZA', 'PARK_SMALL', 'BUS_STATION', 'EDU_HIGH', 'HEALTH_HOSPITAL', 'SMART_TRAFFIC_LIGHT']
  const features: GeoJSON.Feature[] = []
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const lng = west + ((east - west) * (x + 0.5)) / cols
      const lat = south + ((north - south) * (y + 0.5)) / rows
      if (!isDevelopableCell(city.id, lng, lat, x, y, cols, rows)) continue

      const cellW = (east - west) / cols
      const cellH = (north - south) / rows
      const insetX = cellW * 0.09
      const insetY = cellH * 0.09
      const x0 = west + ((east - west) * x) / cols + insetX
      const x1 = west + ((east - west) * (x + 1)) / cols - insetX
      const y0 = south + ((north - south) * y) / rows + insetY
      const y1 = south + ((north - south) * (y + 1)) / rows - insetY
      const core = distanceToCore(city, lng, lat)
      const zone = zoneForCell(zones, x, y, core)
      features.push({
        type: 'Feature',
        properties: {
          x,
          y,
          zone_type_id: zone,
          fillOpacity: 0.42,
          population_density: Math.round(2600 + (1 - core) * 32000 + ((x * 17 + y * 11) % 2400)),
        },
        geometry: { type: 'Polygon', coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]] },
      })
    }
  }
  const roads: GeoJSON.Feature[] = [
    { type: 'Feature', properties: { road_type: 'HIGHWAY', congestion_pct: 62 }, geometry: { type: 'LineString', coordinates: [[west + (east - west) * 0.1, south + (north - south) * 0.55], [east - (east - west) * 0.08, south + (north - south) * 0.55]] } },
    { type: 'Feature', properties: { road_type: 'ARTERIAL', congestion_pct: 38 }, geometry: { type: 'LineString', coordinates: [[west + (east - west) * 0.52, south + (north - south) * 0.08], [west + (east - west) * 0.52, north - (north - south) * 0.08]] } },
    { type: 'Feature', properties: { road_type: 'COLLECTOR', congestion_pct: 28 }, geometry: { type: 'LineString', coordinates: [[west + (east - west) * 0.26, south + (north - south) * 0.31], [east - (east - west) * 0.2, north - (north - south) * 0.26]] } },
  ]
  return {
    type: 'SIM_INIT' as const,
    year: 0,
    zones_geojson: { type: 'FeatureCollection' as const, features },
    roads_geojson: { type: 'FeatureCollection' as const, features: roads },
    metrics_snapshot: { year: 0, pop_total: city.population_current, pop_density_avg: 9000, pop_growth_rate: city.urban_growth_rate, mobility_commute: 42, mobility_congestion: 45, mobility_transit_coverage: 60, mobility_walkability: 58, econ_gdp_est: city.population_current * city.gdp_per_capita, econ_housing_afford: 54, econ_jobs_created: 0, env_green_ratio: 18, env_co2_est: 600, env_impervious: 52, env_flood_exposure: 18, equity_infra_gini: 34, equity_hosp_coverage: 71, equity_school_access: 78, infra_power_load: 61, infra_water_capacity: 68, safety_response_time: 7.5 },
    agent_actions: [],
  }
}

function isDevelopableCell(cityId: string, lng: number, lat: number, x: number, y: number, cols: number, rows: number) {
  const jitter = ((x * 92821 + y * 68917) % 100) / 100
  if (cityId === 'new_york') {
    return (
      inBox(lng, lat, -74.03, 40.68, -73.92, 40.89) ||
      inBox(lng, lat, -74.05, 40.57, -73.82, 40.75) ||
      inBox(lng, lat, -73.96, 40.69, -73.72, 40.80) ||
      inBox(lng, lat, -73.93, 40.78, -73.76, 40.91) ||
      inBox(lng, lat, -74.25, 40.49, -74.05, 40.65)
    ) && jitter > 0.18
  }
  if (cityId === 'los_angeles') {
    return (
      inBox(lng, lat, -118.55, 33.95, -118.1, 34.35) ||
      inBox(lng, lat, -118.67, 34.12, -118.45, 34.34) ||
      inBox(lng, lat, -118.48, 33.8, -118.18, 33.97) ||
      inBox(lng, lat, -118.3, 33.73, -118.15, 33.82)
    ) && jitter > 0.18
  }
  const nx = (x + 0.5) / cols - 0.5
  const ny = (y + 0.5) / rows - 0.5
  const radial = Math.sqrt((nx / 0.36) ** 2 + (ny / 0.3) ** 2)
  const corridor = Math.abs(ny - nx * 0.35) < 0.09 || Math.abs(nx) < 0.07 || Math.abs(ny) < 0.07
  return (radial < 0.85 || corridor) && jitter > 0.2
}

function inBox(lng: number, lat: number, minLng: number, minLat: number, maxLng: number, maxLat: number) {
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
}

function distanceToCore(city: any, lng: number, lat: number) {
  const dx = (lng - city.center_lng) / Math.max(0.001, city.bbox[2] - city.bbox[0])
  const dy = (lat - city.center_lat) / Math.max(0.001, city.bbox[3] - city.bbox[1])
  return Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2.4)
}

function zoneForCell(zones: string[], x: number, y: number, coreDistance: number) {
  if (coreDistance < 0.22 && (x + y) % 3 === 0) return 'RES_HIGH_TOWER'
  if (coreDistance < 0.32 && (x * 2 + y) % 4 === 0) return 'COM_OFFICE_PLAZA'
  if ((x + y) % 19 === 0) return 'HEALTH_HOSPITAL'
  if ((x * 3 + y) % 23 === 0) return 'EDU_HIGH'
  if ((x + y * 2) % 17 === 0) return 'BUS_STATION'
  if ((x * 5 + y * 7) % 29 === 0) return 'PARK_SMALL'
  return zones[(x * 3 + y * 5) % zones.length]
}

function flashNewZones(map: maplibregl.Map, frame: any) {
  if (!frame.agent_actions?.length) return
  // Map layer updates already animate visually via opacity; Phase 4 will add richer decision playback.
  map.triggerRepaint()
}
