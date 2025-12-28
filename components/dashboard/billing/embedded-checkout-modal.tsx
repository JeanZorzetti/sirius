"use client"

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout,
} from "@stripe/react-stripe-js"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"

// Make sure to add your public key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""); // Should be env var

export function EmbeddedCheckoutModal() {
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (isOpen && !clientSecret) {
            fetch("/api/stripe/checkout", {
                method: "POST",
            })
                .then((res) => res.json())
                .then((data) => setClientSecret(data.clientSecret))
        }
    }, [isOpen, clientSecret])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full gap-2" size="lg">
                    <CreditCard className="h-4 w-4" />
                    Fazer Upgrade Agora
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-[600px] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Assinatura Sirius Pro</DialogTitle>
                </DialogHeader>
                {clientSecret ? (
                    <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={{ clientSecret }}
                    >
                        <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
