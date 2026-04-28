export type ZoneType =
  | 'RES_LOW' | 'RES_MED' | 'RES_HIGH'
  | 'COM_RETAIL' | 'COM_OFFICE'
  | 'IND_LIGHT' | 'IND_HEAVY'
  | 'MIX_USE'
  | 'GREEN_PARK' | 'GREEN_FOREST'
  | 'HEALTH_CLINIC' | 'HEALTH_HOSP'
  | 'EDU_SCHOOL' | 'EDU_UNIVERSITY'
  | 'INFRA_POWER' | 'INFRA_WATER'
  | 'TRANS_HUB' | 'TRANS_HIGHWAY'
  | 'SAFETY_FIRE' | 'SAFETY_POLICE'
  | 'EMPTY'

export type ScenarioMode =
  | 'MAXIMUM_GROWTH'
  | 'BALANCED_SUSTAINABLE'
  | 'CLIMATE_RESILIENT'
  | 'EQUITY_FOCUSED'
  | 'HISTORIC_PATTERN'

export interface CityProfile {
  id: string
  name: string
  country: string
  population: number
  area_km2: number
  coordinates: { lat: number; lng: number }
  bounding_box: { north: number; south: number; east: number; west: number }
  grid_size: { rows: number; cols: number }
  description: string
  climate_zone: string
  initial_metrics: CityMetrics
  thumbnail: string
}

export interface CityMetrics {
  year: number
  population: number
  population_density: number
  gdp_per_capita: number
  unemployment_rate: number
  avg_commute_time: number
  public_transit_coverage: number
  green_space_pct: number
  air_quality_index: number
  housing_affordability: number
  healthcare_access: number
  education_access: number
  crime_rate: number
  flood_risk_score: number
  energy_consumption_gwh: number
  renewable_energy_pct: number
  water_access_pct: number
  waste_recycling_pct: number
  happiness_index: number
  equity_index: number
  mobility_score: number
  economic_score: number
  sustainability_score: number
  overall_health: number
}

export interface GridCell {
  x: number
  y: number
  zone_type: ZoneType
  elevation: number
  flood_risk: number
  population: number
  lat: number
  lng: number
}
