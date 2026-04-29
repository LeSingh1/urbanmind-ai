import { useEffect, useState } from 'react'
import { ControlBar } from '@/components/Layout/ControlBar'
import { Sidebar } from '@/components/Layout/Sidebar'
import { BottomBar } from '@/components/Layout/BottomBar'
import { PopulationDashboard } from '@/components/Layout/PopulationDashboard'
import { ExplanationDrawer } from '@/components/Layout/ExplanationDrawer'
import { NotificationBanner } from '@/components/Layout/NotificationBanner'
import { StepSummaryPanel } from '@/components/Layout/StepSummaryPanel'
import { MapContainer } from '@/components/Map/MapContainer'
import { LandingScreen } from '@/components/UI/LandingScreen'
import { useCityStore } from '@/stores/cityStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const fetchCities = useCityStore((state) => state.fetchCities)
  const selectedCity = useCityStore((state) => state.selectedCity)
  const sessionId = useSimulationStore((state) => state.sessionId)
  const connection = useWebSocket(sessionId)

  useEffect(() => {
    fetchCities()
  }, [fetchCities])

  return (
    <div style={{ background: 'var(--color-bg-app)', height: '100vh', overflow: 'hidden' }}>
      {showLanding || !selectedCity ? (
        <LandingScreen onEnter={() => setShowLanding(false)} />
      ) : (
        <>
          <ControlBar connectionState={connection.connectionState} />
          <Sidebar wsSend={connection.send} />
          <MapContainer />
          <BottomBar />
          <PopulationDashboard />
          <ExplanationDrawer />
          <StepSummaryPanel />
          <NotificationBanner connected={connection.isConnected} state={connection.connectionState} />
        </>
      )}
    </div>
  )
}
