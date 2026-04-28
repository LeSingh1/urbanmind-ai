import { create } from 'zustand'
import type { ZoneType } from '@/types/city.types'

type Panel = 'metrics' | 'ai' | 'actions' | 'settings' | null
type MapLayer = 'zones' | 'population' | 'flood_risk' | 'transit' | 'equity'

interface UIStore {
  activePanel: Panel
  activeMapLayer: MapLayer
  selectedZoneForPlacement: ZoneType | null
  isPlacementMode: boolean
  showGrid: boolean
  showLabels: boolean
  showTooltips: boolean
  simulationSpeed: number
  sidebarCollapsed: boolean

  setActivePanel: (panel: Panel) => void
  setActiveMapLayer: (layer: MapLayer) => void
  setSelectedZoneForPlacement: (zone: ZoneType | null) => void
  togglePlacementMode: () => void
  setShowGrid: (show: boolean) => void
  setShowLabels: (show: boolean) => void
  setSimulationSpeed: (speed: number) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  activePanel: 'metrics',
  activeMapLayer: 'zones',
  selectedZoneForPlacement: null,
  isPlacementMode: false,
  showGrid: true,
  showLabels: false,
  showTooltips: true,
  simulationSpeed: 1,
  sidebarCollapsed: false,

  setActivePanel: (panel) => set({ activePanel: panel }),
  setActiveMapLayer: (layer) => set({ activeMapLayer: layer }),
  setSelectedZoneForPlacement: (zone) => set({ selectedZoneForPlacement: zone }),
  togglePlacementMode: () =>
    set((state) => ({ isPlacementMode: !state.isPlacementMode })),
  setShowGrid: (show) => set({ showGrid: show }),
  setShowLabels: (show) => set({ showLabels: show }),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
