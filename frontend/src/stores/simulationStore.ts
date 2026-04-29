import { create } from 'zustand'
import type { MetricsSnapshot } from '@/types/city.types'
import type { AgentAction, SimulationFrame } from '@/types/simulation.types'

type Speed = 1 | 5 | 10 | 50

interface SimulationStore {
  sessionId: string | null
  wsUrl: string | null
  isRunning: boolean
  isPaused: boolean
  currentYear: number
  speed: Speed
  currentFrame: SimulationFrame | null
  frameHistory: SimulationFrame[]
  metricsHistory: MetricsSnapshot[]
  lastActions: AgentAction[]
  startSimulation: (cityId: string, scenarioId: string, sandboxConfig?: Record<string, unknown>) => Promise<void>
  setSession: (sessionId: string, wsUrl?: string) => void
  pauseSimulation: () => void
  resumeSimulation: () => void
  setSpeed: (speed: number) => void
  receiveFrame: (frame: SimulationFrame) => void
  scrubToYear: (year: number) => void
  reset: () => void
}

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

const initialState = {
  sessionId: null,
  wsUrl: null,
  isRunning: false,
  isPaused: false,
  currentYear: 0,
  speed: 1 as Speed,
  currentFrame: null,
  frameHistory: [],
  metricsHistory: [],
  lastActions: [],
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  ...initialState,

  startSimulation: async (cityId, scenarioId, sandboxConfig) => {
    const response = await fetch(`${API_BASE}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city_id: cityId, scenario_id: scenarioId, sandbox_config: sandboxConfig }),
    })
    if (!response.ok) throw new Error(`Simulation start failed: HTTP ${response.status}`)
    const data = await response.json()
    set({
      ...initialState,
      sessionId: data.session_id,
      wsUrl: data.ws_url,
      isRunning: true,
      currentYear: 0,
    })
  },

  setSession: (sessionId, wsUrl) => set({ sessionId, wsUrl: wsUrl ?? `/ws/${sessionId}`, isRunning: true }),
  pauseSimulation: () => set({ isPaused: true, isRunning: false }),
  resumeSimulation: () => set({ isPaused: false, isRunning: true }),
  setSpeed: (speed) => set({ speed: ([1, 5, 10, 50].includes(speed) ? speed : 1) as Speed }),

  receiveFrame: (frame) =>
    set((state) => ({
      currentFrame: frame,
      currentYear: frame.year,
      frameHistory: [...state.frameHistory.filter((item) => item.year !== frame.year), frame].sort((a, b) => a.year - b.year),
      metricsHistory: [...state.metricsHistory.filter((item) => item.year !== frame.metrics_snapshot.year), frame.metrics_snapshot].sort((a, b) => a.year - b.year),
      lastActions: [...frame.agent_actions, ...state.lastActions].slice(0, 10),
    })),

  scrubToYear: (year) => {
    const frame = get().frameHistory.find((item) => item.year === year)
    if (frame) set({ currentFrame: frame, currentYear: frame.year })
  },

  reset: () => set(initialState),
}))
