import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, CreditCard } from "lucide-react"
import { EmbeddedCheckoutModal } from "@/components/dashboard/billing/embedded-checkout-modal"

export default function BillingPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Assinatura & Faturamento</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:gap-12 max-w-4xl mx-auto mt-8">
                {/* Free Plan */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Plano Free</CardTitle>
                        <CardDescription>Para começar a organizar suas vendas.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="text-3xl font-bold">R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Até 10 Negócios (Deals)</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Até 50 Contatos</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Kanban Básico</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline" disabled>Seu Plano Atual</Button>
                    </CardFooter>
                </Card>

                {/* Pro Plan */}
                <Card className="flex flex-col border-primary shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                        RECOMENDADO
                    </div>
                    <CardHeader>
                        <CardTitle>Sirius Pro</CardTitle>
                        <CardDescription>Para empresas que querem escalar.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="text-3xl font-bold">R$ 97<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Negócios Ilimitados</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Contatos Ilimitados</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Analytics Avançado</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Suporte Prioritário</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <EmbeddedCheckoutModal />
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
