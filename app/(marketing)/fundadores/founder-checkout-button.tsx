'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'

interface Props {
  spotsLeft: number
}

export function FounderCheckoutButton({ spotsLeft }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleCheckout() {
    setIsLoading(true)

    try {
      const response = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'FOUNDER' })
      })

      if (response.status === 401) {
        // Not logged in — redirect to register with return URL
        router.push('/register?redirect=/fundadores&plan=founder')
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao processar pagamento')
      }

      const data = await response.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Erro ao iniciar pagamento. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        size="lg"
        className="text-base px-8 py-6 font-bold shadow-lg hover:shadow-xl transition-all"
        onClick={handleCheckout}
        disabled={isLoading}
      >
        <Star className="w-5 h-5 mr-2 fill-current" />
        {isLoading ? 'Aguarde...' : `Quero ser Fundador #${100 - spotsLeft + 1} por R$29/mês`}
      </Button>
      <p className="text-xs text-muted-foreground">
        Restam apenas <strong>{spotsLeft} vagas</strong>
      </p>
    </div>
  )
}
