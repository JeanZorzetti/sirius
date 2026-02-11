'use client'

/**
 * Push Notifications via Capacitor
 * - Nativo: usa @capacitor/push-notifications (FCM/APNs)
 * - Web: usa Notifications API do browser
 * Graceful degradation: sem erros se plugin não disponível
 */

import { isNativePlatform } from './platform'

async function saveTokenToServer(token: string, platform: 'IOS' | 'ANDROID' | 'WEB') {
  try {
    await fetch('/api/mobile/push-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform }),
    })
  } catch {
    // Silently fail - non-critical
  }
}

export async function registerPushNotifications(): Promise<void> {
  try {
    if (isNativePlatform()) {
      // Native: use Capacitor plugin (lazy import to avoid SSR issues)
      const { PushNotifications } = await import('@capacitor/push-notifications')

      const permStatus = await PushNotifications.requestPermissions()
      if (permStatus.receive !== 'granted') return

      await PushNotifications.register()

      PushNotifications.addListener('registration', async ({ value: token }) => {
        const platform = (window as any).Capacitor?.getPlatform?.() === 'ios' ? 'IOS' : 'ANDROID'
        await saveTokenToServer(token, platform)
      })

      PushNotifications.addListener('registrationError', (err) => {
        console.error('Push registration error:', err)
      })

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification)
      })

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        // Navigate to relevant screen based on notification data
        const data = action.notification.data
        if (data?.dealId) {
          window.location.href = `/dashboard?dealId=${data.dealId}`
        }
      })
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      // Web: use browser Notifications API
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      // For web push, we'd need a service worker + VAPID keys
      // Save a placeholder token indicating web push capability
      await saveTokenToServer('web-push-' + Date.now(), 'WEB')
    }
  } catch (err) {
    console.error('Push notification setup failed:', err)
  }
}
