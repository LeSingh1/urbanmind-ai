import { useCallback } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export function useSimulation() {
  const sessionId = useSimulationStore((state) => state.sessionId)
  const startSimulation = useSimulationStore((state) => state.startSimulation)
  const pauseSimulation = useSimulationStore((state) => state.pauseSimulation)
  const resumeSimulation = useSimulationStore((state) => state.resumeSimulation)
  const setSpeed = useSimulationStore((state) => state.setSpeed)

  const start = useCallback((cityId: string, scenarioId: string, sandboxConfig?: Record<string, unknown>) => startSimulation(cityId, scenarioId, sandboxConfig), [startSimulation])
  const pause = useCallback(() => pauseSimulation(), [pauseSimulation])
  const resume = useCallback(() => resumeSimulation(), [resumeSimulation])
  const override = useCallback(
    async (x: number, y: number, zone_type_id: string) => {
      if (!sessionId) return null
      const response = await fetch(`${API_BASE}/simulation/${sessionId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, zone_type_id }),
      })
      return response.ok ? response.json() : null
    },
    [sessionId]
  )

  return { start, pause, resume, override, setSpeed }
}
