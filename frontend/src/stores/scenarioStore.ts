import { create } from 'zustand'
import type { ScenarioMode } from '@/types/city.types'

export interface ScenarioConfig {
  id: ScenarioMode
  name: string
  description: string
  icon: string
  weights: {
    mobility: number
    density: number
    equity: number
    green_space: number
    economic: number
    disaster_risk: number
  }
  color: string
}

export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'MAXIMUM_GROWTH',
    name: 'Maximum Growth',
    description: 'Prioritize economic expansion and density. Build fast, build tall.',
    icon: '🏙️',
    weights: { mobility: 0.20, density: 0.35, equity: 0.05, green_space: 0.05, economic: 0.30, disaster_risk: 0.05 },
    color: '#f59e0b',
  },
  {
    id: 'BALANCED_SUSTAINABLE',
    name: 'Balanced Sustainable',
    description: 'Optimize across all dimensions for long-term livability.',
    icon: '⚖️',
    weights: { mobility: 0.25, density: 0.20, equity: 0.20, green_space: 0.15, economic: 0.15, disaster_risk: 0.05 },
    color: '#10b981',
  },
  {
    id: 'CLIMATE_RESILIENT',
    name: 'Climate Resilient',
    description: 'Minimize flood risk, maximize green space and renewable energy.',
    icon: '🌿',
    weights: { mobility: 0.15, density: 0.10, equity: 0.15, green_space: 0.30, economic: 0.10, disaster_risk: 0.20 },
    color: '#06b6d4',
  },
  {
    id: 'EQUITY_FOCUSED',
    name: 'Equity Focused',
    description: 'Ensure equal access to services, housing, and opportunity.',
    icon: '🤝',
    weights: { mobility: 0.20, density: 0.15, equity: 0.35, green_space: 0.15, economic: 0.10, disaster_risk: 0.05 },
    color: '#8b5cf6',
  },
  {
    id: 'HISTORIC_PATTERN',
    name: 'Historic Pattern',
    description: 'Follow organic growth patterns observed in the city\'s history.',
    icon: '🏛️',
    weights: { mobility: 0.25, density: 0.25, equity: 0.15, green_space: 0.15, economic: 0.15, disaster_risk: 0.05 },
    color: '#ec4899',
  },
]

interface ScenarioStore {
  currentScenario: ScenarioMode
  scenarioConfig: ScenarioConfig
  setScenario: (scenario: ScenarioMode) => void
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  currentScenario: 'BALANCED_SUSTAINABLE',
  scenarioConfig: SCENARIOS[1],

  setScenario: (scenario) =>
    set({
      currentScenario: scenario,
      scenarioConfig: SCENARIOS.find((s) => s.id === scenario) ?? SCENARIOS[1],
    }),
}))
