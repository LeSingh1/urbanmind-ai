import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, MessageSquare, Layers, Crosshair, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { MetricsDashboard } from '@/components/Simulation/MetricsDashboard'
import { AIPanel } from '@/components/AI/AIPanel'
import { ActionsPanel } from '@/components/Simulation/ActionsPanel'
import { ZonePalette } from '@/components/UI/ZonePalette'

interface LeftSidebarProps {
  ws: { override: (x: number, y: number, zone: string) => void }
}

const TABS = [
  { id: 'metrics', icon: BarChart3, label: 'Metrics' },
  { id: 'ai', icon: MessageSquare, label: 'AI Insights' },
  { id: 'actions', icon: Layers, label: 'Actions' },
  { id: 'placement', icon: Crosshair, label: 'Place Zones' },
] as const

type TabId = typeof TABS[number]['id']

export function LeftSidebar({ ws }: LeftSidebarProps) {
  const { activePanel, setActivePanel, sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <div className={`flex shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-72'}`}>
      {/* Tab icons */}
      <div className="flex flex-col items-center gap-1 py-3 px-1 bg-bg-secondary border-r border-border-subtle w-12 shrink-0">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => {
              if (sidebarCollapsed) toggleSidebar()
              setActivePanel(activePanel === id ? null : id)
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
              activePanel === id && !sidebarCollapsed
                ? 'bg-accent-blue/20 text-accent-blue'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-card'
            }`}
            title={label}
          >
            <Icon size={16} />
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={toggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Panel content */}
      <AnimatePresence>
        {!sidebarCollapsed && activePanel && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1 bg-bg-panel border-r border-border-subtle overflow-hidden flex flex-col"
          >
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-border-subtle shrink-0">
              <h2 className="text-sm font-semibold text-text-primary">
                {TABS.find((t) => t.id === activePanel)?.label}
              </h2>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto">
              {activePanel === 'metrics' && <MetricsDashboard />}
              {activePanel === 'ai' && <AIPanel />}
              {activePanel === 'actions' && <ActionsPanel />}
              {activePanel === 'placement' && <ZonePalette ws={ws} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
