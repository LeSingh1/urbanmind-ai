import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { CitySelector } from '@/components/UI/CitySelector'
import { LoadingScreen } from '@/components/UI/LoadingScreen'
import { useCityStore } from '@/stores/cityStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { STATIC_CITIES } from '@/data/staticCities'
import type { CityProfile } from '@/types/city.types'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function App() {
  const [appReady, setAppReady] = useState(false)
  const [showCitySelector, setShowCitySelector] = useState(true)
  const { selectedCity, setCities, selectCity } = useCityStore()
  const resetSimulation = useSimulationStore((state) => state.reset)

  useEffect(() => {
    const loadCities = async () => {
      try {
        const res = await fetch('/api/cities')
        if (res.ok) {
          const cities = await res.json()
          setCities(normalizeCities(cities))
        }
      } catch {
        // Backend not available — cities will be loaded from static data
      }
      setTimeout(() => setAppReady(true), 1200)
    }
    loadCities()
  }, [setCities])

  const resetApp = () => {
    selectCity(null as unknown as CityProfile)
    resetSimulation()
    setShowCitySelector(true)
  }

  return (
    <ErrorBoundary onReset={resetApp}>
      {!appReady ? (
        <LoadingScreen />
      ) : showCitySelector && !selectedCity ? (
        <CitySelector onCitySelected={() => setShowCitySelector(false)} />
      ) : (
        <div className="w-full h-full">
          <MainLayout />
        </div>
      )}
    </ErrorBoundary>
  )
}

function normalizeCities(cities: unknown[]): CityProfile[] {
  return cities.map((city) => {
    const apiCity = city as Record<string, any>
    const fallback = STATIC_CITIES.find((item) => item.id === apiCity.id)
    const latestSnapshot = Array.isArray(apiCity.historical_snapshots)
      ? apiCity.historical_snapshots[apiCity.historical_snapshots.length - 1]
      : undefined

    return {
      ...(fallback ?? STATIC_CITIES[0]),
      ...apiCity,
      population: apiCity.population ?? apiCity.population_current ?? fallback?.population ?? 0,
      area_km2:
        apiCity.area_km2 ??
        latestSnapshot?.area_km2 ??
        fallback?.area_km2 ??
        0,
      coordinates: apiCity.coordinates ?? {
        lat: apiCity.center_lat ?? fallback?.coordinates.lat ?? 0,
        lng: apiCity.center_lng ?? fallback?.coordinates.lng ?? 0,
      },
      bounding_box: apiCity.bounding_box ?? {
        north: apiCity.bounds?.max_lat ?? fallback?.bounding_box.north ?? 0,
        south: apiCity.bounds?.min_lat ?? fallback?.bounding_box.south ?? 0,
        east: apiCity.bounds?.max_lng ?? fallback?.bounding_box.east ?? 0,
        west: apiCity.bounds?.min_lng ?? fallback?.bounding_box.west ?? 0,
      },
      grid_size: apiCity.grid_size ?? fallback?.grid_size ?? { rows: 64, cols: 64 },
      description:
        apiCity.description ??
        apiCity.key_planning_challenge ??
        fallback?.description ??
        '',
      thumbnail: apiCity.thumbnail ?? apiCity.flag ?? fallback?.thumbnail ?? '🏙️',
      initial_metrics: fallback?.initial_metrics ?? STATIC_CITIES[0].initial_metrics,
    }
  })
}
