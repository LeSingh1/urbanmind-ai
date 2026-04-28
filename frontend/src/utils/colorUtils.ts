import type { ZoneType } from '@/types/city.types'

export const ZONE_COLORS: Record<ZoneType, string> = {
  RES_LOW: '#22c55e',
  RES_MED: '#16a34a',
  RES_HIGH: '#15803d',
  COM_RETAIL: '#3b82f6',
  COM_OFFICE: '#1d4ed8',
  IND_LIGHT: '#f59e0b',
  IND_HEAVY: '#d97706',
  MIX_USE: '#8b5cf6',
  GREEN_PARK: '#4ade80',
  GREEN_FOREST: '#166534',
  HEALTH_CLINIC: '#ec4899',
  HEALTH_HOSP: '#db2777',
  EDU_SCHOOL: '#06b6d4',
  EDU_UNIVERSITY: '#0891b2',
  INFRA_POWER: '#94a3b8',
  INFRA_WATER: '#7dd3fc',
  TRANS_HUB: '#f97316',
  TRANS_HIGHWAY: '#ea580c',
  SAFETY_FIRE: '#ef4444',
  SAFETY_POLICE: '#dc2626',
  EMPTY: '#1a2235',
}

export const ZONE_LABELS: Record<ZoneType, string> = {
  RES_LOW: 'Residential Low',
  RES_MED: 'Residential Medium',
  RES_HIGH: 'Residential High',
  COM_RETAIL: 'Commercial Retail',
  COM_OFFICE: 'Commercial Office',
  IND_LIGHT: 'Light Industrial',
  IND_HEAVY: 'Heavy Industrial',
  MIX_USE: 'Mixed Use',
  GREEN_PARK: 'Park',
  GREEN_FOREST: 'Forest',
  HEALTH_CLINIC: 'Health Clinic',
  HEALTH_HOSP: 'Hospital',
  EDU_SCHOOL: 'School',
  EDU_UNIVERSITY: 'University',
  INFRA_POWER: 'Power Plant',
  INFRA_WATER: 'Water Facility',
  TRANS_HUB: 'Transit Hub',
  TRANS_HIGHWAY: 'Highway',
  SAFETY_FIRE: 'Fire Station',
  SAFETY_POLICE: 'Police Station',
  EMPTY: 'Empty',
}

export const ZONE_ICONS: Record<ZoneType, string> = {
  RES_LOW: '🏡',
  RES_MED: '🏘️',
  RES_HIGH: '🏢',
  COM_RETAIL: '🏪',
  COM_OFFICE: '🏦',
  IND_LIGHT: '🏭',
  IND_HEAVY: '⚙️',
  MIX_USE: '🏬',
  GREEN_PARK: '🌳',
  GREEN_FOREST: '🌲',
  HEALTH_CLINIC: '🏥',
  HEALTH_HOSP: '🏥',
  EDU_SCHOOL: '🏫',
  EDU_UNIVERSITY: '🎓',
  INFRA_POWER: '⚡',
  INFRA_WATER: '💧',
  TRANS_HUB: '🚉',
  TRANS_HIGHWAY: '🛣️',
  SAFETY_FIRE: '🚒',
  SAFETY_POLICE: '🚓',
  EMPTY: '⬜',
}

export function getZoneColor(zoneType: ZoneType, opacity = 1): string {
  const hex = ZONE_COLORS[zoneType] ?? '#1a2235'
  if (opacity === 1) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${opacity})`
}

export function metricToColor(value: number, min: number, max: number, colorScale: 'green' | 'red' | 'blue' = 'green'): string {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)))
  if (colorScale === 'green') {
    const r = Math.round(239 - normalized * 219)
    const g = Math.round(68 + normalized * 113)
    const b = Math.round(68 - normalized * 44)
    return `rgb(${r},${g},${b})`
  }
  if (colorScale === 'red') {
    const r = Math.round(68 + normalized * 171)
    const g = Math.round(181 - normalized * 171)
    const b = Math.round(68 - normalized * 44)
    return `rgb(${r},${g},${b})`
  }
  const r = Math.round(7 + normalized * 14)
  const g = Math.round(89 + normalized * 93)
  const b = Math.round(133 + normalized * 79)
  return `rgb(${r},${g},${b})`
}
