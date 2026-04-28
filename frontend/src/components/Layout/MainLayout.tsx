import { useState } from 'react'
import { TopBar } from './TopBar'
import { LeftSidebar } from './LeftSidebar'
import { RightPanel } from './RightPanel'
import { MapContainer } from '@/components/Map/MapContainer'
import { useSimulationStore } from '@/stores/simulationStore'
import { useWebSocket } from '@/hooks/useWebSocket'

export function MainLayout() {
  const { session } = useSimulationStore()
  const sessionId = session?.session_id ?? null
  const ws = useWebSocket(sessionId)

  return (
    <div className="flex flex-col w-full h-full bg-bg-primary overflow-hidden">
      <TopBar ws={ws} />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar ws={ws} />
        <MapContainer ws={ws} />
        <RightPanel />
      </div>
    </div>
  )
}
