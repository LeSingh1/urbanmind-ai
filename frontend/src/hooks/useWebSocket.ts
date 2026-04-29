import { useCallback, useEffect, useRef, useState } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'
import { useNotification } from '@/hooks/useNotification'
import type { SimulationFrame } from '@/types/simulation.types'

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed' | 'error'

export function useWebSocket(sessionId: string | null) {
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<number | null>(null)
  const attemptRef = useRef(0)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const receiveFrame = useSimulationStore((state) => state.receiveFrame)
  const pauseSimulation = useSimulationStore((state) => state.pauseSimulation)
  const notify = useNotification((state) => state.notify)

  const send = useCallback((payload: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload))
    }
  }, [])

  useEffect(() => {
    if (!sessionId) {
      setConnectionState('idle')
      return
    }
    if (sessionId === 'offline') {
      setIsConnected(true)
      setConnectionState('connected')
      return
    }

    let shouldReconnect = true

    const connect = () => {
      setConnectionState(attemptRef.current > 0 ? 'reconnecting' : 'connecting')
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const apiUrl = import.meta.env.VITE_API_URL as string | undefined
      const wsBase = apiUrl?.startsWith('http')
        ? apiUrl.replace(/^http/, 'ws').replace(/\/api$/, '')
        : `${protocol}//${window.location.host}`
      const socket = new WebSocket(`${wsBase}/ws/${sessionId}`)
      socketRef.current = socket

      socket.onopen = () => {
        attemptRef.current = 0
        setIsConnected(true)
        setConnectionState('connected')
      }

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.type === 'SIM_FRAME' || message.type === 'SIM_INIT') {
          const frame = normalizeFrame(message)
          receiveFrame(frame)
          const action = frame.agent_actions[0]
          if (message.type === 'SIM_FRAME' && action) notify('info', `AI placed: ${action.zone_display_name}`, 2200)
        }
        if (message.type === 'SIM_COMPLETE') {
          receiveFrame(normalizeFrame(message))
          pauseSimulation()
          notify('success', 'Simulation complete. Export your report.', 5000)
          setConnectionState('closed')
        }
      }

      socket.onerror = () => {
        setConnectionState('error')
      }

      socket.onclose = () => {
        setIsConnected(false)
        if (!shouldReconnect) {
          setConnectionState('closed')
          return
        }
        const delay = Math.min(30000, 1000 * 2 ** attemptRef.current) + Math.round(Math.random() * 400)
        attemptRef.current += 1
        reconnectRef.current = window.setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      shouldReconnect = false
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current)
      socketRef.current?.close()
    }
  }, [notify, pauseSimulation, receiveFrame, sessionId])

  return { isConnected, connectionState, send }
}

function normalizeFrame(raw: any): SimulationFrame {
  const year = raw.year ?? raw.metrics_snapshot?.year ?? 0
  return {
    type: raw.type,
    year,
    zones_geojson: raw.zones_geojson ?? emptyCollection(),
    roads_geojson: raw.roads_geojson ?? emptyCollection(),
    metrics_snapshot: {
      year,
      pop_total: raw.metrics_snapshot?.pop_total ?? raw.metrics_snapshot?.population ?? 0,
      pop_density_avg: raw.metrics_snapshot?.pop_density_avg ?? 0,
      pop_growth_rate: raw.metrics_snapshot?.pop_growth_rate ?? 0,
      mobility_commute: raw.metrics_snapshot?.mobility_commute ?? raw.metrics_snapshot?.commute_minutes ?? 0,
      mobility_congestion: raw.metrics_snapshot?.mobility_congestion ?? 0,
      mobility_transit_coverage: raw.metrics_snapshot?.mobility_transit_coverage ?? raw.metrics_snapshot?.transit_coverage ?? 0,
      mobility_walkability: raw.metrics_snapshot?.mobility_walkability ?? 0,
      econ_gdp_est: raw.metrics_snapshot?.econ_gdp_est ?? 0,
      econ_housing_afford: raw.metrics_snapshot?.econ_housing_afford ?? 0,
      econ_jobs_created: raw.metrics_snapshot?.econ_jobs_created ?? 0,
      env_green_ratio: raw.metrics_snapshot?.env_green_ratio ?? raw.metrics_snapshot?.green_ratio ?? 0,
      env_co2_est: raw.metrics_snapshot?.env_co2_est ?? 0,
      env_impervious: raw.metrics_snapshot?.env_impervious ?? 0,
      env_flood_exposure: raw.metrics_snapshot?.env_flood_exposure ?? 0,
      equity_infra_gini: raw.metrics_snapshot?.equity_infra_gini ?? 0,
      equity_hosp_coverage: raw.metrics_snapshot?.equity_hosp_coverage ?? 0,
      equity_school_access: raw.metrics_snapshot?.equity_school_access ?? 0,
      infra_power_load: raw.metrics_snapshot?.infra_power_load ?? 0,
      infra_water_capacity: raw.metrics_snapshot?.infra_water_capacity ?? 0,
      safety_response_time: raw.metrics_snapshot?.safety_response_time ?? 0,
    },
    agent_actions: (raw.agent_actions ?? []).map((action: any) => ({
      x: action.x ?? 0,
      y: action.y ?? 0,
      zone_type_id: action.zone_type_id ?? action.zone_type ?? 'RES_LOW_DETACHED',
      zone_display_name: action.zone_display_name ?? action.zone_type_id ?? action.zone_type ?? 'Urban Zone',
      sps_score: action.sps_score ?? 0,
      rejection_reason: action.rejection_reason,
    })),
  }
}

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}
