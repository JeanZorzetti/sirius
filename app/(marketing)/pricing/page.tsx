import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

const tiers = [
    {
        name: 'Solopreneur',
        id: 'tier-solo',
        href: '/login', // Goes to login/register flow
        priceMonthly: 'Grátis',
        description: 'Para quem está começando e precisa organizar a casa.',
        features: [
            '1 Usuário',
            'Até 50 Negócios ativos',
            'Gestão de Contatos Ilimitada',
            'Pipeline Kanban Básico',
            'Suporte via Comunidade',
        ],
        featured: false,
    },
    {
        name: 'Growth',
        id: 'tier-growth',
        href: '/login',
        priceMonthly: 'R$ 49',
        description: 'Para times em crescimento que precisam de automação.',
        features: [
            'Até 5 Usuários',
            'Negócios Ilimitados',
            'Analytics Avançado',
            'Múltiplos Pipelines (Em breve)',
            'Automação de E-mails (Em breve)',
            'Suporte Prioritário',
        ],
        featured: true,
    },
    {
        name: 'Enterprise',
        id: 'tier-enterprise',
        href: 'https://wa.me/5511999999999', // Link to WhatsApp for sales
        priceMonthly: 'Sob Consulta',
        description: 'Solução personalizada para grandes operações.',
        features: [
            'Usuários Ilimitados',
            'API Dedicada',
            'Onboarding Personalizado',
            'Gerente de Conta Dedicado',
            'SLA de 99.9%',
            'SSO & Segurança Avançada',
        ],
        featured: false,
    },
]

export default function PricingPage() {
    return (
        <div className="relative isolate bg-background px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
                <h2 className="text-base font-semibold leading-7 text-primary">Preços Simples</h2>
                <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                    Escolha o plano ideal para sua escala
                </p>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground">
                Comece grátis e faça upgrade conforme seu time vende mais. Sem cartão de crédito necessário para começar.
            </p>

            <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-3 lg:gap-x-8">
                {tiers.map((tier) => (
                    <Card
                        key={tier.id}
                        className={`flex flex-col justify-between ${tier.featured ? 'border-primary shadow-lg scale-105 z-10' : ''}`}
                    >
                        <CardHeader>
                            <CardTitle id={tier.id} className="text-2xl font-bold">{tier.name}</CardTitle>
                            <CardDescription>{tier.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mt-4 flex items-baseline gap-x-2">
                                <span className="text-4xl font-bold tracking-tight">{tier.priceMonthly}</span>
                                {tier.priceMonthly !== 'Sob Consulta' && tier.priceMonthly !== 'Grátis' && <span className="text-sm font-semibold leading-6 text-muted-foreground">/mês</span>}
                            </div>
                            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex gap-x-3">
                                        <Check className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full" variant={tier.featured ? 'default' : 'outline'}>
                                <Link href={tier.href} aria-describedby={tier.id}>
                                    {tier.name === 'Enterprise' ? 'Falar com Vendas' : 'Começar Agora'}
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
