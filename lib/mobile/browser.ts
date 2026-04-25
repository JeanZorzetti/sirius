'use client'

import { Capacitor } from '@capacitor/core'

export async function openExternalUrl(url: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  try {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({
      url,
      presentationStyle: 'popover',
      toolbarColor: '#4F46E5',
    })
  } catch {
    // Fallback to system browser
    window.open(url, '_blank')
  }
}

export async function closeBrowser(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { Browser } = await import('@capacitor/browser')
    await Browser.close()
  } catch {}
}
