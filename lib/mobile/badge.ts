'use client'

import { Capacitor } from '@capacitor/core'

export async function setAppBadge(count: number) {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { Badge } = await import('@capawesome/capacitor-badge')
    if (count > 0) {
      await Badge.set({ count })
    } else {
      await Badge.clear()
    }
  } catch {}
}

export async function clearAppBadge() {
  await setAppBadge(0)
}
