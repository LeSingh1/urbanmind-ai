import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCityStore } from '@/stores/cityStore'
import type { CityProfile } from '@/types/city.types'
import { STATIC_CITIES } from '@/data/staticCities'

interface CitySelectorProps {
  onCitySelected: () => void
}

export function CitySelector({ onCitySelected }: CitySelectorProps) {
  const { cities, setCities, selectCity } = useCityStore()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const displayCities: CityProfile[] = cities.length > 0 ? cities : STATIC_CITIES

  const handleSelect = (city: CityProfile) => {
    if (cities.length === 0) setCities(STATIC_CITIES)
    selectCity(city)
    onCitySelected()
  }

  return (
    <div
      className="fixed inset-0 bg-bg-primary flex flex-col items-center justify-center p-8 overflow-auto"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-10"
      >
        <h2 className="text-4xl font-bold text-text-primary mb-2">
          Choose Your City
        </h2>
        <p className="text-text-secondary">
          Select a real-world city profile to begin the simulation
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 max-w-4xl w-full">
        {displayCities.map((city, i) => (
          <motion.button
            key={city.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onHoverStart={() => setHoveredId(city.id)}
            onHoverEnd={() => setHoveredId(null)}
            onClick={() => handleSelect(city)}
            className="relative bg-bg-card border border-border-subtle rounded-xl p-5 text-left transition-all hover:border-accent-blue group"
          >
            {hoveredId === city.id && (
              <motion.div
                layoutId="city-highlight"
                className="absolute inset-0 rounded-xl bg-accent-blue/5 border border-accent-blue"
              />
            )}
            <div className="relative z-10">
              <div className="text-3xl mb-2">{city.thumbnail}</div>
              <h3 className="font-semibold text-text-primary text-lg">{city.name}</h3>
              <p className="text-text-muted text-xs mb-2">{city.country}</p>
              <p className="text-text-secondary text-xs leading-relaxed line-clamp-2">
                {city.description}
              </p>
              <div className="mt-3 flex gap-3 text-xs text-text-muted">
                <span>👥 {(city.population / 1e6).toFixed(1)}M</span>
                <span>🌡️ {city.climate_zone}</span>
              </div>
            </div>
          </motion.button>
        ))}

        {/* Sandbox option */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * displayCities.length }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleSelect({
            id: 'sandbox',
            name: 'Sandbox City',
            country: 'Procedural',
            population: 100000,
            area_km2: 1024,
            coordinates: { lat: 0, lng: 0 },
            bounding_box: { north: 0.18, south: -0.18, east: 0.18, west: -0.18 },
            grid_size: { rows: 64, cols: 64 },
            description: 'A blank canvas with procedurally generated terrain. Build from scratch.',
            climate_zone: 'Temperate',
            initial_metrics: STATIC_CITIES[1].initial_metrics,
            thumbnail: '🏗️',
          })}
          className="bg-bg-card border border-dashed border-border-active rounded-xl p-5 text-left hover:border-accent-cyan group"
        >
          <div className="text-3xl mb-2">🏗️</div>
          <h3 className="font-semibold text-text-primary text-lg">Sandbox City</h3>
          <p className="text-text-muted text-xs mb-2">Procedural</p>
          <p className="text-text-secondary text-xs leading-relaxed">
            Start from scratch with procedurally generated terrain and no existing infrastructure.
          </p>
          <div className="mt-3 text-xs text-accent-cyan">Free build mode</div>
        </motion.button>
      </div>
    </div>
  )
}
