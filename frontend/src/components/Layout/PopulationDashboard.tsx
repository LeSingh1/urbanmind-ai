import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Download, X } from 'lucide-react'
import { useCityStore } from '@/stores/cityStore'
import { useUIStore } from '@/stores/uiStore'
import { PopulationTimeline } from '@/components/Charts/PopulationTimeline'
import { ZoneStackedArea } from '@/components/Charts/ZoneStackedArea'
import { GrowthRadar } from '@/components/Charts/GrowthRadar'
import { InfraGrowthScatter } from '@/components/Charts/InfraGrowthScatter'
import { ScenarioComparison } from '@/components/Charts/ScenarioComparison'

const tabs = ['Population', 'Mobility', 'Economy', 'Environment', 'Equity', 'Infrastructure']

export function PopulationDashboard() {
  const isOpen = useUIStore((state) => state.isDashboardOpen)
  const close = useUIStore((state) => state.closeDashboard)
  const city = useCityStore((state) => state.selectedCity)
  const isSplit = useUIStore((state) => state.isSplitScreen)
  const [tab, setTab] = useState('Population')

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.section
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'fixed', left: 320, right: 0, bottom: 0, height: '65vh', zIndex: 35, borderTop: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', background: 'var(--color-bg-panel)', boxShadow: 'var(--shadow-lg)', padding: '16px 20px 20px', overflow: 'auto' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="analytics-title"
        >
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h2 id="analytics-title" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>City Analytics Dashboard - {city?.name}</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="icon-btn" aria-label="Detach dashboard"><Copy size={16} /></button>
              <button className="icon-btn" aria-label="Export dashboard PDF"><Download size={16} /></button>
              <button className="icon-btn" onClick={close} aria-label="Close dashboard"><X size={16} /></button>
            </div>
          </header>

          <nav style={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(${tabs.length}, 1fr)`, marginTop: 14, borderBottom: '1px solid var(--color-border-subtle)' }}>
            {tabs.map((item) => <button key={item} onClick={() => setTab(item)} style={{ height: 36, border: 0, background: 'transparent', color: tab === item ? 'white' : 'var(--color-text-muted)', fontWeight: 700 }}>{item}</button>)}
            <span style={{ position: 'absolute', bottom: -1, left: `${tabs.indexOf(tab) * (100 / tabs.length)}%`, width: `${100 / tabs.length}%`, height: 2, background: 'var(--color-brand-secondary)', transition: 'left 200ms ease' }} />
          </nav>

          <div style={{ display: 'grid', gridTemplateRows: '55% 45%', minHeight: 430, gap: 14, marginTop: 14 }}>
            <ChartCard title={`${tab} Timeline`} large><PopulationTimeline /></ChartCard>
            <div style={{ display: 'grid', gridTemplateColumns: isSplit ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 14 }}>
              <ChartCard title="Zone Structure"><ZoneStackedArea /></ChartCard>
              <ChartCard title="Growth Factors"><GrowthRadar /></ChartCard>
              <ChartCard title="Infrastructure vs Growth"><InfraGrowthScatter /></ChartCard>
              {isSplit && <ChartCard title="Scenario Comparison"><ScenarioComparison /></ChartCard>}
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

function ChartCard({ title, large, children }: { title: string; large?: boolean; children: React.ReactNode }) {
  return (
    <section style={{ minHeight: large ? 290 : 210, border: '1px solid var(--color-border-subtle)', borderRadius: 8, background: 'rgba(13,17,23,0.28)', padding: 12, overflow: 'hidden' }}>
      <h3 style={{ margin: '0 0 8px', color: 'white', fontSize: 13, fontWeight: 800 }}>{title}</h3>
      {children}
    </section>
  )
}
