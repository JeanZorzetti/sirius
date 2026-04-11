'use client'

/**
 * Inicializa recursos nativos quando o app carrega
 * Deve ser incluído no layout principal do dashboard
 * - Registra push notifications
 * - Configura listener de online/offline para sync
 * - Verifica leads próximos em horário comercial (Sprint 4.3)
 */

import { useEffect } from 'react'

/** Horário comercial: 8h–19h de segunda a sexta. */
function isBusinessHours(): boolean {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay() // 0=Dom, 6=Sab
  return day >= 1 && day <= 5 && hour >= 8 && hour < 19
}

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

      // Sugestão proativa de leads próximos — apenas em horário comercial,
      // uma vez por sessão, quando GPS está disponível.
      if (
        isBusinessHours() &&
        !sessionStorage.getItem('nearby_prompted') &&
        'geolocation' in navigator
      ) {
        sessionStorage.setItem('nearby_prompted', '1')
        // Aguarda 30s para não competir com o carregamento inicial
        setTimeout(async () => {
          try {
            const { getNearbyLeads } = await import('@/lib/mobile/checkin')
            const leads = await getNearbyLeads(5000)
            if (leads.length >= 1 && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Sirius CRM', {
                body: `Há ${leads.length} lead${leads.length !== 1 ? 's' : ''} na sua região agora. Toque para ver.`,
                icon: '/icon.png',
                tag: 'nearby-leads',
                data: { url: '/dashboard/nearby' },
              })
            }
          } catch {
            // Silently ignore - non-critical
          }
        }, 30_000)
      }

      return () => window.removeEventListener('online', handleOnline)
    }

    init()
  }, [])

  return null
}
