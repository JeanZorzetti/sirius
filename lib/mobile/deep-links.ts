'use client'

import { Capacitor } from '@capacitor/core'

type Router = { push: (path: string) => void }

export async function setupDeepLinks(router: Router) {
  if (!Capacitor.isNativePlatform()) return

  try {
    const { App } = await import('@capacitor/app')

    App.addListener('appUrlOpen', (event) => {
      try {
        const url = new URL(event.url)
        // Handle both custom scheme (sirius://) and universal links (siriuscrm.com.br)
        router.push(url.pathname + url.search)
      } catch {}
    })

    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp()
      } else {
        window.history.back()
      }
    })
  } catch {}
}

export async function getAppState() {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const { App } = await import('@capacitor/app')
    return App.getState()
  } catch {
    return null
  }
}
