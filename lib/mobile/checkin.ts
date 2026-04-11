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

// ─────────────────────────────────────────────────────────────────────────────
// Leads próximos — Sprint 4.3
// ─────────────────────────────────────────────────────────────────────────────

export interface NearbyLead {
  id: string
  name: string
  company?: string | null
  phone?: string | null
  latitude: number
  longitude: number
  /** Distância em metros. */
  distanceMeters: number
  /** Último deal ativo associado. */
  lastDealTitle?: string | null
}

/**
 * Busca contatos da organização que têm coordenadas cadastradas e estão
 * dentro do raio especificado (em metros). Usa a fórmula de Haversine no
 * servidor via `/api/mobile/nearby-leads`.
 */
export async function getNearbyLeads(
  radiusMeters = 5000,
): Promise<NearbyLead[]> {
  const position = await getCurrentPosition()

  const res = await fetch(
    `/api/mobile/nearby-leads?lat=${position.latitude}&lng=${position.longitude}&radius=${radiusMeters}`,
  )
  if (!res.ok) return []
  const data = (await res.json()) as { leads: NearbyLead[] }
  return data.leads ?? []
}

/**
 * Calcula a distância em metros entre dois pontos GPS usando Haversine.
 * Útil para ordenar/filtrar no client sem round-trip.
 */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000 // Raio da Terra em metros
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
