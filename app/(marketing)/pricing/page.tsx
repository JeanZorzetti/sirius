import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Check, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Preços e Planos | Sirius CRM — Plano Gratuito Disponível',
  description: 'Sirius CRM gratuito para sempre. Starter R$49/mês, Pro R$97/mês, Business R$149/mês. Sem cartão para começar.',
  keywords: ['crm preços', 'sirius crm planos', 'crm gratuito brasil', 'starter pro business', 'assinatura crm'],
  alternates: { canonical: 'https://sirius.roilabs.com.br/pricing' },
  openGraph: {
    title: 'Preços e Planos | Sirius CRM',
    description: 'Plano gratuito + Starter R$49, Pro R$97, Business R$149/mês. Pipeline visual, automações, WhatsApp integrado.',
    url: 'https://sirius.roilabs.com.br/pricing',
    images: [{ url: 'https://sirius.roilabs.com.br/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Preços e Planos | Sirius CRM',
    description: 'Plano gratuito + Starter R$49, Pro R$97, Business R$149/mês. Pipeline visual, automações, WhatsApp integrado.',
  },
}

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
import { TrackedSignupButton } from '@/components/analytics/tracked-signup-button'

const tiers = [
    {
        name: 'Gratuito',
        id: 'tier-free',
        href: '/register',
        priceMonthly: 'Grátis',
        description: 'Para testar e organizar suas vendas.',
        features: [
            '1 Usuário',
            '100 Contatos',
            '50 Negócios ativos',
            '1 Pipeline Kanban',
            'Suporte via Comunidade',
        ],
        featured: false,
    },
    {
        name: 'Starter',
        id: 'tier-starter',
        href: '/register',
        priceMonthly: 'R$ 49',
        description: 'Para pequenas empresas que querem crescer.',
        features: [
            'Até 3 Usuários',
            '500 Contatos',
            '200 Negócios ativos',
            '3 Pipelines Kanban',
            '1 instância WhatsApp',
            '50 créditos de prospecção/mês',
            'Suporte por e-mail',
        ],
        featured: false,
    },
    {
        name: 'Pro',
        id: 'tier-pro',
        href: '/register',
        priceMonthly: 'R$ 97',
        description: 'Para equipes em crescimento que precisam de mais.',
        features: [
            'Até 10 Usuários',
            '2.000 Contatos',
            '1.000 Negócios ativos',
            '10 Pipelines Kanban',
            '1 instância WhatsApp',
            '200 créditos de prospecção/mês',
            'AGI Sirius (IA comercial)',
            'Analytics avançado',
            'Webhooks + API pública',
            'Suporte prioritário',
        ],
        featured: true,
    },
    {
        name: 'Business',
        id: 'tier-business',
        href: '/register',
        priceMonthly: 'R$ 149',
        description: 'Para grandes operações com máxima escala.',
        features: [
            'Até 50 Usuários',
            'Contatos Ilimitados',
            'Negócios Ilimitados',
            '50 Pipelines Kanban',
            '5 instâncias WhatsApp',
            '1.000 créditos de prospecção/mês',
            'Round-Robin de leads',
            'Relatórios personalizados',
            'SSO & Audit Log',
            'Gerente de conta dedicado',
        ],
        featured: false,
    },
]

export default function PricingPage() {
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://sirius.roilabs.com.br" },
            { "@type": "ListItem", "position": 2, "name": "Preços", "item": "https://sirius.roilabs.com.br/pricing" }
        ]
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Posso trocar de plano depois?",
                "acceptedAnswer": { "@type": "Answer", "text": "Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Ajustamos o valor proporcionalmente." }
            },
            {
                "@type": "Question",
                "name": "Como funciona o plano gratuito?",
                "acceptedAnswer": { "@type": "Answer", "text": "100% funcional, sem prazo de expiração. Perfeito para validar o CRM antes de escalar seu time." }
            },
            {
                "@type": "Question",
                "name": "Preciso de cartão para começar?",
                "acceptedAnswer": { "@type": "Answer", "text": "Não! O plano Gratuito não precisa de cartão. Só pedimos cartão quando você quiser fazer upgrade." }
            },
            {
                "@type": "Question",
                "name": "Posso cancelar quando quiser?",
                "acceptedAnswer": { "@type": "Answer", "text": "Sim, sem multas ou taxas. Cancele a qualquer momento e mantenha acesso até o fim do período pago." }
            },
            {
                "@type": "Question",
                "name": "Como funciona a garantia de 7 dias?",
                "acceptedAnswer": { "@type": "Answer", "text": "Teste qualquer plano pago sem risco! Se não gostar nos primeiros 7 dias, devolvemos 100% do seu dinheiro, sem perguntas." }
            },
            {
                "@type": "Question",
                "name": "Meus dados ficam seguros?",
                "acceptedAnswer": { "@type": "Answer", "text": "Totalmente. Usamos criptografia de ponta a ponta e hospedamos em servidores certificados no Brasil." }
            },
            {
                "@type": "Question",
                "name": "Tem suporte em português?",
                "acceptedAnswer": { "@type": "Answer", "text": "Sim! Todo o suporte é em português, com times brasileiros. Planos Pro e Business têm prioridade." }
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
                "name": "Plano Gratuito",
                "price": "0",
                "priceCurrency": "BRL",
                "availability": "https://schema.org/InStock",
                "description": "Para testar e organizar suas vendas. 1 usuário, 100 contatos, 50 negócios."
            },
            {
                "@type": "Offer",
                "name": "Plano Starter",
                "price": "49",
                "priceCurrency": "BRL",
                "availability": "https://schema.org/InStock",
                "description": "Para pequenas empresas. Até 3 usuários, 500 contatos, 200 negócios, WhatsApp integrado."
            },
            {
                "@type": "Offer",
                "name": "Plano Pro",
                "price": "97",
                "priceCurrency": "BRL",
                "availability": "https://schema.org/InStock",
                "description": "Para equipes em crescimento. Até 10 usuários, 2.000 contatos, IA comercial, analytics avançado."
            },
            {
                "@type": "Offer",
                "name": "Plano Business",
                "price": "149",
                "priceCurrency": "BRL",
                "availability": "https://schema.org/InStock",
                "description": "Para grandes operações. Até 50 usuários, contatos ilimitados, 5 instâncias WhatsApp, SSO."
            }
        ]
    };

    const softwareAppSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Sirius CRM",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, iOS, Android",
        "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "BRL",
            "lowPrice": "0",
            "highPrice": "149",
            "offerCount": "4"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "12"
        },
        "description": "CRM visual com pipeline Kanban, automações de IA e integração WhatsApp nativa para vendedores brasileiros.",
        "featureList": [
            "Pipeline Kanban Visual",
            "WhatsApp Integrado",
            "Automações de IA",
            "Analytics em Tempo Real",
            "Mobile App (iOS/Android)"
        ],
        "screenshot": "https://sirius.roilabs.com.br/og-image.png"
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
                id="faq-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <Script
                id="offers-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(offersSchema) }}
            />
            <Script
                id="software-app-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
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
                <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                    Pague apenas quando escalar
                </h1>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground">
                Comece grátis hoje e faça upgrade quando seu time crescer. Sem surpresas, sem taxas escondidas.
            </p>

            {/* Founders CTA Banner */}
            <div className="mx-auto mt-10 max-w-4xl">
                <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Star className="w-6 h-6 text-amber-500 fill-amber-400 shrink-0" />
                        <div>
                            <p className="font-semibold text-amber-900">Programa de Fundadores — 41% OFF vitalício!</p>
                            <p className="text-sm text-amber-700">Starter R$29 · Pro R$57 · Business R$88/mês para sempre. Vagas limitadas.</p>
                        </div>
                    </div>
                    <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
                        <Link href="/fundadores">
                            <Star className="w-4 h-4 mr-2 fill-white" />
                            Ver oferta
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-y-6 sm:mt-20 sm:gap-y-0 lg:grid-cols-4 lg:gap-x-6">
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
                                {tier.priceMonthly !== 'Grátis' && <span className="text-sm font-semibold leading-6 text-muted-foreground">/mês</span>}
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
                                    Começar Agora
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
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">R$ 97</div>
                            <div className="text-sm text-muted-foreground">Investimento mensal (Pro)</div>
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
                            Não! O plano Gratuito é para sempre, sem cartão. Só pedimos quando você quiser fazer upgrade.
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
                            Teste qualquer plano pago sem risco! Se não gostar nos primeiros 7 dias, devolvemos 100% do seu dinheiro, sem perguntas.
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
                            Sim! Todo o suporte é em português, com times brasileiros. Planos Pro e Business têm prioridade.
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
                        <TrackedSignupButton
                            href="/register"
                            source="pricing_page_cta"
                            plan="free"
                            size="lg"
                            variant="default"
                        >
                            Começar Grátis
                        </TrackedSignupButton>
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
