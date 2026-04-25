'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

function isBusinessHours(): boolean {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay()
  return day >= 1 && day <= 5 && hour >= 8 && hour < 19
}

export function NativeInitializer() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const lastBackgroundedAt = useRef<number | null>(null)

  // Sync status bar with theme
  useEffect(() => {
    if (!resolvedTheme) return
    import('@/lib/mobile/status-bar').then(({ configureStatusBar }) => {
      configureStatusBar(resolvedTheme === 'dark' ? 'dark' : 'light')
    })
  }, [resolvedTheme])

  useEffect(() => {
    async function init() {
      // Register push notifications
      try {
        const { registerPushNotifications } = await import('@/lib/mobile/push')
        await registerPushNotifications()
      } catch {}

      // Setup deep links
      try {
        const { setupDeepLinks } = await import('@/lib/mobile/deep-links')
        await setupDeepLinks(router)
      } catch {}

      // Keyboard listeners — adjust scroll when keyboard appears
      try {
        const { setupKeyboardListeners } = await import('@/lib/mobile/keyboard')
        await setupKeyboardListeners(
          ({ keyboardHeight }) => {
            document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`)
          },
          () => {
            document.documentElement.style.setProperty('--keyboard-height', '0px')
          }
        )
      } catch {}

      // App state listener — auto-lock on background
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (Capacitor.isNativePlatform()) {
          const { App } = await import('@capacitor/app')
          App.addListener('appStateChange', ({ isActive }) => {
            if (!isActive) {
              lastBackgroundedAt.current = Date.now()
            } else if (lastBackgroundedAt.current) {
              const elapsed = Date.now() - lastBackgroundedAt.current
              const biometricEnabled = localStorage.getItem('biometricEnabled') === 'true'
              const lockTimeout = Number(localStorage.getItem('lockTimeout') || '300000') // 5 min default
              if (elapsed > lockTimeout && biometricEnabled) {
                router.push('/auth/biometric-unlock')
              }
              lastBackgroundedAt.current = null
            }
          })
        }
      } catch {}

      // Online: sync offline queue
      const handleOnline = async () => {
        try {
          const { syncOfflineQueue } = await import('@/lib/mobile/offline')
          const { synced, failed } = await syncOfflineQueue()
          if (synced > 0) {
            console.log(`[Offline sync] ${synced} synced${failed > 0 ? `, ${failed} failed` : ''}`)
          }
        } catch {}
      }

      window.addEventListener('online', handleOnline)

      // Nearby leads prompt — once per session during business hours
      if (
        isBusinessHours() &&
        !sessionStorage.getItem('nearby_prompted') &&
        'geolocation' in navigator
      ) {
        sessionStorage.setItem('nearby_prompted', '1')
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
          } catch {}
        }, 30_000)
      }

      return () => window.removeEventListener('online', handleOnline)
    }

    init()
  }, [router])

  return null
}
