export interface CityProfile {
  id: string
  name: string
  country: string
  center_lat: number
  center_lng: number
  default_zoom: number
  climate_zone: string
  population_current: number
  gdp_per_capita: number
  urban_growth_rate: number
  key_planning_challenge: string
  expansion_constraint?: string
  bbox: [number, number, number, number]
  historical_snapshots?: Array<{
    year: number
    population: number
    area_km2: number
    key_event: string
  }>
}

export interface MetricsSnapshot {
  year: number
  pop_total: number
  pop_density_avg: number
  pop_growth_rate: number
  mobility_commute: number
  mobility_congestion: number
  mobility_transit_coverage: number
  mobility_walkability: number
  econ_gdp_est: number
  econ_housing_afford: number
  econ_jobs_created: number
  env_green_ratio: number
  env_co2_est: number
  env_impervious: number
  env_flood_exposure: number
  equity_infra_gini: number
  equity_hosp_coverage: number
  equity_school_access: number
  infra_power_load: number
  infra_water_capacity: number
  safety_response_time: number
}

export type ScenarioId =
  | 'balanced'
  | 'max_growth'
  | 'climate_resilient'
  | 'equity_focused'
  | 'historic'
