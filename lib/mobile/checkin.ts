'use client'

/**
 * Geolocation Check-ins
 * - Nativo: usa @capacitor/geolocation (mais preciso)
 * - Web: usa navigator.geolocation do browser
 */

import { isNativePlatform } from './platform'

export interface CheckInResult {
  latitude: number
  longitude: number
  accuracy?: number
}

export async function getCurrentPosition(): Promise<CheckInResult> {
  if (isNativePlatform()) {
    const { Geolocation } = await import('@capacitor/geolocation')
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    })
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    }
  } else {
    // Web fallback
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation não disponível neste dispositivo'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }
}

export async function checkIn(contactId?: string, notes?: string): Promise<void> {
  const position = await getCurrentPosition()

  await fetch('/api/mobile/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contactId,
      notes,
      latitude: position.latitude,
      longitude: position.longitude,
    }),
  })
}
