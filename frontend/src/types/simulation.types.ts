import type { MetricsSnapshot } from './city.types'

export interface AgentAction {
  x: number
  y: number
  zone_type_id: string
  zone_display_name: string
  sps_score: number
  rejection_reason?: string
}

export interface SimulationFrame {
  type: 'SIM_FRAME' | 'SIM_INIT' | 'SIM_COMPLETE'
  year: number
  zones_geojson: GeoJSON.FeatureCollection
  roads_geojson: GeoJSON.FeatureCollection
  metrics_snapshot: MetricsSnapshot
  agent_actions: AgentAction[]
}

export interface ZoneExplanation {
  zone_type_id: string
  zone_display_name: string
  x: number
  y: number
  year: number
  explanation_text: string
  metrics_delta: Partial<MetricsSnapshot>
  surrounding_context: string
}

export interface ExplainParams {
  type?: 'zone_explanation' | 'annual_summary'
  zone_type_id: string
  zone_display_name: string
  city_name: string
  surrounding_context: string
  metrics_delta: Partial<MetricsSnapshot>
  scenario_goal: string
}
