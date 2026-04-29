import { create } from 'zustand'

export type NotificationType = 'info' | 'warning' | 'error' | 'success'

export interface NotificationItem {
  id: string
  type: NotificationType
  message: string
  duration: number
}

interface NotificationStore {
  notifications: NotificationItem[]
  notify: (type: NotificationType, message: string, duration?: number) => void
  dismiss: (id: string) => void
}

export const useNotification = create<NotificationStore>((set, get) => ({
  notifications: [],
  notify: (type, message, duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    set((state) => ({ notifications: [{ id, type, message, duration }, ...state.notifications].slice(0, 4) }))
    window.setTimeout(() => get().dismiss(id), duration)
  },
  dismiss: (id) => set((state) => ({ notifications: state.notifications.filter((item) => item.id !== id) })),
}))
