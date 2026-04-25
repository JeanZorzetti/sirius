'use client'

import { Capacitor } from '@capacitor/core'

export type BiometricType = 'faceId' | 'touchId' | 'fingerprint' | 'none'

export async function isBiometricAvailable(): Promise<{ available: boolean; type: BiometricType }> {
  if (!Capacitor.isNativePlatform()) {
    return { available: false, type: 'none' }
  }

  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth')
    const { isAvailable, strongBiometricAvailable } = await BiometricAuth.checkBiometry()
    if (!isAvailable) return { available: false, type: 'none' }

    // Detect type from platform
    const platform = Capacitor.getPlatform()
    const type: BiometricType = platform === 'ios'
      ? strongBiometricAvailable ? 'faceId' : 'touchId'
      : 'fingerprint'

    return { available: true, type }
  } catch {
    return { available: false, type: 'none' }
  }
}

export async function authenticateWithBiometric(reason: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false

  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth')
    await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Cancelar',
      allowDeviceCredential: true,
      iosFallbackTitle: 'Usar senha',
      androidTitle: 'Sirius CRM',
      androidSubtitle: reason,
      androidConfirmationRequired: false,
    })
    return true
  } catch {
    return false
  }
}

export async function saveBiometricToken(token: string): Promise<void> {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    // On native platforms, Preferences uses Keychain (iOS) or EncryptedSharedPreferences (Android)
    await Preferences.set({ key: 'biometric_token', value: token })
    await Preferences.set({ key: 'biometricEnabled', value: 'true' })
  } catch {
    localStorage.setItem('biometricEnabled', 'true')
  }
}

export async function getBiometricToken(): Promise<string | null> {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    const { value } = await Preferences.get({ key: 'biometric_token' })
    return value
  } catch {
    return null
  }
}

export async function clearBiometricToken(): Promise<void> {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.remove({ key: 'biometric_token' })
    await Preferences.set({ key: 'biometricEnabled', value: 'false' })
  } catch {
    localStorage.removeItem('biometricEnabled')
  }
}

export function isBiometricEnabled(): boolean {
  try {
    const { Preferences } = require('@capacitor/preferences')
    // sync check from localStorage as fallback
    return localStorage.getItem('biometricEnabled') === 'true'
  } catch {
    return false
  }
}
