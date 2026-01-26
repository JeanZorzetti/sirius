import Link from 'next/link'
import Script from 'next/script'
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
import { PricingPageTracker } from '@/components/analytics/pricing-page-tracker'

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
            '1 Pipeline Kanban',
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
            '✨ Múltiplos Pipelines',
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
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://sirius.roilabs.com.br"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Preços",
                "item": "https://sirius.roilabs.com.br/pricing"
            }
        ]
    };

    const offersSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Planos Sirius CRM",
        "itemListElement": [
            {
                "@type": "Offer",
                "name": "Plano Solopreneur",
                "price": "0",
                "priceCurrency": "BRL",
                "availability": "https://schema.org/InStock",
                "description": "Para quem está começando e precisa organizar a casa. 1 usuário, até 50 negócios ativos."
            },
            {
                "@type": "Offer",
                "name": "Plano Growth",
                "price": "49",
                "priceCurrency": "BRL",
                "availability": "https://schema.org/InStock",
                "description": "Para times em crescimento. Até 5 usuários, negócios ilimitados, analytics avançado."
            },
            {
                "@type": "Offer",
                "name": "Plano Enterprise",
                "price": "0",
                "priceCurrency": "BRL",
                "availability": "https://schema.org/InStock",
                "description": "Solução personalizada para grandes operações. Usuários ilimitados, SLA garantido, onboarding dedicado."
            }
        ]
    };

    return (
        <>
            <PricingPageTracker />
            <Script
                id="breadcrumb-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <Script
                id="offers-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(offersSchema) }}
            />
            <div className="relative isolate bg-background px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm text-green-600 dark:text-green-400 mb-6">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Teste grátis por tempo ilimitado</span>
                </div>
                <h2 className="text-base font-semibold leading-7 text-primary">Preços Transparentes</h2>
                <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                    Pague apenas quando escalar
                </p>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground">
                Comece grátis hoje e faça upgrade quando seu time crescer. Sem surpresas, sem taxas escondidas.
            </p>

            <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-3 lg:gap-x-8">
                {tiers.map((tier) => (
                    <Card
                        key={tier.id}
                        className={`flex flex-col justify-between relative ${tier.featured ? 'border-primary shadow-lg scale-105 z-10 ring-2 ring-primary/20' : ''}`}
                    >
                        {tier.featured && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                <div className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                                    ⚡ Mais Popular
                                </div>
                            </div>
                        )}
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
                        <CardFooter className="flex flex-col gap-3">
                            <Button asChild className="w-full" variant={tier.featured ? 'default' : 'outline'}>
                                <Link href={tier.href} aria-describedby={tier.id}>
                                    {tier.name === 'Enterprise' ? 'Falar com Vendas' : 'Começar Agora'}
                                </Link>
                            </Button>
                            {tier.featured && (
                                <div className="flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">Garantia de 7 dias - 100% do seu dinheiro de volta</span>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* ROI Calculator Section */}
            <div className="mx-auto mt-24 max-w-3xl">
                <div className="rounded-2xl border bg-card p-8 shadow-sm">
                    <h3 className="text-2xl font-bold text-center mb-2">Calcule seu ROI</h3>
                    <p className="text-center text-muted-foreground mb-8">
                        Veja quanto você economiza em tempo e aumenta em receita
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="text-center p-6 rounded-xl bg-primary/5">
                            <div className="text-3xl font-bold text-primary mb-2">3h</div>
                            <div className="text-sm text-muted-foreground">Economizadas por vendedor/semana</div>
                        </div>
                        <div className="text-center p-6 rounded-xl bg-green-500/5">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">+25%</div>
                            <div className="text-sm text-muted-foreground">Aumento em taxa de conversão</div>
                        </div>
                        <div className="text-center p-6 rounded-xl bg-purple-500/5">
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">R$ 49</div>
                            <div className="text-sm text-muted-foreground">Investimento mensal (Growth)</div>
                        </div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                        💡 Com 5 vendedores: <strong className="text-foreground">15h economizadas/semana</strong> =
                        <strong className="text-green-600 dark:text-green-400"> ~R$ 3.000/mês</strong> em produtividade
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="mx-auto mt-24 max-w-4xl">
                <h3 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold mb-2 text-primary">Posso trocar de plano depois?</h4>
                        <p className="text-sm text-muted-foreground">
                            Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Ajustamos o valor proporcionalmente.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-primary">Como funciona o plano gratuito?</h4>
                        <p className="text-sm text-muted-foreground">
                            100% funcional, sem prazo de expiração. Perfeito para validar o CRM antes de escalar seu time.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-primary">Preciso de cartão para começar?</h4>
                        <p className="text-sm text-muted-foreground">
                            Não! O plano Solopreneur é gratuito para sempre. Só pedimos cartão quando você quiser fazer upgrade.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-primary">Posso cancelar quando quiser?</h4>
                        <p className="text-sm text-muted-foreground">
                            Sim, sem multas ou taxas. Cancele a qualquer momento e mantenha acesso até o fim do período pago.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-primary">Como funciona a garantia de 7 dias?</h4>
                        <p className="text-sm text-muted-foreground">
                            Teste o plano Growth sem risco! Se não gostar nos primeiros 7 dias, devolvemos 100% do seu dinheiro, sem perguntas.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-primary">Meus dados ficam seguros?</h4>
                        <p className="text-sm text-muted-foreground">
                            Totalmente. Usamos criptografia de ponta a ponta e hospedamos em servidores certificados no Brasil.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-primary">Tem suporte em português?</h4>
                        <p className="text-sm text-muted-foreground">
                            Sim! Todo o suporte é em português, com times brasileiros. Plano Growth tem prioridade.
                        </p>
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="mx-auto mt-24 max-w-2xl text-center">
                <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-purple-500/5 p-8">
                    <h3 className="text-2xl font-bold mb-3">Ainda tem dúvidas?</h3>
                    <p className="text-muted-foreground mb-6">
                        Fale com nosso time de vendas e tire todas as suas dúvidas
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" variant="default">
                            <Link href="/register">
                                Começar Grátis
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                                Falar com Vendas
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}
