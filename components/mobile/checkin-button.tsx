'use client'

/**
 * Botão de check-in com geolocalização
 * Aparece em: página de contato/deal
 * Funciona em: iOS, Android (GPS nativo), Web (browser geolocation)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CheckinButtonProps {
  contactId?: string
  contactName?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function CheckinButton({
  contactId,
  contactName,
  variant = 'outline',
  size = 'sm',
}: CheckinButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckin = async () => {
    setIsLoading(true)
    try {
      const { checkIn } = await import('@/lib/mobile/checkin')
      await checkIn(contactId)

      toast.success(
        contactName
          ? `Check-in registrado em visita a ${contactName}!`
          : 'Check-in registrado!'
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível obter localização'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCheckin}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="h-4 w-4" />
      )}
      {isLoading ? 'Registrando...' : 'Check-in'}
    </Button>
  )
}
