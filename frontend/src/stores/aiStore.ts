import { create } from 'zustand'
import type { ExplainParams, ZoneExplanation } from '@/types/simulation.types'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

interface AIStore {
  explanationCache: Record<string, string>
  isLoadingExplanation: boolean
  lastExplanations: ZoneExplanation[]
  fetchExplanation: (params: ExplainParams) => Promise<string>
  addDecision: (decision: ZoneExplanation) => void
}

export const useAIStore = create<AIStore>((set, get) => ({
  explanationCache: {},
  isLoadingExplanation: false,
  lastExplanations: [],

  fetchExplanation: async (params) => {
    const key = await computeContextHash(params)
    const cached = get().explanationCache[key]
    if (cached) return cached

    set({ isLoadingExplanation: true })
    try {
      const response = await fetch(`${API_BASE}/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const data = response.ok ? await response.json() : null
      const text = data?.explanation_text ?? data?.explanation ?? fallbackExplanation(params)
      const decision = toDecision(params, text)
      set((state) => ({
        explanationCache: { ...state.explanationCache, [key]: text },
        isLoadingExplanation: false,
        lastExplanations: [decision, ...state.lastExplanations].slice(0, 10),
      }))
      return text
    } catch {
      const text = fallbackExplanation(params)
      const decision = toDecision(params, text)
      set((state) => ({
        explanationCache: { ...state.explanationCache, [key]: text },
        isLoadingExplanation: false,
        lastExplanations: [decision, ...state.lastExplanations].slice(0, 10),
      }))
      return text
    }
  },

  addDecision: (decision) =>
    set((state) => ({
      lastExplanations: [decision, ...state.lastExplanations].slice(0, 10),
    })),
}))

async function computeContextHash(value: unknown): Promise<string> {
  const encoded = new TextEncoder().encode(JSON.stringify(value))
  if (crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', encoded)
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  return btoa(unescape(encodeURIComponent(JSON.stringify(value)))).slice(0, 64)
}

function fallbackExplanation(params: ExplainParams): string {
  return `${params.zone_display_name} supports the ${params.scenario_goal} plan by responding to nearby land use, service coverage, and growth pressure in ${params.city_name}.`
}

function toDecision(params: ExplainParams, explanation_text: string): ZoneExplanation {
  return {
    zone_type_id: params.zone_type_id,
    zone_display_name: params.zone_display_name,
    x: 0,
    y: 0,
    year: 0,
    explanation_text,
    metrics_delta: params.metrics_delta,
    surrounding_context: params.surrounding_context,
  }
}
