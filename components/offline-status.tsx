'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import {
  isOnline,
  getQueueStats,
  setupNetworkListeners,
  processOfflineQueue,
} from '@/lib/offline-queue'

export function OfflineStatus() {
  const [online, setOnline] = useState(true)
  const [queueStats, setQueueStats] = useState({ pending: 0, syncing: 0, failed: 0, total: 0 })
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Check initial online status
    setOnline(isOnline())

    // Load queue stats
    updateQueueStats()

    // Setup network listeners
    const cleanup = setupNetworkListeners(
      () => {
        setOnline(true)
        updateQueueStats()
      },
      () => {
        setOnline(false)
      }
    )

    // Update queue stats every 10 seconds
    const interval = setInterval(updateQueueStats, 10000)

    return () => {
      cleanup()
      clearInterval(interval)
    }
  }, [])

  const updateQueueStats = async () => {
    try {
      const stats = await getQueueStats()
      setQueueStats(stats)
    } catch (error) {
      console.error('Failed to get queue stats:', error)
    }
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      await processOfflineQueue()
      await updateQueueStats()
    } catch (error) {
      console.error('Failed to sync:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Don't show if browser doesn't support service workers
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  // Only show when offline or when there are pending actions
  if (online && queueStats.total === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm space-y-2">
      {!online && (
        <div className="bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-800 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
            <WifiOff className="h-4 w-4" />
            <p className="text-sm">
              Você está offline. Suas ações serão sincronizadas quando voltar online.
            </p>
          </div>
        </div>
      )}

      {queueStats.total > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {online ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-500" />
              )}
              <div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm font-medium">Fila de Sincronização</span>
                  <div className="flex gap-1">
                    {queueStats.pending > 0 && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                        {queueStats.pending} pendentes
                      </span>
                    )}
                    {queueStats.syncing > 0 && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
                        {queueStats.syncing} sincronizando
                      </span>
                    )}
                    {queueStats.failed > 0 && (
                      <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900 px-2 py-0.5 text-xs font-medium text-red-800 dark:text-red-200">
                        {queueStats.failed} falharam
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {online && queueStats.pending > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
