import { create } from 'zustand'

export interface AIExplanation {
  id: string
  zone_type: string
  x: number
  y: number
  year: number
  explanation: string
  timestamp: number
  cached: boolean
}

interface AIStore {
  explanations: AIExplanation[]
  latestExplanation: AIExplanation | null
  isGenerating: boolean
  totalExplanations: number
  cachedCount: number

  addExplanation: (explanation: AIExplanation) => void
  setGenerating: (generating: boolean) => void
  clearHistory: () => void
}

export const useAIStore = create<AIStore>((set) => ({
  explanations: [],
  latestExplanation: null,
  isGenerating: false,
  totalExplanations: 0,
  cachedCount: 0,

  addExplanation: (explanation) =>
    set((state) => ({
      explanations: [explanation, ...state.explanations].slice(0, 50),
      latestExplanation: explanation,
      totalExplanations: state.totalExplanations + 1,
      cachedCount: state.cachedCount + (explanation.cached ? 1 : 0),
    })),

  setGenerating: (generating) => set({ isGenerating: generating }),
  clearHistory: () =>
    set({ explanations: [], latestExplanation: null, totalExplanations: 0, cachedCount: 0 }),
}))
