import { motion } from 'framer-motion'
import { Building2, Play, Pause, Square, Zap, Download, Settings, RefreshCw } from 'lucide-react'
import { useSimulationStore } from '@/stores/simulationStore'
import { useCityStore } from '@/stores/cityStore'
import { useScenarioStore, SCENARIOS } from '@/stores/scenarioStore'
import { useSimulation } from '@/hooks/useSimulation'

interface TopBarProps {
  ws: { connected: boolean; pause: () => void; resume: () => void; changeScenario: (s: string) => void }
}

export function TopBar({ ws }: TopBarProps) {
  const { status, currentYear, currentStep, totalSteps, session } = useSimulationStore()
  const { selectedCity } = useCityStore()
  const { currentScenario, scenarioConfig, setScenario } = useScenarioStore()
  const { startSimulation, loading, exportSimulation } = useSimulation()

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  const handleStart = async () => {
    await startSimulation(currentScenario)
  }

  const handleExport = async () => {
    if (session) await exportSimulation(session.session_id, 'json')
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-bg-secondary border-b border-border-subtle h-14 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <Building2 size={22} className="text-accent-cyan" />
        <div>
          <div className="text-sm font-bold text-text-primary leading-none">UrbanMind AI</div>
          <div className="text-xs text-text-muted font-mono leading-none mt-0.5">
            {selectedCity?.name ?? 'No city'}
          </div>
        </div>
      </div>

      <div className="w-px h-8 bg-border-subtle" />

      {/* Scenario selector */}
      <div className="flex gap-1">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setScenario(s.id)
              if (status === 'running') ws.changeScenario(s.id)
            }}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              currentScenario === s.id
                ? 'text-white'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            style={currentScenario === s.id ? { backgroundColor: s.color + '33', color: s.color } : {}}
            title={s.description}
          >
            <span className="font-mono text-[10px] mr-1">{s.icon}</span>
            {s.name}
          </button>
        ))}
      </div>

      <div className="w-px h-8 bg-border-subtle" />

      {/* Year / Progress */}
      <div className="flex items-center gap-3 min-w-[180px]">
        <div className="text-center">
          <div className="text-lg font-bold font-mono text-accent-cyan">{currentYear}</div>
          <div className="text-xs text-text-muted leading-none">Year</div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-bg-card rounded-full overflow-hidden w-32">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: scenarioConfig.color }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <motion.div
          className={`w-2 h-2 rounded-full ${
            status === 'running' ? 'bg-accent-green' :
            status === 'paused' ? 'bg-accent-amber' :
            status === 'completed' ? 'bg-accent-blue' :
            status === 'error' ? 'bg-accent-red' :
            'bg-text-muted'
          }`}
          animate={status === 'running' ? { opacity: [1, 0.4, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-xs text-text-secondary capitalize">{status}</span>
      </div>

      <div className="flex-1" />

      {/* Controls */}
      <div className="flex items-center gap-2">
        {status === 'idle' || status === 'completed' ? (
          <button
            onClick={handleStart}
            disabled={loading || !selectedCity}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-green/20 text-accent-green border border-accent-green/30 rounded-lg text-sm font-medium hover:bg-accent-green/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {loading ? 'Starting...' : 'Start Simulation'}
          </button>
        ) : status === 'running' ? (
          <button
            onClick={ws.pause}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-amber/20 text-accent-amber border border-accent-amber/30 rounded-lg text-sm font-medium hover:bg-accent-amber/30"
          >
            <Pause size={14} /> Pause
          </button>
        ) : status === 'paused' ? (
          <button
            onClick={ws.resume}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-green/20 text-accent-green border border-accent-green/30 rounded-lg text-sm font-medium hover:bg-accent-green/30"
          >
            <Play size={14} /> Resume
          </button>
        ) : null}

        {session && (
          <button
            onClick={handleExport}
            className="p-1.5 text-text-muted hover:text-text-primary border border-border-subtle rounded-lg hover:border-border-active transition-all"
            title="Export simulation data"
          >
            <Download size={14} />
          </button>
        )}

        <button
          className="p-1.5 text-text-muted hover:text-text-primary border border-border-subtle rounded-lg hover:border-border-active transition-all"
          title="Settings"
        >
          <Settings size={14} />
        </button>

        {/* WebSocket status */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono ${
          ws.connected ? 'text-accent-green' : 'text-accent-red'
        }`}>
          <Zap size={10} />
          {ws.connected ? 'LIVE' : 'OFF'}
        </div>
      </div>
    </div>
  )
}
