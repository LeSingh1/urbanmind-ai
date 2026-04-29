import { create } from 'zustand'
import type { ZoneExplanation } from '@/types/simulation.types'

type Tab = 'overview' | 'mobility' | 'economy' | 'environment'

interface UIStore {
  activeLayers: Set<string>
  activeTab: Tab
  isDashboardOpen: boolean
  isDrawerOpen: boolean
  drawerContent: ZoneExplanation | null
  isSplitScreen: boolean
  isOverrideModeActive: boolean
  selectedOverrideZone: string | null
  detailedGrid: boolean
  activeMapLayer: string
  toggleLayer: (layerId: string) => void
  setActiveTab: (tab: Tab) => void
  openDashboard: () => void
  closeDashboard: () => void
  openDrawer: (content: ZoneExplanation) => void
  closeDrawer: () => void
  setOverrideZone: (zoneId: string | null) => void
  setSplitScreen: (enabled: boolean) => void
  setDetailedGrid: (enabled: boolean) => void
  setActiveMapLayer: (layer: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeLayers: new Set(['Zones', 'Roads', '3D Buildings']),
  activeTab: 'overview',
  isDashboardOpen: false,
  isDrawerOpen: false,
  drawerContent: null,
  isSplitScreen: false,
  isOverrideModeActive: false,
  selectedOverrideZone: null,
  detailedGrid: false,
  activeMapLayer: 'zones',

  toggleLayer: (layerId) =>
    set((state) => {
      const next = new Set(state.activeLayers)
      if (next.has(layerId)) next.delete(layerId)
      else next.add(layerId)
      return { activeLayers: next }
    }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  openDashboard: () => set({ isDashboardOpen: true }),
  closeDashboard: () => set({ isDashboardOpen: false }),
  openDrawer: (content) => set({ isDrawerOpen: true, drawerContent: content }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  setOverrideZone: (zoneId) => set({ selectedOverrideZone: zoneId, isOverrideModeActive: Boolean(zoneId) }),
  setSplitScreen: (enabled) => set({ isSplitScreen: enabled }),
  setDetailedGrid: (enabled) => set({ detailedGrid: enabled }),
  setActiveMapLayer: (layer) => set({ activeMapLayer: layer }),
}))
