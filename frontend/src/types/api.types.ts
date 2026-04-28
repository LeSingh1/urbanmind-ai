import type { CityProfile, ScenarioMode } from './city.types'
import type { SimulationSession, UserOverrideResult } from './simulation.types'

export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

export interface StartSimulationRequest {
  city_id: string
  scenario: ScenarioMode
  speed_multiplier?: number
}

export interface StartSimulationResponse {
  session_id: string
  websocket_url: string
}

export interface OverrideRequest {
  x: number
  y: number
  zone_type: string
}

export interface ExplainRequest {
  zone_type: string
  x: number
  y: number
  city_name: string
  surrounding_context: string
  metrics_delta: Record<string, number>
  scenario_goal: string
}

export interface ExplainResponse {
  explanation: string
  cached: boolean
}

export interface ExportRequest {
  session_id: string
  format: 'json' | 'csv' | 'geojson'
}

export type { CityProfile, SimulationSession, UserOverrideResult }
