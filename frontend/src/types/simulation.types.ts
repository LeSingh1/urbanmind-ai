import type { ZoneType, CityMetrics, GridCell, ScenarioMode } from './city.types'

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error'

export interface SimulationSession {
  session_id: string
  city_id: string
  scenario: ScenarioMode
  status: SimulationStatus
  current_year: number
  start_year: number
  end_year: number
  created_at: string
}

export interface SimulationFrame {
  type: 'SIM_FRAME'
  session_id: string
  year: number
  step: number
  total_steps: number
  action: PlacementAction
  metrics: CityMetrics
  grid_delta: GridDelta[]
  reward: number
  sps_score: number
  ai_explanation?: string
}

export interface PlacementAction {
  zone_type: ZoneType
  x: number
  y: number
  lat: number
  lng: number
  sps_score: number
  reason: string
}

export interface GridDelta {
  x: number
  y: number
  old_zone: ZoneType
  new_zone: ZoneType
  lat: number
  lng: number
}

export interface SimulationInitMessage {
  type: 'SIM_INIT'
  session_id: string
  city_id: string
  scenario: ScenarioMode
  grid: GridCell[][]
  initial_metrics: CityMetrics
  total_steps: number
  config: SimulationConfig
}

export interface SimulationCompleteMessage {
  type: 'SIM_COMPLETE'
  session_id: string
  final_metrics: CityMetrics
  metrics_history: CityMetrics[]
  zone_summary: Record<ZoneType, number>
  score: number
  replay_available: boolean
}

export interface UserOverrideMessage {
  type: 'USER_OVERRIDE'
  session_id: string
  x: number
  y: number
  zone_type: ZoneType
}

export interface WebSocketMessage {
  type: string
  [key: string]: unknown
}

export interface SimulationConfig {
  grid_size: { rows: number; cols: number }
  cell_size_m: number
  years_per_step: number
  steps_per_year: number
  speed_multiplier: number
}

export interface UserOverrideResult {
  success: boolean
  consequence_explanation: string
  metrics_impact: Partial<CityMetrics>
  affected_cells: GridDelta[]
}
