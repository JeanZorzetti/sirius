'use client'

/**
 * Inicializa recursos nativos quando o app carrega
 * Deve ser incluído no layout principal do dashboard
 * - Registra push notifications
 * - Configura listener de online/offline para sync
 */

import { useEffect } from 'react'

export function NativeInitializer() {
  useEffect(() => {
    async function init() {
      try {
        // Registrar push notifications
        const { registerPushNotifications } = await import('@/lib/mobile/push')
        await registerPushNotifications()
      } catch {
        // Silently ignore - non-critical
      }

      // Listener de online: sincroniza fila offline
      const handleOnline = async () => {
        try {
          const { syncOfflineQueue } = await import('@/lib/mobile/offline')
          const { synced, failed } = await syncOfflineQueue()
          if (synced > 0) {
            console.log(`[Offline sync] ${synced} ações sincronizadas${failed > 0 ? `, ${failed} falharam` : ''}`)
          }
        } catch {
          // Silently ignore
        }
      }

      window.addEventListener('online', handleOnline)
      return () => window.removeEventListener('online', handleOnline)
    }

    init()
  }, [])

  return null
}
