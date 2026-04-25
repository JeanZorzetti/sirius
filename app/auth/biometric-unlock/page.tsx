'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Fingerprint, Lock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBiometricLock } from '@/hooks/use-biometric-lock'

export default function BiometricUnlockPage() {
  const router = useRouter()
  const { isLoading, error, authenticateBiometric } = useBiometricLock()
  const [unlocked, setUnlocked] = useState(false)

  const handleUnlock = async () => {
    const ok = await authenticateBiometric()
    if (ok) {
      setUnlocked(true)
      setTimeout(() => router.push('/dashboard'), 300)
    }
  }

  // Auto-trigger on mount
  useEffect(() => {
    handleUnlock()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react')
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
          {unlocked ? (
            <ShieldCheck className="h-10 w-10 text-primary" />
          ) : (
            <Lock className="h-10 w-10 text-primary" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-foreground">Sirius CRM</h1>
        <p className="text-center text-sm text-muted-foreground">
          {unlocked
            ? 'Acesso liberado!'
            : 'Use sua biometria para continuar'}
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleUnlock}
          disabled={isLoading || unlocked}
        >
          <Fingerprint className="h-5 w-5" />
          {isLoading ? 'Verificando...' : 'Usar biometria'}
        </Button>

        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={handleSignOut}
        >
          Sair da conta
        </Button>
      </div>
    </div>
  )
}
