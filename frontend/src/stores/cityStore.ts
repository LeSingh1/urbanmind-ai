import { create } from 'zustand'
import type { CityProfile, GridCell, ZoneType } from '@/types/city.types'

interface CityStore {
  cities: CityProfile[]
  selectedCity: CityProfile | null
  grid: GridCell[][]
  hoveredCell: GridCell | null
  selectedCell: GridCell | null

  setCities: (cities: CityProfile[]) => void
  selectCity: (city: CityProfile) => void
  setGrid: (grid: GridCell[][]) => void
  updateCell: (x: number, y: number, zone_type: ZoneType) => void
  setHoveredCell: (cell: GridCell | null) => void
  setSelectedCell: (cell: GridCell | null) => void
}

export const useCityStore = create<CityStore>((set) => ({
  cities: [],
  selectedCity: null,
  grid: [],
  hoveredCell: null,
  selectedCell: null,

  setCities: (cities) => set({ cities }),
  selectCity: (city) => set({ selectedCity: city }),
  setGrid: (grid) => set({ grid }),
  updateCell: (x, y, zone_type) =>
    set((state) => {
      const newGrid = state.grid.map((row) =>
        row.map((cell) =>
          cell.x === x && cell.y === y ? { ...cell, zone_type } : cell
        )
      )
      return { grid: newGrid }
    }),
  setHoveredCell: (cell) => set({ hoveredCell: cell }),
  setSelectedCell: (cell) => set({ selectedCell: cell }),
}))
