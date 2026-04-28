import { useState, useCallback } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'
import { useCityStore } from '@/stores/cityStore'
import type { ScenarioMode } from '@/types/city.types'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export function useSimulation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setSession, reset } = useSimulationStore()
  const { selectedCity } = useCityStore()

  const startSimulation = useCallback(
    async (scenario: ScenarioMode, speedMultiplier = 1): Promise<string | null> => {
      if (!selectedCity) {
        setError('No city selected')
        return null
      }

      setLoading(true)
      setError(null)
      reset()

      try {
        const res = await fetch(`${API_BASE}/simulation/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            city_id: selectedCity.id,
            scenario,
            speed_multiplier: speedMultiplier,
          }),
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        setSession({
          session_id: data.session_id,
          city_id: selectedCity.id,
          scenario,
          status: 'running',
          current_year: 2024,
          start_year: 2024,
          end_year: 2074,
          created_at: new Date().toISOString(),
        })

        return data.session_id
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to start simulation')
        return null
      } finally {
        setLoading(false)
      }
    },
    [selectedCity, setSession, reset]
  )

  const applyOverride = useCallback(
    async (sessionId: string, x: number, y: number, zoneType: string) => {
      try {
        const res = await fetch(`${API_BASE}/simulation/${sessionId}/override`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x, y, zone_type: zoneType }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return await res.json()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Override failed')
        return null
      }
    },
    []
  )

  const exportSimulation = useCallback(
    async (sessionId: string, format: 'json' | 'csv' | 'geojson' = 'json') => {
      try {
        const res = await fetch(`${API_BASE}/simulation/${sessionId}/export?format=${format}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `urbanmind-${sessionId}.${format}`
        a.click()
        URL.revokeObjectURL(url)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Export failed')
      }
    },
    []
  )

  return { loading, error, startSimulation, applyOverride, exportSimulation }
}
