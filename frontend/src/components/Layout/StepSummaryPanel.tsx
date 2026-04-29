import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAIStore } from '@/stores/aiStore'
import { useCityStore } from '@/stores/cityStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useSimulationStore } from '@/stores/simulationStore'

export function StepSummaryPanel() {
  const frame = useSimulationStore((state) => state.currentFrame)
  const city = useCityStore((state) => state.selectedCity)
  const scenario = useScenarioStore((state) => state.activeScenario)
  const fetchExplanation = useAIStore((state) => state.fetchExplanation)
  const [summary, setSummary] = useState<string[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!frame || frame.type !== 'SIM_FRAME') return
    const timer = window.setTimeout(async () => {
      const text = await fetchExplanation({
        type: 'annual_summary',
        zone_type_id: 'ANNUAL_SUMMARY',
        zone_display_name: `Year ${frame.year} summary`,
        city_name: city?.name ?? 'the city',
        surrounding_context: JSON.stringify(frame.agent_actions.slice(0, 3)),
        metrics_delta: frame.metrics_snapshot,
        scenario_goal: scenario,
      })
      setSummary(text.split(/[.;]\s+/).filter(Boolean).slice(0, 3))
      setVisible(true)
      window.setTimeout(() => setVisible(false), 5000)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [city?.name, fetchExplanation, frame, scenario])

  return (
    <AnimatePresence>
      {visible && (
        <motion.section initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }} style={{ position: 'fixed', top: 72, left: 344, right: 32, zIndex: 42, borderRadius: 10, padding: 14, background: 'rgba(17,24,39,0.94)', border: '1px solid rgba(96,165,250,0.28)', boxShadow: 'var(--shadow-md)' }}>
          <button className="icon-btn" onClick={() => setVisible(false)} style={{ position: 'absolute', right: 10, top: 10, width: 28, height: 28 }} aria-label="Dismiss annual summary"><X size={14} /></button>
          <strong style={{ color: 'white' }}>Year {frame?.year} - {city?.name}</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--color-text-secondary)', fontSize: 13 }}>{summary.map((item) => <li key={item}>{item}</li>)}</ul>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
