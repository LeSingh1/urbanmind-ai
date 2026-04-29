import { motion, AnimatePresence } from 'framer-motion'
import { Columns2, Download, Pause, Play, RotateCcw, Settings, Share2, SkipBack, SkipForward } from 'lucide-react'
import { Logo } from '@/components/UI/LandingScreen'
import { useCityStore } from '@/stores/cityStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useSimulation } from '@/hooks/useSimulation'
import { useUIStore } from '@/stores/uiStore'

export function ControlBar({ connectionState }: { connectionState: string }) {
  const selectedCity = useCityStore((state) => state.selectedCity)
  const currentYear = useSimulationStore((state) => state.currentYear)
  const frameHistory = useSimulationStore((state) => state.frameHistory)
  const isRunning = useSimulationStore((state) => state.isRunning)
  const isPaused = useSimulationStore((state) => state.isPaused)
  const speed = useSimulationStore((state) => state.speed)
  const setSpeed = useSimulationStore((state) => state.setSpeed)
  const scrubToYear = useSimulationStore((state) => state.scrubToYear)
  const reset = useSimulationStore((state) => state.reset)
  const activeScenario = useScenarioStore((state) => state.activeScenario)
  const { start, pause, resume } = useSimulation()
  const isSplitScreen = useUIStore((state) => state.isSplitScreen)
  const setSplitScreen = useUIStore((state) => state.setSplitScreen)

  const play = () => {
    if (!selectedCity) return
    if (isPaused) resume()
    else if (!isRunning) start(selectedCity.id, activeScenario)
    else pause()
  }

  const step = (direction: 1 | -1) => {
    const years = frameHistory.map((frame) => frame.year)
    const index = Math.max(0, years.indexOf(currentYear))
    const next = years[Math.max(0, Math.min(years.length - 1, index + direction))]
    if (next !== undefined) scrubToYear(next)
  }

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 50, background: 'var(--color-bg-sidebar)', borderBottom: '1px solid var(--color-border-subtle)' }} onKeyDown={(event) => {
      if (event.code === 'Space') {
        event.preventDefault()
        play()
      }
      if (event.key === 'ArrowLeft') step(-1)
      if (event.key === 'ArrowRight') step(1)
    }}>
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260 }}>
          <Logo />
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>to {selectedCity?.name}</span>
        </div>
        <div style={{ display: 'grid', placeItems: 'center', minWidth: 170 }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: 1.4 }}>YEAR</span>
          <AnimatePresence mode="popLayout">
            <motion.strong
              key={currentYear}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ marginTop: -4, fontSize: 36, lineHeight: 0.9, fontWeight: 800, color: 'white' }}
              aria-live="polite"
            >
              {currentYear}
            </motion.strong>
          </AnimatePresence>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="icon-btn" aria-label="Reset" onClick={reset}><RotateCcw size={17} /></button>
          <button className="icon-btn" aria-label="Step back" onClick={() => step(-1)}><SkipBack size={17} /></button>
          <button className="icon-btn" aria-label="Play or pause" onClick={play} style={{ width: 44, height: 44, color: 'white', borderColor: 'var(--color-brand-primary)', background: 'var(--color-brand-primary)' }}>
            {isRunning ? <Pause size={19} /> : <Play size={19} />}
          </button>
          <button className="icon-btn" aria-label="Step forward" onClick={() => step(1)}><SkipForward size={17} /></button>
          <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} style={{ height: 36, border: '1px solid var(--color-border-subtle)', borderRadius: 8, background: 'var(--color-bg-panel)', color: 'var(--color-brand-secondary)', padding: '0 8px', fontWeight: 700 }}>
            {[1, 5, 10, 50].map((value) => <option key={value} value={value}>{value}x</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160, justifyContent: 'flex-end' }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase' }}>{connectionState}</span>
          <button className="icon-btn" aria-label="Share"><Share2 size={17} /></button>
          <button className="icon-btn" aria-label="Compare scenarios" onClick={() => setSplitScreen(!isSplitScreen)}><Columns2 size={17} /></button>
          <button className="icon-btn" aria-label="Export PDF" onClick={() => {
            const session = useSimulationStore.getState().sessionId
            if (session) window.open(`/api/simulation/${session}/export`, '_blank')
          }}><Download size={17} /></button>
          <button className="icon-btn" aria-label="Settings"><Settings size={17} /></button>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, width: `${Math.min(100, (currentYear / 50) * 100)}%`, background: 'var(--color-brand-accent)', transition: 'width 400ms ease' }} />
    </header>
  )
}
