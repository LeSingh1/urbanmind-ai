import type { CityMetrics } from '@/types/city.types'

export interface MetricConfig {
  key: keyof CityMetrics
  label: string
  unit: string
  min: number
  max: number
  higherIsBetter: boolean
  category: 'mobility' | 'economy' | 'environment' | 'social' | 'infrastructure'
  format: (v: number) => string
}

export const METRIC_CONFIGS: MetricConfig[] = [
  { key: 'population', label: 'Population', unit: '', min: 0, max: 30000000, higherIsBetter: true, category: 'social', format: (v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : `${v}` },
  { key: 'population_density', label: 'Pop. Density', unit: '/km²', min: 0, max: 50000, higherIsBetter: false, category: 'social', format: (v) => `${v.toFixed(0)}/km²` },
  { key: 'gdp_per_capita', label: 'GDP/Capita', unit: '$', min: 0, max: 150000, higherIsBetter: true, category: 'economy', format: (v) => `$${(v/1000).toFixed(0)}K` },
  { key: 'unemployment_rate', label: 'Unemployment', unit: '%', min: 0, max: 30, higherIsBetter: false, category: 'economy', format: (v) => `${v.toFixed(1)}%` },
  { key: 'avg_commute_time', label: 'Avg Commute', unit: 'min', min: 0, max: 120, higherIsBetter: false, category: 'mobility', format: (v) => `${v.toFixed(0)}min` },
  { key: 'public_transit_coverage', label: 'Transit Coverage', unit: '%', min: 0, max: 100, higherIsBetter: true, category: 'mobility', format: (v) => `${v.toFixed(0)}%` },
  { key: 'green_space_pct', label: 'Green Space', unit: '%', min: 0, max: 40, higherIsBetter: true, category: 'environment', format: (v) => `${v.toFixed(1)}%` },
  { key: 'air_quality_index', label: 'Air Quality', unit: '', min: 0, max: 500, higherIsBetter: false, category: 'environment', format: (v) => `${v.toFixed(0)} AQI` },
  { key: 'housing_affordability', label: 'Housing Afford.', unit: '/10', min: 0, max: 10, higherIsBetter: true, category: 'social', format: (v) => `${v.toFixed(1)}/10` },
  { key: 'healthcare_access', label: 'Healthcare Access', unit: '%', min: 0, max: 100, higherIsBetter: true, category: 'social', format: (v) => `${v.toFixed(0)}%` },
  { key: 'education_access', label: 'Education Access', unit: '%', min: 0, max: 100, higherIsBetter: true, category: 'social', format: (v) => `${v.toFixed(0)}%` },
  { key: 'crime_rate', label: 'Crime Rate', unit: '/100K', min: 0, max: 2000, higherIsBetter: false, category: 'social', format: (v) => `${v.toFixed(0)}/100K` },
  { key: 'flood_risk_score', label: 'Flood Risk', unit: '/10', min: 0, max: 10, higherIsBetter: false, category: 'environment', format: (v) => `${v.toFixed(1)}/10` },
  { key: 'energy_consumption_gwh', label: 'Energy Use', unit: 'GWh', min: 0, max: 100000, higherIsBetter: false, category: 'infrastructure', format: (v) => `${(v/1000).toFixed(1)}TWh` },
  { key: 'renewable_energy_pct', label: 'Renewable Energy', unit: '%', min: 0, max: 100, higherIsBetter: true, category: 'environment', format: (v) => `${v.toFixed(0)}%` },
  { key: 'water_access_pct', label: 'Water Access', unit: '%', min: 0, max: 100, higherIsBetter: true, category: 'infrastructure', format: (v) => `${v.toFixed(0)}%` },
  { key: 'waste_recycling_pct', label: 'Recycling Rate', unit: '%', min: 0, max: 100, higherIsBetter: true, category: 'environment', format: (v) => `${v.toFixed(0)}%` },
  { key: 'happiness_index', label: 'Happiness', unit: '/10', min: 0, max: 10, higherIsBetter: true, category: 'social', format: (v) => `${v.toFixed(1)}/10` },
  { key: 'equity_index', label: 'Equity Index', unit: '/10', min: 0, max: 10, higherIsBetter: true, category: 'social', format: (v) => `${v.toFixed(1)}/10` },
  { key: 'mobility_score', label: 'Mobility Score', unit: '/100', min: 0, max: 100, higherIsBetter: true, category: 'mobility', format: (v) => `${v.toFixed(0)}/100` },
  { key: 'economic_score', label: 'Economic Score', unit: '/100', min: 0, max: 100, higherIsBetter: true, category: 'economy', format: (v) => `${v.toFixed(0)}/100` },
  { key: 'sustainability_score', label: 'Sustainability', unit: '/100', min: 0, max: 100, higherIsBetter: true, category: 'environment', format: (v) => `${v.toFixed(0)}/100` },
  { key: 'overall_health', label: 'City Health', unit: '/100', min: 0, max: 100, higherIsBetter: true, category: 'social', format: (v) => `${v.toFixed(0)}/100` },
]

export function getMetricDelta(current: CityMetrics, previous: CityMetrics, key: keyof CityMetrics): number {
  return (current[key] as number) - (previous[key] as number)
}

export function formatMetricDelta(delta: number, higherIsBetter: boolean): { text: string; positive: boolean } {
  const positive = higherIsBetter ? delta > 0 : delta < 0
  const sign = delta > 0 ? '+' : ''
  return { text: `${sign}${delta.toFixed(1)}`, positive }
}

export function computeOverallHealth(metrics: CityMetrics): number {
  const scores = [
    metrics.mobility_score,
    metrics.economic_score,
    metrics.sustainability_score,
    metrics.equity_index * 10,
    metrics.happiness_index * 10,
    metrics.healthcare_access,
    metrics.education_access,
    (100 - metrics.flood_risk_score * 10),
  ]
  return scores.reduce((a, b) => a + b, 0) / scores.length
}
