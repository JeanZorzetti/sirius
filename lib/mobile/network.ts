'use client'

import { Capacitor } from '@capacitor/core'

export type NetworkStatus = {
  connected: boolean
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown'
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (!Capacitor.isNativePlatform()) {
    return {
      connected: navigator.onLine,
      connectionType: navigator.onLine ? 'unknown' : 'none',
    }
  }

  try {
    const { Network } = await import('@capacitor/network')
    const status = await Network.getStatus()
    return {
      connected: status.connected,
      connectionType: status.connectionType as NetworkStatus['connectionType'],
    }
  } catch {
    return { connected: navigator.onLine, connectionType: 'unknown' }
  }
}

export async function setupNetworkStatusListener(
  onChange: (status: NetworkStatus) => void
): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) {
    const handleOnline = () => onChange({ connected: true, connectionType: 'unknown' })
    const handleOffline = () => onChange({ connected: false, connectionType: 'none' })
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  try {
    const { Network } = await import('@capacitor/network')
    const handle = await Network.addListener('networkStatusChange', (status) => {
      onChange({
        connected: status.connected,
        connectionType: status.connectionType as NetworkStatus['connectionType'],
      })
    })
    return () => handle.remove()
  } catch {
    return () => {}
  }
}
