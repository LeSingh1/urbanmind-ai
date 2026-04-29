const tokenHex: Record<string, string> = {
  '--zone-res-low': '#F5CBA7',
  '--zone-res-med': '#E59866',
  '--zone-res-high': '#CA6F1E',
  '--zone-industrial': '#5D6D7E',
  '--zone-commercial': '#2E86C1',
  '--zone-mixed-use': '#A9DFBF',
  '--zone-green': '#27AE60',
  '--zone-forest': '#1E8449',
  '--zone-transit': '#8E44AD',
  '--zone-health': '#E74C3C',
  '--zone-education': '#F9E79F',
  '--zone-utility': '#7D6608',
  '--zone-government': '#5D4E75',
  '--zone-culture': '#D4AC0D',
  '--zone-disaster': '#E67E22',
  '--zone-smart': '#00BCD4',
  '--zone-waterfront': '#1A6B8A',
  '--zone-landmark': '#C0392B',
  '--zone-office': '#2980B9',
  '--zone-food': '#27AE60',
}

export function getZoneToken(zoneTypeId = ''): string {
  if (zoneTypeId.startsWith('RES_LOW')) return '--zone-res-low'
  if (zoneTypeId.startsWith('RES_MED') || zoneTypeId.includes('APARTMENT')) return '--zone-res-med'
  if (zoneTypeId.startsWith('RES_HIGH') || zoneTypeId.includes('TOWER')) return '--zone-res-high'
  if (zoneTypeId.startsWith('IND_') || zoneTypeId.startsWith('MAINT_')) return '--zone-industrial'
  if (zoneTypeId.startsWith('COM_')) return '--zone-commercial'
  if (zoneTypeId.includes('MIXED')) return '--zone-mixed-use'
  if (zoneTypeId.startsWith('PARK_') || zoneTypeId.startsWith('ENV_TREE') || zoneTypeId.includes('GREEN_BELT')) return '--zone-green'
  if (zoneTypeId.includes('FOREST') || zoneTypeId.includes('NATURE')) return '--zone-forest'
  if (zoneTypeId.includes('BUS') || zoneTypeId.includes('METRO') || zoneTypeId.includes('TRAIN') || zoneTypeId.includes('TRANSIT') || zoneTypeId.includes('TRAM')) return '--zone-transit'
  if (zoneTypeId.startsWith('HEALTH_')) return '--zone-health'
  if (zoneTypeId.startsWith('EDU_')) return '--zone-education'
  if (zoneTypeId.includes('POWER') || zoneTypeId.includes('WATER') || zoneTypeId.includes('SUBSTATION') || zoneTypeId.includes('GRID')) return '--zone-utility'
  if (zoneTypeId.startsWith('GOV_') || zoneTypeId.includes('COURT') || zoneTypeId.includes('POLICE')) return '--zone-government'
  if (zoneTypeId.startsWith('CULT_') || zoneTypeId.startsWith('ENT_') || zoneTypeId.startsWith('SPORT_')) return '--zone-culture'
  if (zoneTypeId.startsWith('DIS_') || zoneTypeId.includes('FIRE')) return '--zone-disaster'
  if (zoneTypeId.startsWith('SMART_') || zoneTypeId.includes('DATA')) return '--zone-smart'
  if (zoneTypeId.startsWith('WATER_') || zoneTypeId.includes('HARBOR') || zoneTypeId.includes('FERRY')) return '--zone-waterfront'
  if (zoneTypeId.startsWith('LAND_')) return '--zone-landmark'
  if (zoneTypeId.startsWith('OFF_')) return '--zone-office'
  if (zoneTypeId.startsWith('FOOD_')) return '--zone-food'
  return '--zone-green'
}

export function getZoneColor(zoneTypeId = ''): string {
  return tokenHex[getZoneToken(zoneTypeId)] ?? '#27AE60'
}

export function lightenHex(hex: string, amount = 0.3): string {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount)
  return `#${[mix(r), mix(g), mix(b)].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

export function zoneColorExpression(): unknown[] {
  const pairs = Object.entries({
    RES_LOW_DETACHED: getZoneColor('RES_LOW_DETACHED'),
    RES_MED_APARTMENT: getZoneColor('RES_MED_APARTMENT'),
    RES_HIGH_TOWER: getZoneColor('RES_HIGH_TOWER'),
    RES_AFFORDABLE: getZoneColor('RES_AFFORDABLE'),
    COM_SMALL_SHOP: getZoneColor('COM_SMALL_SHOP'),
    COM_OFFICE_PLAZA: getZoneColor('COM_OFFICE_PLAZA'),
    IND_WAREHOUSE: getZoneColor('IND_WAREHOUSE'),
    PARK_SMALL: getZoneColor('PARK_SMALL'),
    BUS_STATION: getZoneColor('BUS_STATION'),
    HEALTH_HOSPITAL: getZoneColor('HEALTH_HOSPITAL'),
    EDU_HIGH: getZoneColor('EDU_HIGH'),
    SOLAR_FARM: getZoneColor('SOLAR_FARM'),
    SMART_TRAFFIC_LIGHT: getZoneColor('SMART_TRAFFIC_LIGHT'),
  }).flat()
  return ['match', ['get', 'zone_type_id'], ...pairs, ['get', 'fill']]
}
