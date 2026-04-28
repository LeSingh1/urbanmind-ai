import { useEffect, useRef, useCallback, useState } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'
import { useCityStore } from '@/stores/cityStore'
import { useAIStore } from '@/stores/aiStore'
import type { SimulationFrame, SimulationInitMessage, SimulationCompleteMessage } from '@/types/simulation.types'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'

export function useWebSocket(sessionId: string | null) {
  const ws = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { applyFrame, setStatus } = useSimulationStore()
  const { setGrid } = useCityStore()
  const { addExplanation } = useAIStore()

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string)

        if (msg.type === 'SIM_INIT') {
          const init = msg as SimulationInitMessage
          setGrid(init.grid)
          setStatus('running')
        } else if (msg.type === 'SIM_FRAME') {
          const frame = msg as SimulationFrame
          applyFrame(frame)

          if (frame.ai_explanation) {
            addExplanation({
              id: `${frame.year}-${frame.action.x}-${frame.action.y}`,
              zone_type: frame.action.zone_type,
              x: frame.action.x,
              y: frame.action.y,
              year: frame.year,
              explanation: frame.ai_explanation,
              timestamp: Date.now(),
              cached: false,
            })
          }
        } else if (msg.type === 'SIM_COMPLETE') {
          const complete = msg as SimulationCompleteMessage
          setStatus('completed')
          console.info('[WebSocket] Simulation complete. Score:', complete.score)
        } else if (msg.type === 'SIM_PAUSED') {
          setStatus('paused')
        } else if (msg.type === 'SIM_RESUMED') {
          setStatus('running')
        } else if (msg.type === 'ERROR') {
          setError(msg.message as string)
          setStatus('error')
        }
      } catch (e) {
        console.error('[WebSocket] Parse error', e)
      }
    },
    [applyFrame, setGrid, setStatus, addExplanation]
  )

  useEffect(() => {
    if (!sessionId) return

    const url = `${WS_BASE}/ws/${sessionId}`
    const socket = new WebSocket(url)
    ws.current = socket

    socket.onopen = () => {
      setConnected(true)
      setError(null)
    }

    socket.onclose = () => {
      setConnected(false)
    }

    socket.onerror = () => {
      setError('WebSocket connection failed')
      setConnected(false)
    }

    socket.onmessage = handleMessage

    return () => {
      socket.close()
    }
  }, [sessionId, handleMessage])

  const send = useCallback((data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    }
  }, [])

  const pause = useCallback(() => send({ type: 'PAUSE' }), [send])
  const resume = useCallback(() => send({ type: 'RESUME' }), [send])
  const override = useCallback(
    (x: number, y: number, zone_type: string) =>
      send({ type: 'USER_OVERRIDE', x, y, zone_type }),
    [send]
  )
  const changeScenario = useCallback(
    (scenario: string) => send({ type: 'SCENARIO_CHANGE', scenario }),
    [send]
  )

  return { connected, error, send, pause, resume, override, changeScenario }
}
