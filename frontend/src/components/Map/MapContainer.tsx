import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { useCityStore } from '@/stores/cityStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useUIStore } from '@/stores/uiStore'
import { getZoneColor, lightenHex } from '@/utils/colorUtils'
import { ExplanationTooltip } from './ExplanationTooltip'
import { MiniMetricsPanel } from './MiniMetricsPanel'
import { SplitScreenView } from '@/components/Layout/SplitScreenView'

const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

export function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [hovered, setHovered] = useState<{ x: number; y: number; lngLat: mapboxgl.LngLat; properties: any } | null>(null)
  const city = useCityStore((state) => state.selectedCity)
  const frame = useSimulationStore((state) => state.currentFrame)
  const activeLayers = useUIStore((state) => state.activeLayers)
  const selectedOverrideZone = useUIStore((state) => state.selectedOverrideZone)
  const isSplitScreen = useUIStore((state) => state.isSplitScreen)

  const fallbackFrame = useMemo(() => city ? makeInitialCityFrame(city) : null, [city])
  const visibleFrame = frame ?? fallbackFrame

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!containerRef.current || mapRef.current || !token) return
    mapboxgl.accessToken = token
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: city ? [city.center_lng, city.center_lat] : [-74.01, 40.71],
      zoom: city?.default_zoom ?? 10,
      pitch: 45,
      bearing: 0,
      antialias: true,
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
    const move = (event: mapboxgl.MapMouseEvent) => {
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

  const noToken = !import.meta.env.VITE_MAPBOX_TOKEN
  return (
    <main tabIndex={0} aria-label={`City simulation map for ${city?.name ?? 'selected city'}, currently showing Year ${visibleFrame?.year ?? 0}`} style={{ position: 'fixed', top: 56, left: 320, right: 0, bottom: 64, background: '#080B10' }}>
      {isSplitScreen ? <SplitScreenView /> : noToken ? <LocalMap city={city?.name ?? 'Selected city'} /> : <div ref={containerRef} style={{ width: '100%', height: '100%' }} />}
      {hovered && <ExplanationTooltip hover={hovered} />}
      <MiniMetricsPanel />
    </main>
  )

  function setSource(id: string, data: GeoJSON.FeatureCollection) {
    const source = mapRef.current?.getSource(id) as mapboxgl.GeoJSONSource | undefined
    source?.setData(data)
  }
}

function addSourcesAndLayers(map: mapboxgl.Map) {
  map.addSource('boundary-source', { type: 'geojson', data: empty })
  map.addLayer({ id: 'boundary-fill', type: 'fill', source: 'boundary-source', paint: { 'fill-color': '#2E86C1', 'fill-opacity': 0.06 } })
  map.addLayer({ id: 'boundary-line', type: 'line', source: 'boundary-source', paint: { 'line-color': '#60A5FA', 'line-width': 2, 'line-dasharray': [2, 2] } })

  map.addSource('zones-source', { type: 'geojson', data: empty })
  map.addLayer({ id: 'zones-fill', type: 'fill', source: 'zones-source', paint: { 'fill-color': ['coalesce', ['get', 'fill'], '#27AE60'], 'fill-opacity': 0.75 } })
  map.addLayer({ id: 'zones-outline', type: 'line', source: 'zones-source', paint: { 'line-color': 'rgba(255,255,255,0.28)', 'line-width': 0.6 } })

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

function setVisibility(map: mapboxgl.Map, ids: string[], visible: boolean) {
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
      return { ...feature, properties: { ...props, zone_type_id: zone, fill, extrudeFill: lightenHex(fill), population_density: props.population_density ?? props.population ?? 12000 } }
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
  const rows = 14
  const cols = 18
  const zones = ['RES_LOW_DETACHED', 'RES_MED_APARTMENT', 'COM_SMALL_SHOP', 'PARK_SMALL', 'BUS_STATION', 'EDU_HIGH', 'HEALTH_HOSPITAL']
  const features: GeoJSON.Feature[] = []
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if ((x + y) % 5 === 0 || (x > 6 && x < 12 && y > 4 && y < 10)) {
        const x0 = west + ((east - west) * x) / cols
        const x1 = west + ((east - west) * (x + 1)) / cols
        const y0 = south + ((north - south) * y) / rows
        const y1 = south + ((north - south) * (y + 1)) / rows
        const zone = zones[(x * 3 + y * 5) % zones.length]
        features.push({ type: 'Feature', properties: { zone_type_id: zone, population_density: 3000 + (x + y) * 900 }, geometry: { type: 'Polygon', coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]] } })
      }
    }
  }
  const roads: GeoJSON.Feature[] = [
    { type: 'Feature', properties: { road_type: 'HIGHWAY', congestion_pct: 62 }, geometry: { type: 'LineString', coordinates: [[west, (south + north) / 2], [east, (south + north) / 2]] } },
    { type: 'Feature', properties: { road_type: 'ARTERIAL', congestion_pct: 38 }, geometry: { type: 'LineString', coordinates: [[(west + east) / 2, south], [(west + east) / 2, north]] } },
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

function flashNewZones(map: mapboxgl.Map, frame: any) {
  if (!frame.agent_actions?.length) return
  // Mapbox layer updates already animate visually via opacity; Phase 4 will add richer decision playback.
  map.triggerRepaint()
}

function LocalMap({ city }: { city: string }) {
  return <div style={{ height: '100%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #101827, #0D1117)' }}><div className="glass-panel" style={{ padding: 24, borderRadius: 12 }}><strong>{city}</strong><p style={{ color: 'var(--color-text-secondary)' }}>Add VITE_MAPBOX_TOKEN to render the live satellite map.</p></div></div>
}
