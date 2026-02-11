'use client'

/**
 * Offline Queue usando @capacitor/preferences
 * - Quando offline: salva ação localmente
 * - Quando voltar online: sync automático
 * Fallback: localStorage quando não há Capacitor
 */

import { isNativePlatform } from './platform'

export interface OfflineAction {
  id: string
  type: 'CREATE_DEAL' | 'UPDATE_DEAL' | 'CREATE_CONTACT'
  payload: Record<string, unknown>
  createdAt: string
}

const QUEUE_KEY = 'sirius_offline_queue'

async function getStorage() {
  if (isNativePlatform()) {
    const { Preferences } = await import('@capacitor/preferences')
    return {
      get: async (key: string) => {
        const { value } = await Preferences.get({ key })
        return value
      },
      set: async (key: string, value: string) => {
        await Preferences.set({ key, value })
      },
    }
  } else {
    return {
      get: async (key: string) => localStorage.getItem(key),
      set: async (key: string, value: string) => localStorage.setItem(key, value),
    }
  }
}

export async function queueOfflineAction(action: Omit<OfflineAction, 'id' | 'createdAt'>): Promise<void> {
  const storage = await getStorage()
  const existing = await storage.get(QUEUE_KEY)
  const queue: OfflineAction[] = existing ? JSON.parse(existing) : []

  queue.push({
    ...action,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })

  await storage.set(QUEUE_KEY, JSON.stringify(queue))
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  const storage = await getStorage()
  const data = await storage.get(QUEUE_KEY)
  return data ? JSON.parse(data) : []
}

export async function clearOfflineQueue(): Promise<void> {
  const storage = await getStorage()
  await storage.set(QUEUE_KEY, '[]')
}

export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = await getOfflineQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0
  const remaining: OfflineAction[] = []

  for (const action of queue) {
    try {
      let url = ''
      let method = 'POST'

      if (action.type === 'CREATE_DEAL') {
        url = '/api/v1/deals'
      } else if (action.type === 'UPDATE_DEAL') {
        url = `/api/v1/deals/${action.payload.id}`
        method = 'PATCH'
      } else if (action.type === 'CREATE_CONTACT') {
        url = '/api/v1/contacts'
      } else {
        remaining.push(action)
        continue
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      })

      if (res.ok) {
        synced++
      } else {
        remaining.push(action)
        failed++
      }
    } catch {
      remaining.push(action)
      failed++
    }
  }

  const storage = await getStorage()
  await storage.set(QUEUE_KEY, JSON.stringify(remaining))

  return { synced, failed }
}
