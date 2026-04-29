import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, X } from 'lucide-react'
import { useCityStore } from '@/stores/cityStore'
import type { CityProfile } from '@/types/city.types'
import { SandboxBuilder } from './SandboxBuilder'

interface Props {
  onEnter: () => void
}

export function LandingScreen({ onEnter }: Props) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [sandboxOpen, setSandboxOpen] = useState(false)

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: '#0D1117' }}>
      <AnimatedCityscape />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24 }}>
        <motion.div
          className="glass-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: 'min(520px, 100%)', borderRadius: 16, padding: 36, textAlign: 'center' }}
        >
          <Logo large />
          <p style={{ margin: '16px 0 28px', color: 'var(--color-text-secondary)', fontSize: 20, fontStyle: 'italic' }}>
            Plan the cities of tomorrow, today.
          </p>
          <button className="primary-cta" onClick={() => setGalleryOpen(true)}>Explore a Real City</button>
          <button className="secondary-cta" onClick={() => setSandboxOpen(true)}>Build a New City</button>
        </motion.div>
      </div>
      <AnimatePresence>
        {galleryOpen && <CityGallery onClose={() => setGalleryOpen(false)} onEnter={onEnter} />}
        {sandboxOpen && <SandboxOverlay onClose={() => setSandboxOpen(false)} onGenerated={onEnter} />}
      </AnimatePresence>
      <style>{`
        .primary-cta, .secondary-cta {
          width: 100%;
          height: 46px;
          border-radius: var(--radius-md);
          margin-top: 12px;
          font-weight: 700;
          font-size: 16px;
          transition: var(--transition-fast);
        }
        .primary-cta {
          border: 1px solid var(--color-brand-primary);
          background: var(--color-brand-primary);
          color: white;
        }
        .secondary-cta {
          border: 1px solid var(--color-brand-accent);
          background: transparent;
          color: var(--color-brand-accent);
        }
        .city-gallery-card:hover {
          transform: translateY(-4px);
          border-color: var(--color-border-active);
          box-shadow: var(--shadow-lg);
        }
      `}</style>
    </div>
  )
}

function SandboxOverlay({ onClose, onGenerated }: { onClose: () => void; onGenerated: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 110, overflow: 'auto', padding: 32, background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(8px)' }}>
      <button className="icon-btn" onClick={onClose} style={{ position: 'fixed', top: 20, right: 20 }} aria-label="Close sandbox builder"><X size={18} /></button>
      <SandboxBuilder onGenerated={() => { onClose(); onGenerated() }} />
    </motion.div>
  )
}

export function Logo({ large = false }: { large?: boolean }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <svg width={large ? 64 : 28} height={large ? 48 : 24} viewBox="0 0 64 48" aria-hidden="true">
        <defs>
          <linearGradient id="urbanmind-logo" x1="0" x2="1">
            <stop offset="0%" stopColor="#2E86C1" />
            <stop offset="100%" stopColor="#17A589" />
          </linearGradient>
        </defs>
        <path d="M5 43V25h8V11h10v32h6V18h9v25h5V6h12v37h4v4H2v-4h3z" fill="url(#urbanmind-logo)" />
      </svg>
      <strong style={{ color: 'white', fontSize: large ? 48 : 16, fontWeight: 800, letterSpacing: 0 }}>
        UrbanMind AI
      </strong>
    </div>
  )
}

function CityGallery({ onClose, onEnter }: { onClose: () => void; onEnter: () => void }) {
  const cities = useCityStore((state) => state.cities)
  const selectCity = useCityStore((state) => state.selectCity)

  const chooseCity = (city: CityProfile) => {
    selectCity(city)
    onClose()
    onEnter()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'auto', padding: 32, background: 'rgba(13,17,23,0.86)', backdropFilter: 'blur(8px)' }}
    >
      <button className="icon-btn" onClick={onClose} style={{ position: 'fixed', top: 20, right: 20 }} aria-label="Close city gallery"><X size={18} /></button>
      <div style={{ width: 'min(960px, 100%)', margin: '48px auto', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
        <button className="city-gallery-card" onClick={() => { onClose(); }} style={{ width: '100%', textAlign: 'left', border: '1px dashed var(--color-brand-accent)', borderRadius: 8, overflow: 'hidden', background: 'var(--color-bg-panel)', transition: 'var(--transition-med)', color: 'white', padding: 18, minHeight: 260 }}>
          <Building2 size={28} />
          <h3>New Sandbox City</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Use the Build a New City option on the landing screen to generate procedural terrain.</p>
        </button>
        {cities.map((city) => (
          <button
            key={city.id}
            className="city-gallery-card"
            onClick={() => chooseCity(city)}
            style={{ width: '100%', textAlign: 'left', border: '1px solid var(--color-border-subtle)', borderRadius: 8, overflow: 'hidden', background: 'var(--color-bg-panel)', transition: 'var(--transition-med)', color: 'white', padding: 0 }}
          >
            <img src={thumbnailUrl(city)} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block', background: 'var(--color-bg-card)' }} />
            <div style={{ padding: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{city.name}</h3>
              <p style={{ margin: '4px 0 8px', fontSize: 13, color: 'var(--color-text-secondary)' }}>{city.country} · {formatPopulation(city.population_current)}</p>
              <p style={{ minHeight: 36, margin: 0, fontSize: 12, lineHeight: 1.45, color: 'var(--color-text-muted)' }}>{city.key_planning_challenge}</p>
              <div style={{ marginTop: 12, color: 'var(--color-text-accent)', fontSize: 12, fontWeight: 700 }}>Plan This City</div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

function AnimatedCityscape() {
  const buildings = Array.from({ length: 44 }, (_, i) => ({ x: i * 34, h: 80 + ((i * 37) % 180), w: 22 + ((i * 13) % 28) }))
  return (
    <svg style={{ position: 'absolute', inset: 'auto 0 0 0', width: '140%', height: '62%', opacity: 0.55, animation: 'skylineDrift 40s linear infinite' }} viewBox="0 0 1500 500" preserveAspectRatio="none">
      <rect width="1500" height="500" fill="transparent" />
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={500 - b.h} width={b.w} height={b.h} fill={i % 3 === 0 ? '#111827' : '#1F2937'} />
          {Array.from({ length: Math.floor(b.h / 24) }, (_, j) => (
            <rect key={j} x={b.x + 6} y={500 - b.h + 10 + j * 22} width="5" height="8" fill="#2E86C1" style={{ animation: `windowGlow ${2 + (i % 4)}s ease-in-out infinite` }} />
          ))}
        </g>
      ))}
    </svg>
  )
}

function thumbnailUrl(city: CityProfile): string {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  if (!token) return ''
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${city.center_lng},${city.center_lat},${city.default_zoom}/280x160@2x?access_token=${token}`
}

function formatPopulation(value: number) {
  return `${(value / 1_000_000).toFixed(value > 10_000_000 ? 1 : 2)}M residents`
}
