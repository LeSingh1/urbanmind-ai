import { useEffect, useRef, useState } from 'react'
import { ControlBar } from '@/components/Layout/ControlBar'
import { Sidebar } from '@/components/Layout/Sidebar'
import { BottomBar } from '@/components/Layout/BottomBar'
import { PopulationDashboard } from '@/components/Layout/PopulationDashboard'
import { ExplanationDrawer } from '@/components/Layout/ExplanationDrawer'
import { NotificationBanner } from '@/components/Layout/NotificationBanner'
import { StepSummaryPanel } from '@/components/Layout/StepSummaryPanel'
import { MapContainer } from '@/components/Map/MapContainer'
import { LandingScreen } from '@/components/UI/LandingScreen'
import { useCityStore } from '@/stores/cityStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { CityProfile, MetricsSnapshot } from '@/types/city.types'
import type { AgentAction } from '@/types/simulation.types'

const ZONE_DISPLAY: Record<string, string> = {
  RES_LOW_DETACHED: 'Low-Density Residential',
  RES_MED_APARTMENT: 'Med-Density Apartment',
  RES_HIGH_TOWER: 'High-Rise Tower',
  COM_SMALL_SHOP: 'Small Commercial',
  COM_OFFICE_PLAZA: 'Office Plaza',
  PARK_SMALL: 'Small Park',
  BUS_STATION: 'Bus Station',
  EDU_HIGH: 'High School',
  HEALTH_HOSPITAL: 'Hospital',
  SMART_TRAFFIC_LIGHT: 'Smart Traffic Light',
}
const ZONE_TYPES = Object.keys(ZONE_DISPLAY)

function offlineMetrics(city: CityProfile, year: number): MetricsSnapshot {
  const t = year / 50
  return {
    year,
    pop_total: Math.round(city.population_current * (1 + city.urban_growth_rate * t * 0.3)),
    pop_density_avg: Math.round(9000 + t * 4000),
    pop_growth_rate: Math.round((city.urban_growth_rate * (1 - t * 0.3)) * 100) / 100,
    mobility_commute: Math.round(42 - t * 8),
    mobility_congestion: Math.round(45 + t * 10),
    mobility_transit_coverage: Math.round(60 + t * 20),
    mobility_walkability: Math.round(58 + t * 12),
    econ_gdp_est: Math.round(city.population_current * city.gdp_per_capita * (1 + t * 0.25)),
    econ_housing_afford: Math.round(54 - t * 8),
    econ_jobs_created: Math.round(t * 85000),
    env_green_ratio: Math.round(18 + t * 5),
    env_co2_est: Math.round(600 + t * 120),
    env_impervious: Math.round(52 + t * 8),
    env_flood_exposure: Math.round(18 - t * 3),
    equity_infra_gini: Math.round(34 - t * 6),
    equity_hosp_coverage: Math.round(71 + t * 12),
    equity_school_access: Math.round(78 + t * 10),
    infra_power_load: Math.round(61 + t * 18),
    infra_water_capacity: Math.round(68 + t * 15),
    safety_response_time: Math.round((7.5 - t * 2) * 10) / 10,
  }
}

function offlineActions(year: number): AgentAction[] {
  const count = 2 + (year % 3)
  return Array.from({ length: count }, (_, i) => {
    const seed = year * 17 + i * 31
    const zoneId = ZONE_TYPES[seed % ZONE_TYPES.length]
    return {
      x: (seed * 7) % 74,
      y: (seed * 13) % 58,
      zone_type_id: zoneId,
      zone_display_name: ZONE_DISPLAY[zoneId],
      sps_score: 60 + (seed % 30),
    }
  })
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const fetchCities = useCityStore((state) => state.fetchCities)
  const selectedCity = useCityStore((state) => state.selectedCity)
  const sessionId = useSimulationStore((state) => state.sessionId)
  const isRunning = useSimulationStore((state) => state.isRunning)
  const isPaused = useSimulationStore((state) => state.isPaused)
  const speed = useSimulationStore((state) => state.speed)
  const connection = useWebSocket(sessionId)
  const cityRef = useRef(selectedCity)
  cityRef.current = selectedCity

  useEffect(() => {
    fetchCities()
  }, [fetchCities])

  useEffect(() => {
    if (sessionId !== 'offline' || !isRunning || isPaused) return
    const ms = Math.max(150, 1000 / speed)
    const id = setInterval(() => {
      const store = useSimulationStore.getState()
      const nextYear = store.currentYear + 1
      if (nextYear > 50) {
        store.pauseSimulation()
        return
      }
      const city = cityRef.current
      if (!city) return
      const zones = store.currentFrame?.zones_geojson ?? { type: 'FeatureCollection' as const, features: [] }
      const roads = store.currentFrame?.roads_geojson ?? { type: 'FeatureCollection' as const, features: [] }
      store.receiveFrame({
        type: nextYear >= 50 ? 'SIM_COMPLETE' : 'SIM_FRAME',
        year: nextYear,
        zones_geojson: zones,
        roads_geojson: roads,
        metrics_snapshot: offlineMetrics(city, nextYear),
        agent_actions: offlineActions(nextYear),
      })
    }, ms)
    return () => clearInterval(id)
  }, [sessionId, isRunning, isPaused, speed])

  return (
    <div style={{ background: 'var(--color-bg-app)', height: '100vh', overflow: 'hidden' }}>
      {showLanding || !selectedCity ? (
        <LandingScreen onEnter={() => setShowLanding(false)} />
      ) : (
        <>
          <ControlBar connectionState={connection.connectionState} />
          <Sidebar wsSend={connection.send} />
          <MapContainer />
          <BottomBar />
          <PopulationDashboard />
          <ExplanationDrawer />
          <StepSummaryPanel />
          <NotificationBanner connected={connection.isConnected} state={connection.connectionState} />
        </>
      )}
    </div>
  )
}
