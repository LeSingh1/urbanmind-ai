import { create } from 'zustand'
import { STATIC_CITIES } from '@/data/staticCities'
import type { CityProfile } from '@/types/city.types'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

interface CityStore {
  cities: CityProfile[]
  selectedCity: CityProfile | null
  isLoading: boolean
  fetchCities: () => Promise<void>
  setCities: (cities: CityProfile[]) => void
  selectCity: (city: CityProfile | null) => void
}

export const useCityStore = create<CityStore>((set) => ({
  cities: STATIC_CITIES,
  selectedCity: null,
  isLoading: false,

  fetchCities: async () => {
    set({ isLoading: true })
    try {
      const response = await fetch(`${API_BASE}/cities`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const cities = await response.json()
      set({ cities: cities.map(normalizeCity), isLoading: false })
    } catch {
      set({ cities: STATIC_CITIES, isLoading: false })
    }
  },

  setCities: (cities) => set({ cities: cities.map(normalizeCity) }),
  selectCity: (city) => set({ selectedCity: city }),
}))

function normalizeCity(raw: any): CityProfile {
  const fallback = STATIC_CITIES.find((city) => city.id === raw.id) ?? STATIC_CITIES[0]
  return {
    ...fallback,
    ...raw,
    center_lat: raw.center_lat ?? raw.coordinates?.lat ?? fallback.center_lat,
    center_lng: raw.center_lng ?? raw.coordinates?.lng ?? fallback.center_lng,
    population_current: raw.population_current ?? raw.population ?? fallback.population_current,
    gdp_per_capita: raw.gdp_per_capita ?? fallback.gdp_per_capita,
    urban_growth_rate: raw.urban_growth_rate ?? fallback.urban_growth_rate,
    key_planning_challenge: raw.key_planning_challenge ?? raw.description ?? fallback.key_planning_challenge,
    bbox: raw.bbox ?? [
      raw.bounding_box?.west ?? fallback.bbox[0],
      raw.bounding_box?.south ?? fallback.bbox[1],
      raw.bounding_box?.east ?? fallback.bbox[2],
      raw.bounding_box?.north ?? fallback.bbox[3],
    ],
  }
}
