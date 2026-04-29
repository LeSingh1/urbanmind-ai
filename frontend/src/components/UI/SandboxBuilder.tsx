import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useCityStore } from '@/stores/cityStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useSimulationStore } from '@/stores/simulationStore'

const archetypes = [
  ['coastal', 'Coastal', 'Ocean-adjacent expansion with sea-breeze corridors and port potential.'],
  ['inland', 'Inland', 'Classic valley city with natural protection and fertile farmland.'],
  ['river_delta', 'River Delta', 'Waterway-laced land with trade routes and flood management challenges.'],
  ['desert', 'Desert', 'Arid conditions demand compact walkable design and water-efficient planning.'],
  ['mountainous', 'Mountainous', 'Dramatic terrain defines expansion corridors and premium hillside real estate.'],
]

export function SandboxBuilder({ onGenerated }: { onGenerated: () => void }) {
  const [archetype, setArchetype] = useState('coastal')
  const [population, setPopulation] = useState(125000)
  const [terrainComplexity, setTerrainComplexity] = useState(5)
  const [waterCoverage, setWaterCoverage] = useState(35)
  const [forestCoverage, setForestCoverage] = useState(25)
  const [cityName, setCityName] = useState('New Harbor')
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const selectCity = useCityStore((state) => state.selectCity)
  const activeScenario = useScenarioStore((state) => state.activeScenario)
  const startSimulation = useSimulationStore((state) => state.startSimulation)

  useEffect(() => {
    const handle = window.setTimeout(() => drawTerrain(canvasRef.current, archetype, terrainComplexity, waterCoverage, forestCoverage), 200)
    return () => window.clearTimeout(handle)
  }, [archetype, forestCoverage, terrainComplexity, waterCoverage])

  const generate = async () => {
    setLoading(true)
    await new Promise((resolve) => window.setTimeout(resolve, 1500))
    selectCity({ id: 'sandbox', name: cityName, country: 'Sandbox', center_lat: 34.05, center_lng: -118.24, default_zoom: 11, climate_zone: archetype, population_current: population, gdp_per_capita: 48000, urban_growth_rate: 2.4, key_planning_challenge: 'A generated city shaped by terrain, water, forests, and initial population pressure.', expansion_constraint: 'Procedural terrain constraints', bbox: [-118.5, 33.85, -118.0, 34.25] })
    await startSimulation('sandbox', activeScenario, { archetype, population, terrain_complexity: terrainComplexity, water_coverage: waterCoverage, forest_coverage: forestCoverage, city_name: cityName })
    setLoading(false)
    onGenerated()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: 'min(1060px, 100%)', margin: '32px auto', border: '1px solid var(--color-border-subtle)', borderRadius: 16, background: 'rgba(17,24,39,0.9)', padding: 24 }}>
      <h2 style={{ margin: 0, color: 'white' }}>Build a New City</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginTop: 18 }}>
        {archetypes.map(([id, name, desc]) => <button key={id} onClick={() => setArchetype(id)} style={{ height: 116, border: `2px solid ${archetype === id ? 'var(--color-brand-accent)' : 'var(--color-border-subtle)'}`, borderRadius: 10, background: 'var(--color-bg-panel)', color: 'white', padding: 10, transform: archetype === id ? 'scale(1.03)' : 'scale(1)' }}><TerrainIcon kind={id} /><strong>{name}</strong><p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--color-text-muted)' }}>{desc}</p></button>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 22, marginTop: 20 }}>
        <canvas ref={canvasRef} width={200} height={200} style={{ width: 200, height: 200, borderRadius: 12, border: '1px solid var(--color-border-subtle)' }} />
        <div style={{ display: 'grid', gap: 12 }}>
          <input value={cityName} maxLength={30} onChange={(event) => setCityName(event.target.value)} placeholder="Name your city..." style={{ height: 48, border: '1px solid var(--color-border-subtle)', borderRadius: 8, background: 'var(--color-bg-app)', color: 'white', padding: '0 14px', fontSize: 20, fontWeight: 700 }} />
          <Slider label="Starting Population" value={population} min={50000} max={500000} step={5000} onChange={setPopulation} format={(v) => `${Math.round(v / 1000)}k residents`} />
          <Slider label="Terrain Complexity" value={terrainComplexity} min={1} max={10} onChange={setTerrainComplexity} />
          <Slider label="Water Coverage" value={waterCoverage} min={0} max={80} onChange={setWaterCoverage} suffix="%" />
          <Slider label="Forest Coverage" value={forestCoverage} min={0} max={70} onChange={setForestCoverage} suffix="%" />
          <button onClick={generate} disabled={loading} style={{ height: 48, border: 0, borderRadius: 8, background: 'var(--color-brand-accent)', color: 'white', fontWeight: 800, fontSize: 16 }}>{loading ? 'Generating terrain...' : 'Generate City'}</button>
        </div>
      </div>
    </motion.div>
  )
}

function Slider({ label, value, min, max, step = 1, suffix = '', format, onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; format?: (value: number) => string; onChange: (value: number) => void }) {
  return <label style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}><span style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{label}</strong><span>{format ? format(value) : `${value}${suffix}`}</span></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} style={{ width: '100%', accentColor: 'var(--color-brand-accent)' }} /></label>
}

function TerrainIcon({ kind }: { kind: string }) {
  return <svg width="100%" height="38" viewBox="0 0 100 38" aria-hidden="true"><rect width="100" height="38" rx="8" fill="#172033" /><path d={kind === 'mountainous' ? 'M0 34 L14 10 L28 32 L44 4 L64 34 L82 12 L100 34' : kind === 'river_delta' ? 'M0 20 C25 8 42 30 60 15 C70 8 86 18 100 10' : 'M0 28 C20 18 40 34 60 22 C78 12 86 18 100 14'} fill="none" stroke={kind === 'desert' ? '#D4AC0D' : '#17A589'} strokeWidth="4" /><path d="M0 36 H100" stroke={kind === 'coastal' ? '#2E86C1' : '#5D6D7E'} strokeWidth="4" /></svg>
}

function drawTerrain(canvas: HTMLCanvasElement | null, archetype: string, complexity: number, water: number, forest: number) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const image = ctx.createImageData(200, 200)
  for (let y = 0; y < 200; y += 1) {
    for (let x = 0; x < 200; x += 1) {
      const n = (Math.sin((x + complexity * 7) * 0.05) + Math.cos((y + complexity * 11) * 0.04) + Math.sin((x + y) * 0.025)) / 3
      const coast = archetype === 'coastal' && x > 150 ? -1 : 0
      const value = n + coast
      const i = (y * 200 + x) * 4
      const isWater = value < water / 100 - 0.5
      const isForest = value > 0.08 && value < forest / 100
      const isMountain = archetype === 'mountainous' && value > 0.42
      const color = isWater ? [26, 107, 138] : isMountain ? [64, 75, 86] : isForest ? [39, 124, 75] : archetype === 'desert' ? [190, 156, 89] : [166, 176, 119]
      image.data.set([...color, 255], i)
    }
  }
  ctx.putImageData(image, 0, 0)
}
