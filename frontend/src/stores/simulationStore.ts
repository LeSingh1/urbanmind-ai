import { create } from 'zustand'
import type { CityMetrics } from '@/types/city.types'
import type {
  SimulationStatus,
  SimulationSession,
  SimulationFrame,
  PlacementAction,
} from '@/types/simulation.types'

interface SimulationStore {
  session: SimulationSession | null
  status: SimulationStatus
  currentYear: number
  currentStep: number
  totalSteps: number
  currentMetrics: CityMetrics | null
  metricsHistory: CityMetrics[]
  recentActions: PlacementAction[]
  lastFrame: SimulationFrame | null
  replayFrames: SimulationFrame[]
  isReplaying: boolean
  replayIndex: number

  setSession: (session: SimulationSession) => void
  setStatus: (status: SimulationStatus) => void
  applyFrame: (frame: SimulationFrame) => void
  reset: () => void
  startReplay: () => void
  stepReplay: (direction: 1 | -1) => void
  stopReplay: () => void
}

const initialState = {
  session: null,
  status: 'idle' as SimulationStatus,
  currentYear: 2024,
  currentStep: 0,
  totalSteps: 0,
  currentMetrics: null,
  metricsHistory: [],
  recentActions: [],
  lastFrame: null,
  replayFrames: [],
  isReplaying: false,
  replayIndex: 0,
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  ...initialState,

  setSession: (session) => set({ session, status: 'running' }),
  setStatus: (status) => set({ status }),

  applyFrame: (frame) =>
    set((state) => {
      const newActions = [frame.action, ...state.recentActions].slice(0, 20)
      const newHistory = [...state.metricsHistory, frame.metrics]
      const newFrames = [...state.replayFrames, frame]

      return {
        lastFrame: frame,
        currentYear: frame.year,
        currentStep: frame.step,
        totalSteps: frame.total_steps,
        currentMetrics: frame.metrics,
        metricsHistory: newHistory,
        recentActions: newActions,
        replayFrames: newFrames,
      }
    }),

  reset: () => set(initialState),

  startReplay: () =>
    set((state) => ({
      isReplaying: true,
      replayIndex: 0,
      currentMetrics: state.replayFrames[0]?.metrics ?? state.currentMetrics,
      currentYear: state.replayFrames[0]?.year ?? state.currentYear,
    })),

  stepReplay: (direction) =>
    set((state) => {
      const newIndex = Math.max(
        0,
        Math.min(state.replayFrames.length - 1, state.replayIndex + direction)
      )
      const frame = state.replayFrames[newIndex]
      return {
        replayIndex: newIndex,
        currentMetrics: frame?.metrics ?? state.currentMetrics,
        currentYear: frame?.year ?? state.currentYear,
      }
    }),

  stopReplay: () => {
    const state = get()
    set({
      isReplaying: false,
      currentMetrics:
        state.replayFrames[state.replayFrames.length - 1]?.metrics ??
        state.currentMetrics,
    })
  },
}))
