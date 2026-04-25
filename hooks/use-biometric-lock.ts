'use client'

import { useState, useCallback } from 'react'

export function useBiometricLock() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enableBiometric = useCallback(async (token: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const { isBiometricAvailable, authenticateWithBiometric, saveBiometricToken } = await import('@/lib/mobile/biometric')
      const { available } = await isBiometricAvailable()
      if (!available) {
        setError('Biometria não disponível neste dispositivo')
        return false
      }
      const ok = await authenticateWithBiometric('Confirme sua identidade para ativar o acesso biométrico')
      if (!ok) {
        setError('Autenticação cancelada')
        return false
      }
      await saveBiometricToken(token)
      localStorage.setItem('biometricEnabled', 'true')
      return true
    } catch {
      setError('Erro ao ativar biometria')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const authenticateBiometric = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const { authenticateWithBiometric } = await import('@/lib/mobile/biometric')
      const ok = await authenticateWithBiometric('Identifique-se para acessar o Sirius CRM')
      if (!ok) setError('Autenticação falhou')
      return ok
    } catch {
      setError('Erro na autenticação biométrica')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disableBiometric = useCallback(async (): Promise<void> => {
    const { clearBiometricToken } = await import('@/lib/mobile/biometric')
    await clearBiometricToken()
    localStorage.removeItem('biometricEnabled')
  }, [])

  return { isLoading, error, enableBiometric, authenticateBiometric, disableBiometric }
}
