'use client'

import { Capacitor } from '@capacitor/core'

export async function configureStatusBar(theme: 'light' | 'dark') {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light })
    await StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#0F172A' : '#FFFFFF' })
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.show()
  } catch {
    // silently fail on platforms where StatusBar is not available
  }
}

export async function hideStatusBar() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { StatusBar } = await import('@capacitor/status-bar')
    await StatusBar.hide()
  } catch {}
}
