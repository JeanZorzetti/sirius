"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"

export function EmbeddedCheckoutModal() {
    const [isLoading, setIsLoading] = useState(false)

    const handleCheckout = async () => {
        try {
            setIsLoading(true)

            // Criar preferência de checkout no Mercado Pago
            const response = await fetch("/api/mercadopago/checkout", {
                method: "POST",
            })

            if (!response.ok) {
                throw new Error('Erro ao criar checkout')
            }

            const data = await response.json()

            // Redirecionar para o checkout do Mercado Pago
            window.location.href = data.checkoutUrl

        } catch (error) {
            console.error('Erro ao criar checkout:', error)
            alert('Não foi possível criar o checkout. Tente novamente.')
            setIsLoading(false)
        }
    }

    return (
        <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleCheckout}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                </>
            ) : (
                <>
                    <CreditCard className="h-4 w-4" />
                    Fazer Upgrade Agora
                </>
            )}
        </Button>
    )
}
