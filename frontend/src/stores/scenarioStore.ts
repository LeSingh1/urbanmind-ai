import { create } from 'zustand'
import type { ScenarioId } from '@/types/city.types'

interface ScenarioStore {
  activeScenario: ScenarioId
  setScenario: (scenario: string) => void
  scenarioColors: Record<ScenarioId, string>
  scenarioLabels: Record<ScenarioId, string>
}

export const scenarioColors: Record<ScenarioId, string> = {
  balanced: '#2E86C1',
  max_growth: '#C0392B',
  climate_resilient: '#17A589',
  equity_focused: '#8E44AD',
  historic: '#6B7280',
}

export const scenarioLabels: Record<ScenarioId, string> = {
  balanced: 'Balanced',
  max_growth: 'Max Growth',
  climate_resilient: 'Climate Resilient',
  equity_focused: 'Equity Focused',
  historic: 'Historic',
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  activeScenario: 'balanced',
  scenarioColors,
  scenarioLabels,
  setScenario: (scenario) => {
    if (scenario in scenarioLabels) set({ activeScenario: scenario as ScenarioId })
  },
}))
