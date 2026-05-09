'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, BellOff, X } from 'lucide-react'
import { trackPushPermission } from '@/lib/pwa-analytics'

export function PushNotificationManager() {
  const tCommon = useTranslations('common')
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    setPermission(Notification.permission)

    // Check if already subscribed
    checkSubscription()

    // Show prompt after 60 seconds if permission is default and not subscribed
    const timer = setTimeout(() => {
      if (
        Notification.permission === 'default' &&
        !isSubscribed &&
        typeof window !== 'undefined' &&
        !sessionStorage.getItem('push-notification-prompt-dismissed')
      ) {
        setShowPrompt(true)
      }
    }, 60000) // 60 seconds

    return () => clearTimeout(timer)
  }, [isSubscribed])

  const checkSubscription = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking push subscription:', error)
    }
  }

  const subscribeToPushNotifications = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      alert('Push notifications não são suportadas neste navegador')
      return
    }

    setIsLoading(true)

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      // Track permission result
      trackPushPermission(permissionResult === 'granted')

      if (permissionResult !== 'granted') {
        alert('Você precisa permitir notificações para continuar')
        setIsLoading(false)
        return
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()

      // If not subscribed, create subscription
      if (!subscription) {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!publicKey) {
          throw new Error('VAPID public key not configured')
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        })
      }

      // Send subscription to backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to subscribe')
      }

      setIsSubscribed(true)
      setShowPrompt(false)

      // Send test notification
      await fetch('/api/push/test', { method: 'POST' })
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      alert('Erro ao ativar notificações. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromPushNotifications = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from backend
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        })

        // Unsubscribe from browser
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      alert('Erro ao desativar notificações. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('push-notification-prompt-dismissed', 'true')
    }
  }

  // Don't show if not in browser
  if (typeof window === 'undefined') {
    return null
  }

  // Don't show if notifications not supported
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null
  }

  // Don't show if dismissed
  if (
    typeof window !== 'undefined' &&
    sessionStorage.getItem('push-notification-prompt-dismissed') &&
    !showPrompt
  ) {
    return null
  }

  // Show prompt banner if appropriate
  if (showPrompt && permission === 'default' && !isSubscribed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Ativar Notificações</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1 -mr-2"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-sm">
              Receba atualizações importantes sobre seus deals, contatos e mensagens
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              onClick={subscribeToPushNotifications}
              disabled={isLoading}
              className="flex-1"
              size="sm"
            >
              <Bell className="mr-2 h-4 w-4" />
              Ativar
            </Button>
            <Button variant="outline" onClick={handleDismiss} size="sm">
              {tCommon('pwa.dismiss')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

/**
 * Settings component for managing push notifications
 */
export function PushNotificationSettings() {
  const tCommon = useTranslations('common')
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    setPermission(Notification.permission)
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking push subscription:', error)
    }
  }

  const toggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribeFromPushNotifications()
    } else {
      await subscribeToPushNotifications()
    }
  }

  const subscribeToPushNotifications = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      alert('Push notifications não são suportadas neste navegador')
      return
    }

    setIsLoading(true)

    try {
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      // Track permission result
      trackPushPermission(permissionResult === 'granted')

      if (permissionResult !== 'granted') {
        alert('Você precisa permitir notificações para continuar')
        setIsLoading(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!publicKey) {
          throw new Error('VAPID public key not configured')
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        })
      }

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to subscribe')
      }

      setIsSubscribed(true)

      // Send test notification
      await fetch('/api/push/test', { method: 'POST' })
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      alert('Erro ao ativar notificações. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromPushNotifications = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        })

        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      alert('Erro ao desativar notificações. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return (
      <div className="text-sm text-muted-foreground">
        Push notifications não são suportadas neste navegador
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {isSubscribed ? (
            <Bell className="h-4 w-4 text-green-500" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {isSubscribed ? 'Notificações Ativas' : 'Notificações Inativas'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {isSubscribed
            ? 'Você receberá atualizações importantes'
            : 'Ative para receber atualizações importantes'}
        </p>
      </div>
      <Button
        onClick={toggleNotifications}
        disabled={isLoading || permission === 'denied'}
        variant={isSubscribed ? 'outline' : 'default'}
        size="sm"
      >
        {isLoading ? tCommon('buttons.loading') : isSubscribed ? tCommon('buttons.deactivate') : tCommon('buttons.activate')}
      </Button>
    </div>
  )
}

/**
 * Convert base64 string to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
