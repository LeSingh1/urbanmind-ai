import type { GridCell } from '@/types/city.types'
import type { CityProfile } from '@/types/city.types'

export function buildGrid(city: CityProfile): GridCell[][] {
  const { rows, cols } = city.grid_size
  const { north, south, east, west } = city.bounding_box
  const latStep = (north - south) / rows
  const lngStep = (east - west) / cols

  const grid: GridCell[][] = []
  for (let y = 0; y < rows; y++) {
    const row: GridCell[] = []
    for (let x = 0; x < cols; x++) {
      row.push({
        x,
        y,
        zone_type: 'EMPTY',
        elevation: 0,
        flood_risk: 0,
        population: 0,
        lat: north - (y + 0.5) * latStep,
        lng: west + (x + 0.5) * lngStep,
      })
    }
    grid.push(row)
  }
  return grid
}

export function cellToGeoJSON(cell: GridCell, city: CityProfile) {
  const { north, south, east, west } = city.bounding_box
  const rows = city.grid_size.rows
  const cols = city.grid_size.cols
  const latStep = (north - south) / rows
  const lngStep = (east - west) / cols

  const minLng = west + cell.x * lngStep
  const maxLng = minLng + lngStep
  const maxLat = north - cell.y * latStep
  const minLat = maxLat - latStep

  return {
    type: 'Feature' as const,
    properties: {
      x: cell.x,
      y: cell.y,
      zone_type: cell.zone_type,
      population: cell.population,
      flood_risk: cell.flood_risk,
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [[
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ]],
    },
  }
}

export function gridToGeoJSON(grid: GridCell[][], city: CityProfile) {
  const features = grid
    .flat()
    .filter((cell) => cell.zone_type !== 'EMPTY')
    .map((cell) => cellToGeoJSON(cell, city))

  return {
    type: 'FeatureCollection' as const,
    features,
  }
}

export function lngLatToCell(
  lng: number,
  lat: number,
  city: CityProfile
): { x: number; y: number } | null {
  const { north, south, east, west } = city.bounding_box
  if (lng < west || lng > east || lat < south || lat > north) return null

  const x = Math.floor(((lng - west) / (east - west)) * city.grid_size.cols)
  const y = Math.floor(((north - lat) / (north - south)) * city.grid_size.rows)
  return { x, y }
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
