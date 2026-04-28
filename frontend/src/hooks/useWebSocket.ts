import { useEffect, useRef, useCallback, useState } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'
import { useCityStore } from '@/stores/cityStore'
import { useAIStore } from '@/stores/aiStore'
import type { SimulationFrame, SimulationInitMessage, SimulationCompleteMessage } from '@/types/simulation.types'
import type { CityMetrics, CityProfile, GridCell, ZoneType } from '@/types/city.types'

const WS_BASE =
  import.meta.env.VITE_WS_URL ??
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

export function useWebSocket(sessionId: string | null) {
  const ws = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { applyFrame, setStatus } = useSimulationStore()
  const { selectedCity, setGrid } = useCityStore()
  const { addExplanation } = useAIStore()

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string)

        if (msg.type === 'SIM_INIT') {
          const init = msg as SimulationInitMessage
          setGrid(init.grid ?? (selectedCity ? createEmptyGrid(selectedCity) : []))
          setStatus('running')
        } else if (msg.type === 'SIM_FRAME') {
          const frame = normalizeFrame(msg, selectedCity)
          applyFrame(frame)

          if (frame.ai_explanation) {
            addExplanation({
              id: `${frame.year}-${frame.action.x}-${frame.action.y}`,
              zone_type: frame.action.zone_type,
              x: frame.action.x,
              y: frame.action.y,
              year: frame.year,
              explanation: frame.ai_explanation,
              timestamp: Date.now(),
              cached: false,
            })
          }
        } else if (msg.type === 'SIM_COMPLETE') {
          const complete = msg as SimulationCompleteMessage
          setStatus('completed')
          console.info('[WebSocket] Simulation complete. Score:', complete.score)
        } else if (msg.type === 'SIM_PAUSED') {
          setStatus('paused')
        } else if (msg.type === 'SIM_RESUMED') {
          setStatus('running')
        } else if (msg.type === 'ERROR') {
          setError(msg.message as string)
          setStatus('error')
        }
      } catch (e) {
        console.error('[WebSocket] Parse error', e)
      }
    },
    [applyFrame, selectedCity, setGrid, setStatus, addExplanation]
  )

  useEffect(() => {
    if (!sessionId) return

    const url = `${WS_BASE}/ws/${sessionId}`
    const socket = new WebSocket(url)
    ws.current = socket

    socket.onopen = () => {
      setConnected(true)
      setError(null)
    }

    socket.onclose = () => {
      setConnected(false)
    }

    socket.onerror = () => {
      setError('WebSocket connection failed')
      setConnected(false)
    }

    socket.onmessage = handleMessage

    return () => {
      socket.close()
    }
  }, [sessionId, handleMessage])

  const send = useCallback((data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    }
  }, [])

  const pause = useCallback(() => send({ type: 'PAUSE' }), [send])
  const resume = useCallback(() => send({ type: 'RESUME' }), [send])
  const override = useCallback(
    (x: number, y: number, zone_type: string) =>
      send({ type: 'USER_OVERRIDE', x, y, zone_type }),
    [send]
  )
  const changeScenario = useCallback(
    (scenario: string) => send({ type: 'SCENARIO_CHANGE', scenario }),
    [send]
  )

  return { connected, error, send, pause, resume, override, changeScenario }
}

function normalizeFrame(msg: any, selectedCity: CityProfile | null): SimulationFrame {
  const action = msg.action ?? msg.agent_actions?.[0] ?? {
    x: 0,
    y: 0,
    zone_type: 'EMPTY',
    sps: 0,
  }

  const metrics = normalizeMetrics(msg.metrics, selectedCity)

  return {
    type: 'SIM_FRAME',
    session_id: msg.session_id ?? '',
    year: msg.year ?? 2024,
    step: msg.step ?? msg.year ?? 0,
    total_steps: msg.total_steps ?? 50,
    action: {
      zone_type: (action.zone_type ?? 'EMPTY') as ZoneType,
      x: action.x ?? 0,
      y: action.y ?? 0,
      lat: action.lat ?? 0,
      lng: action.lng ?? 0,
      sps_score: action.sps_score ?? action.sps ?? 0,
      reason: action.reason ?? '',
    },
    metrics,
    grid_delta: msg.grid_delta ?? [],
    reward: msg.reward ?? 0,
    sps_score: msg.sps_score ?? action.sps_score ?? action.sps ?? 0,
    ai_explanation: msg.ai_explanation,
  }
}

function normalizeMetrics(raw: any = {}, selectedCity: CityProfile | null): CityMetrics {
  const base = selectedCity?.initial_metrics
  const transit = toPercent(raw.transit_coverage ?? raw.public_transit_coverage ?? base?.public_transit_coverage ?? 0)
  const green = toPercent(raw.green_ratio ?? raw.green_space_pct ?? base?.green_space_pct ?? 0)
  const equity = toTen(raw.equity_score ?? raw.equity_index ?? base?.equity_index ?? 0)
  const flood = toTen(raw.flood_risk ?? raw.flood_risk_score ?? base?.flood_risk_score ?? 0)
  const infra = toPercent(raw.infrastructure_score ?? base?.overall_health ?? 60)
  const employment = toPercent(raw.employment_rate ?? 0.8)
  const aqi = raw.aqi ?? raw.air_quality_index ?? base?.air_quality_index ?? 65
  const commute = raw.commute_minutes ?? raw.avg_commute_time ?? base?.avg_commute_time ?? 45
  const gdp = raw.gdp_per_capita ?? base?.gdp_per_capita ?? 50000

  const mobility = clamp((transit * 0.7) + (Math.max(0, 100 - commute) * 0.3), 0, 100)
  const economic = clamp((employment * 0.6) + (Math.min(100, gdp / 1000) * 0.4), 0, 100)
  const sustainability = clamp((green * 0.6) + (Math.max(0, 100 - aqi) * 0.4), 0, 100)
  const social = clamp(equity * 10, 0, 100)
  const overall = raw.overall_health ?? Math.round((mobility + economic + sustainability + social + infra) / 5)

  return {
    year: raw.year ?? 2024,
    population: raw.population ?? base?.population ?? selectedCity?.population ?? 0,
    population_density: raw.population_density ?? base?.population_density ?? 0,
    gdp_per_capita: gdp,
    unemployment_rate: raw.unemployment_rate ?? Math.max(0, 100 - employment),
    avg_commute_time: commute,
    public_transit_coverage: transit,
    green_space_pct: green,
    air_quality_index: aqi,
    housing_affordability: raw.housing_affordability ?? base?.housing_affordability ?? 4,
    healthcare_access: raw.healthcare_access ?? raw.hospital_beds_per_1k ?? base?.healthcare_access ?? 70,
    education_access: raw.education_access ?? toPercent(raw.school_enrollment ?? base?.education_access ?? 80),
    crime_rate: raw.crime_rate ?? base?.crime_rate ?? 400,
    flood_risk_score: flood,
    energy_consumption_gwh: raw.energy_consumption_gwh ?? raw.energy_per_capita ?? base?.energy_consumption_gwh ?? 0,
    renewable_energy_pct: raw.renewable_energy_pct ?? base?.renewable_energy_pct ?? 25,
    water_access_pct: raw.water_access_pct ?? base?.water_access_pct ?? 90,
    waste_recycling_pct: raw.waste_recycling_pct ?? base?.waste_recycling_pct ?? 35,
    happiness_index: raw.happiness_index ?? base?.happiness_index ?? 6,
    equity_index: equity,
    mobility_score: raw.mobility_score ?? mobility,
    economic_score: raw.economic_score ?? economic,
    sustainability_score: raw.sustainability_score ?? sustainability,
    overall_health: overall,
  }
}

function createEmptyGrid(city: CityProfile): GridCell[][] {
  const rows = city.grid_size.rows
  const cols = city.grid_size.cols
  const latStep = (city.bounding_box.north - city.bounding_box.south) / rows
  const lngStep = (city.bounding_box.east - city.bounding_box.west) / cols

  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({
      x,
      y,
      zone_type: 'EMPTY' as ZoneType,
      elevation: 0,
      flood_risk: 0,
      population: 0,
      lat: city.bounding_box.north - (y + 0.5) * latStep,
      lng: city.bounding_box.west + (x + 0.5) * lngStep,
    }))
  )
}

function toPercent(value: number): number {
  return value <= 1 ? value * 100 : value
}

function toTen(value: number): number {
  return value <= 1 ? value * 10 : value
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
