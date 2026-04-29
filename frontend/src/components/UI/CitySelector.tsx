import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, Map, Users } from 'lucide-react'
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
    <div className="city-select-shell fixed inset-0 bg-bg-primary overflow-auto">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="city-select-header"
      >
        <div className="city-select-mark">
          <Building2 size={24} />
          <span>UrbanMind AI</span>
        </div>
        <h1>Plan a City Expansion</h1>
        <p>Choose a planning context and start the year-by-year growth model.</p>
      </motion.div>

      <div className="city-grid">
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
            className="city-card group"
          >
            {hoveredId === city.id && (
              <motion.div
                layoutId="city-highlight"
                className="city-card-highlight"
              />
            )}
            <div className="relative z-10">
              <div className="city-card-top">
                <div className="city-code">{city.thumbnail}</div>
                <ArrowRight size={16} className="city-arrow" />
              </div>
              <h3>{city.name}</h3>
              <p className="city-country">{city.country}</p>
              <p className="city-description">
                {city.description}
              </p>
              <div className="city-card-meta">
                <span><Users size={13} /> {(city.population / 1e6).toFixed(1)}M</span>
                <span><Map size={13} /> {city.climate_zone}</span>
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
            thumbnail: 'NEW',
          })}
          className="city-card city-card--sandbox group"
        >
          <div className="city-card-top">
            <div className="city-code">NEW</div>
            <ArrowRight size={16} className="city-arrow" />
          </div>
          <h3>Sandbox City</h3>
          <p className="city-country">Procedural</p>
          <p className="city-description">
            Start from scratch with procedurally generated terrain and no existing infrastructure.
          </p>
          <div className="city-card-meta">
            <span><Users size={13} /> 0.1M</span>
            <span><Map size={13} /> Temperate</span>
          </div>
        </motion.button>
      </div>
    </div>
  )
}
