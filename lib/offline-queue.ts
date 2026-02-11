/**
 * Offline Queue Manager using IndexedDB
 * Stores actions that couldn't be completed while offline
 * and syncs them when connection is restored
 */

import { trackOfflineSync } from './pwa-analytics'

interface QueuedAction {
  id: string
  type: 'CREATE_DEAL' | 'CREATE_CONTACT' | 'UPDATE_DEAL' | 'SEND_MESSAGE'
  data: any
  timestamp: number
  retryCount: number
  status: 'pending' | 'syncing' | 'failed'
  error?: string
}

const DB_NAME = 'sirius-offline-queue'
const DB_VERSION = 1
const STORE_NAME = 'actions'

/**
 * Open IndexedDB database
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        objectStore.createIndex('status', 'status', { unique: false })
        objectStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * Add action to offline queue
 */
export async function queueAction(
  type: QueuedAction['type'],
  data: any
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('queueAction can only be called in the browser')
  }

  const db = await openDB()
  const action: QueuedAction = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(action)

    request.onsuccess = () => {
      // Register background sync if available
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration: any) => {
          registration.sync.register('sync-offline-actions').catch(console.error)
        })
      }

      resolve(action.id)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all pending actions from queue
 */
export async function getPendingActions(): Promise<QueuedAction[]> {
  if (typeof window === 'undefined') {
    return []
  }

  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('status')
    const request = index.getAll('pending')

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

/**
 * Update action status
 */
export async function updateActionStatus(
  id: string,
  status: QueuedAction['status'],
  error?: string
): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const action = getRequest.result
      if (action) {
        action.status = status
        action.retryCount = action.retryCount + 1
        if (error) {
          action.error = error
        }

        const updateRequest = store.put(action)
        updateRequest.onsuccess = () => resolve()
        updateRequest.onerror = () => reject(updateRequest.error)
      } else {
        resolve()
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

/**
 * Remove action from queue
 */
export async function removeAction(id: string): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number
  syncing: number
  failed: number
  total: number
}> {
  if (typeof window === 'undefined') {
    return { pending: 0, syncing: 0, failed: 0, total: 0 }
  }

  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const actions = request.result || []
      resolve({
        pending: actions.filter((a) => a.status === 'pending').length,
        syncing: actions.filter((a) => a.status === 'syncing').length,
        failed: actions.filter((a) => a.status === 'failed').length,
        total: actions.length,
      })
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear all actions from queue
 */
export async function clearQueue(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Process offline queue
 * This is called when the device comes back online
 */
export async function processOfflineQueue(): Promise<{
  success: number
  failed: number
}> {
  const actions = await getPendingActions()
  let success = 0
  let failed = 0

  for (const action of actions) {
    try {
      await updateActionStatus(action.id, 'syncing')

      const result = await syncAction(action)

      if (result.success) {
        await removeAction(action.id)
        success++
      } else {
        await updateActionStatus(action.id, 'failed', result.error)
        failed++
      }
    } catch (error: any) {
      await updateActionStatus(action.id, 'failed', error.message)
      failed++
    }
  }

  // Track sync results
  if (success > 0) {
    trackOfflineSync(true, { actionssynced: success })
  }
  if (failed > 0) {
    trackOfflineSync(false, { actionsFailed: failed })
  }

  return { success, failed }
}

/**
 * Sync a single action with the server
 */
async function syncAction(action: QueuedAction): Promise<{ success: boolean; error?: string }> {
  try {
    let endpoint: string
    let method = 'POST'
    let body = action.data

    switch (action.type) {
      case 'CREATE_DEAL':
        endpoint = '/api/v1/deals'
        break

      case 'CREATE_CONTACT':
        endpoint = '/api/v1/contacts'
        break

      case 'UPDATE_DEAL':
        endpoint = `/api/v1/deals/${action.data.id}`
        method = 'PATCH'
        break

      case 'SEND_MESSAGE':
        endpoint = '/api/integrations/whatsapp/send'
        break

      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') {
    return true
  }
  return navigator.onLine
}

/**
 * Setup online/offline event listeners
 */
export function setupNetworkListeners(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleOnline = () => {
    processOfflineQueue().then((result) => {
      void result
    })
    onOnline?.()
  }

  const handleOffline = () => {
    onOffline?.()
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
