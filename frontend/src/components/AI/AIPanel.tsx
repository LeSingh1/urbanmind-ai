import { motion, AnimatePresence } from 'framer-motion'
import { useAIStore } from '@/stores/aiStore'
import { ZONE_ICONS } from '@/utils/colorUtils'
import { Cpu, Zap, Clock } from 'lucide-react'

export function AIPanel() {
  const { explanations, latestExplanation, isGenerating, totalExplanations, cachedCount } = useAIStore()

  return (
    <div className="p-3 space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={<Cpu size={12} />} label="Total" value={totalExplanations.toString()} />
        <StatCard icon={<Zap size={12} />} label="Cached" value={cachedCount.toString()} color="text-accent-cyan" />
        <StatCard
          icon={<Clock size={12} />}
          label="Live"
          value={(totalExplanations - cachedCount).toString()}
          color="text-accent-green"
        />
      </div>

      {/* Generating indicator */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-xs text-accent-blue"
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-accent-blue"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            Claude is analyzing...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Latest explanation hero */}
      {latestExplanation && (
        <motion.div
          key={latestExplanation.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card rounded-lg p-3 border border-accent-blue/20"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{ZONE_ICONS[latestExplanation.zone_type as keyof typeof ZONE_ICONS] ?? '🏗️'}</span>
              <span className="text-xs font-medium text-accent-blue">{latestExplanation.zone_type}</span>
            </div>
            <div className="flex items-center gap-2">
              {latestExplanation.cached && (
                <span className="text-xs text-text-muted px-1.5 py-0.5 bg-bg-secondary rounded">cached</span>
              )}
              <span className="text-xs text-text-muted font-mono">Y{latestExplanation.year}</span>
            </div>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {latestExplanation.explanation}
          </p>
          <div className="mt-2 text-xs text-text-muted font-mono">
            ({latestExplanation.x}, {latestExplanation.y})
          </div>
        </motion.div>
      )}

      {/* History */}
      {explanations.length > 1 && (
        <div>
          <div className="text-xs text-text-muted mb-2">History</div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {explanations.slice(1, 10).map((exp) => (
              <div key={exp.id} className="border-l-2 border-border-subtle pl-2 py-0.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs">{ZONE_ICONS[exp.zone_type as keyof typeof ZONE_ICONS] ?? '🏗️'}</span>
                  <span className="text-xs text-text-muted">{exp.zone_type} — Y{exp.year}</span>
                  {exp.cached && <span className="text-xs text-text-muted">⚡</span>}
                </div>
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{exp.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {explanations.length === 0 && (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">🤖</div>
          <div className="text-sm text-text-muted">
            AI explanations will appear here as the simulation places zones
          </div>
          <div className="mt-2 text-xs text-text-muted">
            Powered by Claude claude-sonnet-4-20250514
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color = 'text-text-primary' }: {
  icon: React.ReactNode
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="bg-bg-card rounded-lg p-2 text-center">
      <div className={`flex items-center justify-center gap-1 text-text-muted mb-1 ${color}`}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
    </div>
  )
}
