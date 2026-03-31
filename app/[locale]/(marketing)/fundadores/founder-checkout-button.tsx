'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'

type FounderPlan = 'FOUNDER_STARTER' | 'FOUNDER_PRO' | 'FOUNDER_BUSINESS'

interface Props {
  plan: FounderPlan
  price: number
  spotsLeft: number
  founderNumber: number
}

const PLAN_LABEL: Record<FounderPlan, string> = {
  FOUNDER_STARTER: 'Starter',
  FOUNDER_PRO: 'Pro',
  FOUNDER_BUSINESS: 'Business',
}

export function FounderCheckoutButton({ plan, price, spotsLeft, founderNumber }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleCheckout() {
    setIsLoading(true)

    try {
      const response = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })

      if (response.status === 401) {
        router.push(`/register?redirect=/fundadores&plan=${plan.toLowerCase()}`)
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
    <div className="flex flex-col items-center gap-2 w-full">
      <Button
        className="w-full font-bold"
        onClick={handleCheckout}
        disabled={isLoading}
      >
        <Star className="w-4 h-4 mr-2 fill-current" />
        {isLoading
          ? 'Aguarde...'
          : `Fundador ${PLAN_LABEL[plan]} #${founderNumber} — R$${price}/mês`
        }
      </Button>
      <p className="text-xs text-muted-foreground">
        Apenas <strong>{spotsLeft} vagas</strong> restantes
      </p>
    </div>
  )
}
