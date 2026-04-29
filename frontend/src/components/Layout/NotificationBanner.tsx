import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useNotification } from '@/hooks/useNotification'

const colors = {
  info: 'var(--color-brand-secondary)',
  warning: 'var(--color-brand-warning)',
  error: 'var(--color-brand-danger)',
  success: 'var(--color-brand-accent)',
}

export function NotificationBanner({ connected, state }: { connected: boolean; state: string }) {
  const notifications = useNotification((store) => store.notifications)
  const dismiss = useNotification((store) => store.dismiss)
  const notify = useNotification((store) => store.notify)

  useEffect(() => {
    if (!connected && state !== 'idle') notify('warning', `WebSocket ${state}. Live simulation data is paused.`, 3000)
  }, [connected, notify, state])

  return (
    <div aria-live="assertive" style={{ position: 'fixed', top: 68, left: 340, right: 24, zIndex: 70, display: 'grid', gap: 8, pointerEvents: 'none' }}>
      <AnimatePresence>
        {notifications.map((item) => (
          <motion.div
            key={item.id}
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, background: colors[item.type], color: 'white', padding: '10px 12px', boxShadow: 'var(--shadow-md)', fontSize: 13, fontWeight: 700 }}
          >
            {item.message}
            <button onClick={() => dismiss(item.id)} aria-label="Dismiss notification" style={{ border: 0, background: 'transparent', color: 'white' }}><X size={15} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
