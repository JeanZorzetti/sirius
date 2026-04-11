'use client'

/**
 * Offline Queue usando @capacitor/preferences (nativo) ou localStorage (web).
 *
 * Fluxo:
 * 1. Quando offline, chame `queueOfflineAction({ type, payload })`
 * 2. Quando voltar online, chame `syncOfflineQueue()` (NetworkStatusBanner faz isso automaticamente)
 * 3. Ações com falha são re-enfileiradas com backoff exponencial
 *
 * Tipos de ação suportados (Sprint 3.2 expandido):
 * - CREATE_DEAL, UPDATE_DEAL, DELETE_DEAL
 * - CREATE_CONTACT, UPDATE_CONTACT, DELETE_CONTACT
 * - CREATE_NOTE
 * - SEND_MESSAGE (chat)
 * - CREATE_TASK
 */

import { isNativePlatform } from './platform'

export type OfflineActionType =
  | 'CREATE_DEAL'
  | 'UPDATE_DEAL'
  | 'DELETE_DEAL'
  | 'CREATE_CONTACT'
  | 'UPDATE_CONTACT'
  | 'DELETE_CONTACT'
  | 'CREATE_NOTE'
  | 'SEND_MESSAGE'
  | 'CREATE_TASK'

export interface OfflineAction {
  id: string
  type: OfflineActionType
  payload: Record<string, unknown>
  createdAt: string
  /** Quantas tentativas de sync já falharam para esta ação. */
  attempts: number
  /** Próximo timestamp em que pode ser re-tentada (backoff exponencial). */
  nextRetryAt: string
}

const QUEUE_KEY = 'sirius_offline_queue'
const MAX_ATTEMPTS = 5

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
      get: async (key: string) => {
        if (typeof localStorage === 'undefined') return null
        return localStorage.getItem(key)
      },
      set: async (key: string, value: string) => {
        if (typeof localStorage === 'undefined') return
        localStorage.setItem(key, value)
      },
    }
  }
}

export async function queueOfflineAction(
  action: Pick<OfflineAction, 'type' | 'payload'>,
): Promise<OfflineAction> {
  const storage = await getStorage()
  const existing = await storage.get(QUEUE_KEY)
  const queue: OfflineAction[] = existing ? JSON.parse(existing) : []

  const now = new Date().toISOString()
  const newAction: OfflineAction = {
    ...action,
    id: crypto.randomUUID(),
    createdAt: now,
    attempts: 0,
    nextRetryAt: now,
  }

  queue.push(newAction)
  await storage.set(QUEUE_KEY, JSON.stringify(queue))
  return newAction
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  const storage = await getStorage()
  const data = await storage.get(QUEUE_KEY)
  return data ? JSON.parse(data) : []
}

export async function getQueueSize(): Promise<number> {
  const queue = await getOfflineQueue()
  return queue.length
}

export async function clearOfflineQueue(): Promise<void> {
  const storage = await getStorage()
  await storage.set(QUEUE_KEY, '[]')
}

/**
 * Resolve o endpoint REST e o método HTTP para uma ação offline.
 * Retorna null para tipos que ainda não têm rota mapeada.
 */
function resolveEndpoint(action: OfflineAction): { url: string; method: string } | null {
  switch (action.type) {
    case 'CREATE_DEAL':
      return { url: '/api/v1/deals', method: 'POST' }
    case 'UPDATE_DEAL':
      return { url: `/api/v1/deals/${action.payload.id}`, method: 'PATCH' }
    case 'DELETE_DEAL':
      return { url: `/api/v1/deals/${action.payload.id}`, method: 'DELETE' }
    case 'CREATE_CONTACT':
      return { url: '/api/v1/contacts', method: 'POST' }
    case 'UPDATE_CONTACT':
      return { url: `/api/v1/contacts/${action.payload.id}`, method: 'PATCH' }
    case 'DELETE_CONTACT':
      return { url: `/api/v1/contacts/${action.payload.id}`, method: 'DELETE' }
    case 'CREATE_NOTE':
      return { url: `/api/v1/deals/${action.payload.dealId}/notes`, method: 'POST' }
    case 'SEND_MESSAGE':
      return { url: '/api/chat/send', method: 'POST' }
    case 'CREATE_TASK':
      return { url: '/api/v1/tasks', method: 'POST' }
    default:
      return null
  }
}

/**
 * Retorna o delay (ms) antes da próxima tentativa, baseado no número
 * de attempts. Backoff exponencial: 1s, 2s, 4s, 8s, 16s.
 */
function backoffDelayMs(attempts: number): number {
  return Math.min(1000 * 2 ** attempts, 60_000)
}

/**
 * Tenta sincronizar todas as ações elegíveis (cujo nextRetryAt já passou).
 * Ações que falham são re-enfileiradas com backoff incrementado.
 * Ações que excedem MAX_ATTEMPTS são descartadas com warning no console.
 */
export async function syncOfflineQueue(): Promise<{
  synced: number
  failed: number
  pending: number
  dropped: number
}> {
  const queue = await getOfflineQueue()
  if (queue.length === 0) return { synced: 0, failed: 0, pending: 0, dropped: 0 }

  const now = Date.now()
  let synced = 0
  let failed = 0
  let dropped = 0
  const remaining: OfflineAction[] = []

  for (const action of queue) {
    // Ainda em backoff — re-enfileira sem tentar
    if (new Date(action.nextRetryAt).getTime() > now) {
      remaining.push(action)
      continue
    }

    const endpoint = resolveEndpoint(action)
    if (!endpoint) {
      console.warn('[offline] unknown action type, dropping:', action.type)
      dropped++
      continue
    }

    try {
      const res = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: endpoint.method === 'DELETE' ? undefined : JSON.stringify(action.payload),
      })

      if (res.ok) {
        synced++
      } else {
        // 4xx (exceto 429) é erro do cliente — não adianta retry
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          console.warn(
            `[offline] action ${action.type} got ${res.status}, dropping:`,
            await res.text().catch(() => ''),
          )
          dropped++
        } else {
          failed++
          remaining.push(advanceRetry(action))
        }
      }
    } catch {
      failed++
      remaining.push(advanceRetry(action))
    }
  }

  // Drop ações que estouraram MAX_ATTEMPTS
  const finalQueue: OfflineAction[] = []
  for (const action of remaining) {
    if (action.attempts >= MAX_ATTEMPTS) {
      console.warn('[offline] action exceeded max attempts, dropping:', action.type, action.id)
      dropped++
    } else {
      finalQueue.push(action)
    }
  }

  const storage = await getStorage()
  await storage.set(QUEUE_KEY, JSON.stringify(finalQueue))

  return { synced, failed, pending: finalQueue.length, dropped }
}

function advanceRetry(action: OfflineAction): OfflineAction {
  const attempts = action.attempts + 1
  return {
    ...action,
    attempts,
    nextRetryAt: new Date(Date.now() + backoffDelayMs(attempts)).toISOString(),
  }
}
