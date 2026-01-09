/**
 * PWA Analytics Tracking
 * Client-side library for tracking PWA events
 */

export type PWAMetricType =
  | 'INSTALL_PROMPT_SHOWN'
  | 'INSTALL_PROMPT_ACCEPTED'
  | 'INSTALL_PROMPT_DISMISSED'
  | 'APP_INSTALLED'
  | 'PUSH_PERMISSION_GRANTED'
  | 'PUSH_PERMISSION_DENIED'
  | 'OFFLINE_SYNC_SUCCESS'
  | 'OFFLINE_SYNC_FAILURE'
  | 'SERVICE_WORKER_UPDATED'

/**
 * Track a PWA metric event
 */
export async function trackPWAEvent(
  type: PWAMetricType,
  data?: Record<string, any>
): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  try {
    await fetch('/api/pwa/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        data: data || {},
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    // Silently fail - don't break the user experience
    console.error('Failed to track PWA event:', error)
  }
}

/**
 * Setup PWA analytics listeners
 * Call this once when the app initializes
 */
export function setupPWAAnalytics(): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  // Track install prompt
  const handleBeforeInstallPrompt = (e: Event) => {
    trackPWAEvent('INSTALL_PROMPT_SHOWN')
  }

  // Track app installed
  const handleAppInstalled = () => {
    trackPWAEvent('APP_INSTALLED')
  }

  // Track service worker updates
  const handleServiceWorkerUpdate = () => {
    trackPWAEvent('SERVICE_WORKER_UPDATED')
  }

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)

  // Check for service worker updates
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', handleServiceWorkerUpdate)
    })
  }

  // Cleanup function
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', handleAppInstalled)
  }
}

/**
 * Track install prompt user action
 */
export function trackInstallPromptAction(accepted: boolean): void {
  const type = accepted ? 'INSTALL_PROMPT_ACCEPTED' : 'INSTALL_PROMPT_DISMISSED'
  trackPWAEvent(type)
}

/**
 * Track push permission action
 */
export function trackPushPermission(granted: boolean): void {
  const type = granted ? 'PUSH_PERMISSION_GRANTED' : 'PUSH_PERMISSION_DENIED'
  trackPWAEvent(type)
}

/**
 * Track offline sync result
 */
export function trackOfflineSync(success: boolean, details?: Record<string, any>): void {
  const type = success ? 'OFFLINE_SYNC_SUCCESS' : 'OFFLINE_SYNC_FAILURE'
  trackPWAEvent(type, details)
}

/**
 * Get PWA installation status
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  // Check iOS
  if ((navigator as any).standalone === true) {
    return true
  }

  return false
}

/**
 * Check if PWA is installable
 */
export function canInstallPWA(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // If already installed, can't install again
  if (isPWAInstalled()) {
    return false
  }

  // Check if beforeinstallprompt event is supported
  return 'onbeforeinstallprompt' in window
}
