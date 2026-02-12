import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Kanban, BarChart3, Users, Zap, Shield, Smartphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Funcionalidades | Sirius CRM — Pipeline, Automações, IA, WhatsApp',
  description: 'Conheça todas as funcionalidades do Sirius CRM: pipeline Kanban, automações de email e deals, integração WhatsApp, OCR de cartões, analytics PRO e muito mais.',
  alternates: { canonical: 'https://sirius.roilabs.com.br/features' },
  openGraph: {
    title: 'Funcionalidades | Sirius CRM',
    description: 'Pipeline Kanban, automações, IA, WhatsApp integrado e muito mais.',
    url: 'https://sirius.roilabs.com.br/features',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Funcionalidades | Sirius CRM',
    description: 'Pipeline Kanban, automações, IA, WhatsApp integrado e muito mais.',
  },
}

const features = [
    {
        name: 'Pipeline Kanban',
        description: 'Visualize seus negócios em estágios claros. Arraste e solte para avançar negociações. Personalize seu funil conforme seu processo.',
        icon: Kanban,
    },
    {
        name: 'Gestão de Contatos',
        description: 'Mantenha histórico de todas as interações. Saiba exatamente quando foi o último contato e o que foi conversado.',
        icon: Users,
    },
    {
        name: 'Analytics em Tempo Real',
        description: 'Painéis que mostram a saúde do seu comercial. Taxa de conversão, ticket médio e previsão de fechamento.',
        icon: BarChart3,
    },
    {
        name: 'Automação (Em Breve)',
        description: 'Envie e-mails de follow-up automaticamente. Nunca mais esqueça de responder um cliente.',
        icon: Zap,
    },
    {
        name: 'Segurança de Dados',
        description: 'Seus dados são criptografados e isolados. backups diários garantem que você nunca perca informações.',
        icon: Shield,
    },
    {
        name: 'Mobile First',
        description: 'Acesse seu CRM de qualquer lugar. Interface totalmente responsiva para fechar negócios no celular.',
        icon: Smartphone,
    },
]

export default function FeaturesPage() {
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "Como usar o Sirius CRM para aumentar suas vendas",
        "description": "Guia completo de como usar o Sirius CRM para gerenciar seu pipeline de vendas, contatos e fechar mais negócios.",
        "step": [
            {
                "@type": "HowToStep",
                "name": "Configure seu Pipeline Kanban",
                "text": "Crie as etapas do seu funil de vendas. Arraste e solte cards entre colunas para avançar negociações. Personalize conforme seu processo comercial.",
                "image": "https://sirius.roilabs.com.br/og-image.png"
            },
            {
                "@type": "HowToStep",
                "name": "Adicione seus Contatos",
                "text": "Cadastre seus leads e clientes com telefone, email e informações relevantes. Mantenha histórico de todas as interações.",
                "image": "https://sirius.roilabs.com.br/og-image.png"
            },
            {
                "@type": "HowToStep",
                "name": "Use WhatsApp com 1 Clique",
                "text": "Clique no botão verde em cada card para abrir conversa direto no WhatsApp. Sem copiar telefone, sem trocar de app.",
                "image": "https://sirius.roilabs.com.br/og-image.png"
            },
            {
                "@type": "HowToStep",
                "name": "Acompanhe Métricas em Tempo Real",
                "text": "Acesse o dashboard de Analytics para ver taxa de conversão, ticket médio, previsão de fechamento e identificar gargalos.",
                "image": "https://sirius.roilabs.com.br/og-image.png"
            }
        ],
        "totalTime": "PT15M"
    };

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
                "name": "Funcionalidades",
                "item": "https://sirius.roilabs.com.br/features"
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
            "highPrice": "49",
            "offerCount": "3"
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
            <Script
                id="howto-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
            />
            <Script
                id="breadcrumb-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <Script
                id="software-app-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
            />
            <div className="bg-background py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-primary">Tudo o que você precisa</h2>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Venda mais rápido, sem complexidade
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-muted-foreground">
                        Desenhamos cada funcionalidade pensando na produtividade do vendedor. Menos cliques, mais fechamentos.
                    </p>
                </div>

                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                        {features.map((feature) => (
                            <div key={feature.name} className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-foreground">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                                        <feature.icon className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                                    </div>
                                    {feature.name}
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-muted-foreground">{feature.description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className="mt-16 flex justify-center">
                    <Button asChild size="lg">
                        <Link href="/register">Testar Funcionalidades Agora</Link>
                    </Button>
                </div>
            </div>
        </div>
        </>
    )
}
