import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MainLayout } from '@/components/Layout/MainLayout'
import { CitySelector } from '@/components/UI/CitySelector'
import { LoadingScreen } from '@/components/UI/LoadingScreen'
import { useCityStore } from '@/stores/cityStore'

export default function App() {
  const [appReady, setAppReady] = useState(false)
  const [showCitySelector, setShowCitySelector] = useState(true)
  const { selectedCity, setCities } = useCityStore()

  useEffect(() => {
    const loadCities = async () => {
      try {
        const res = await fetch('/api/cities')
        if (res.ok) {
          const cities = await res.json()
          setCities(cities)
        }
      } catch {
        // Backend not available — cities will be loaded from static data
      }
      setTimeout(() => setAppReady(true), 1200)
    }
    loadCities()
  }, [setCities])

  return (
    <AnimatePresence mode="wait">
      {!appReady ? (
        <LoadingScreen key="loading" />
      ) : showCitySelector && !selectedCity ? (
        <CitySelector key="city-selector" onCitySelected={() => setShowCitySelector(false)} />
      ) : (
        <motion.div
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-full"
        >
          <MainLayout />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
