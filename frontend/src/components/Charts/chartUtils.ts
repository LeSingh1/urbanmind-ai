import { useEffect, useRef, useState } from 'react'
import type { MetricsSnapshot } from '@/types/city.types'
import type { SimulationFrame } from '@/types/simulation.types'

export function useChartSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(640)
  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)))
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return { ref, width }
}

export function ensureHistory(history: MetricsSnapshot[], cityPopulation = 1000000) {
  if (history.length) return history
  return Array.from({ length: 6 }, (_, index) => ({
    year: index * 10,
    pop_total: Math.round(cityPopulation * (1 + index * 0.12)),
    pop_density_avg: 8000 + index * 400,
    pop_growth_rate: 1.2 + index * 0.15,
    mobility_commute: 42 - index,
    mobility_congestion: 48 + index,
    mobility_transit_coverage: 52 + index * 5,
    mobility_walkability: 55 + index * 4,
    econ_gdp_est: cityPopulation * 60000 * (1 + index * 0.1),
    econ_housing_afford: 52 + index,
    econ_jobs_created: index * 24000,
    env_green_ratio: 16 + index,
    env_co2_est: 700 - index * 18,
    env_impervious: 48 + index,
    env_flood_exposure: 22 - index,
    equity_infra_gini: 38 - index,
    equity_hosp_coverage: 62 + index * 5,
    equity_school_access: 70 + index * 4,
    infra_power_load: 58 + index * 4,
    infra_water_capacity: 60 + index * 4,
    safety_response_time: 8 - index * 0.25,
  }))
}

export function exportSvg(id: string, name: string) {
  const svg = document.getElementById(id)
  if (!svg) return
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${name}.svg`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function zoneCountsByYear(frames: SimulationFrame[]) {
  return frames.map((frame) => {
    const row: Record<string, number> = { year: frame.year, RES_LOW: 0, RES_MED: 0, RES_HIGH: 0, RES_MIXED: 0 }
    frame.zones_geojson.features.forEach((feature) => {
      const zone = String(feature.properties?.zone_type_id ?? '')
      const density = Number(feature.properties?.population_density ?? 1000)
      if (zone.startsWith('RES_LOW')) row.RES_LOW += density
      else if (zone.startsWith('RES_MED')) row.RES_MED += density
      else if (zone.startsWith('RES_HIGH')) row.RES_HIGH += density
      else if (zone.includes('MIX')) row.RES_MIXED += density
    })
    return row
  })
}
