import type { CityProfile } from '@/types/city.types'

export const STATIC_CITIES: CityProfile[] = [
  city('new_york', 'New York City', 'United States', 40.71, -74.01, 11, 'Humid subtropical', 8300000, 85000, 0.4, 'Island geography limits outward sprawl. AI focuses on vertical densification, infill, and waterfront flood adaptation.', 'Water boundaries, coastal flood risk, historic preservation districts', [-74.26, 40.48, -73.7, 40.92]),
  city('los_angeles', 'Los Angeles', 'United States', 34.05, -118.24, 10, 'Mediterranean', 3900000, 78000, 0.5, 'Regional growth is constrained by mountains, fire risk, congestion, and housing scarcity.', 'Mountains, wildfire corridors, coastal protection, freeway congestion', [-118.67, 33.7, -118.15, 34.34]),
  city('tokyo', 'Tokyo', 'Japan', 35.68, 139.69, 11, 'Humid subtropical', 14000000, 72000, 0.1, 'Extreme transit demand, aging population, and limited flat land require precision infill.', 'Bay edge, seismic risk, rail capacity, protected neighborhoods', [139.42, 35.48, 139.91, 35.9]),
  city('lagos', 'Lagos', 'Nigeria', 6.52, 3.38, 11, 'Tropical savanna', 15000000, 6200, 3.2, 'Rapid population growth demands flood-safe housing, power, roads, and health access.', 'Lagoon systems, wetlands, informal settlement pressure, coastal flood exposure', [3.1, 6.39, 3.69, 6.7]),
  city('london', 'London', 'United Kingdom', 51.51, -0.12, 11, 'Temperate oceanic', 9300000, 79000, 0.8, 'Growth must balance heritage conservation, green belt limits, and affordability.', 'Green belt, heritage districts, Thames flood risk, rail capacity', [-0.51, 51.29, 0.33, 51.69]),
  city('sao_paulo', 'Sao Paulo', 'Brazil', -23.55, -46.63, 11, 'Subtropical highland', 12300000, 18500, 0.9, 'Dense growth must reconnect services, jobs, water systems, and affordable housing.', 'Hillside settlement risk, watershed protection, severe traffic congestion', [-46.83, -23.77, -46.36, -23.36]),
  city('singapore', 'Singapore', 'Singapore', 1.35, 103.82, 12, 'Tropical rainforest', 5900000, 72500, 1.0, 'A land-constrained city-state must intensify while preserving resilience and quality of life.', 'Coastline, land reclamation limits, water security, biodiversity corridors', [103.61, 1.22, 104.04, 1.47]),
  city('dubai', 'Dubai', 'United Arab Emirates', 25.2, 55.27, 11, 'Hot desert', 3500000, 43000, 2.1, 'Desert expansion needs water, energy, shade, transit, and heat-resilient public space.', 'Desert heat, coastal exposure, water demand, linear highway dependence', [55.03, 24.79, 55.57, 25.36]),
  city('mumbai', 'Mumbai', 'India', 19.08, 72.88, 11, 'Tropical wet and dry', 12500000, 11500, 1.2, 'A narrow peninsula needs flood-safe densification, transit capacity, and equitable services.', 'Coastline, mangroves, monsoon flooding, land scarcity', [72.75, 18.89, 73.02, 19.28]),
]

function city(
  id: string,
  name: string,
  country: string,
  center_lat: number,
  center_lng: number,
  default_zoom: number,
  climate_zone: string,
  population_current: number,
  gdp_per_capita: number,
  urban_growth_rate: number,
  key_planning_challenge: string,
  expansion_constraint: string,
  bbox: [number, number, number, number]
): CityProfile {
  return {
    id,
    name,
    country,
    center_lat,
    center_lng,
    default_zoom,
    climate_zone,
    population_current,
    gdp_per_capita,
    urban_growth_rate,
    key_planning_challenge,
    expansion_constraint,
    bbox,
    historical_snapshots: [
      { year: 1950, population: Math.round(population_current * 0.48), area_km2: 420, key_event: 'Post-war urban expansion begins shaping the modern footprint' },
      { year: 1980, population: Math.round(population_current * 0.7), area_km2: 610, key_event: 'Suburbanization and major transport corridors accelerate growth' },
      { year: 2010, population: Math.round(population_current * 0.92), area_km2: 760, key_event: 'Climate, housing, and mobility planning become central priorities' },
      { year: 2024, population: population_current, area_km2: 800, key_event: 'Current planning baseline for UrbanMind simulation' },
    ],
  }
}
