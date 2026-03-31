import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Users, Target, Lightbulb, TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre Nós | Sirius CRM',
  description: 'Conheça a história do Sirius CRM, parte do Grupo ROI Labs. Nossa missão é simplificar vendas para empreendedores brasileiros com tecnologia acessível e eficiente.',
  keywords: ['sirius crm', 'roi labs', 'crm brasil', 'sobre', 'empresa'],
  alternates: { canonical: 'https://sirius.roilabs.com.br/about' },
  openGraph: {
    title: 'Sobre Nós | Sirius CRM',
    description: 'Conheça a história do Sirius CRM, parte do Grupo ROI Labs. Nossa missão é simplificar vendas para empreendedores brasileiros.',
    url: 'https://sirius.roilabs.com.br/about',
    images: [{
      url: 'https://sirius.roilabs.com.br/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Sirius CRM - CRM Inteligente para Vendedores Brasileiros',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre Nós | Sirius CRM',
    description: 'Conheça a história do Sirius CRM, parte do Grupo ROI Labs.',
  },
}

export default function AboutPage() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Sirius CRM",
    "url": "https://sirius.roilabs.com.br",
    "logo": "https://sirius.roilabs.com.br/logo.png",
    "description": "CRM intuitivo para PMEs brasileiras. Gestão de vendas simplificada.",
    "founder": {
      "@type": "Organization",
      "name": "ROI Labs"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "BR"
    },
    "sameAs": [
      "https://roilabs.com.br"
    ]
  }

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
        "name": "Sobre",
        "item": "https://sirius.roilabs.com.br/about"
      }
    ]
  }

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="bg-background">
        {/* Hero Section */}
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary">Sobre o Sirius CRM</h2>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Brilhe nas vendas com a estrela do ROI Labs
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Somos uma equipe apaixonada por simplificar a gestão de vendas para empreendedores brasileiros.
                Acreditamos que tecnologia de qualidade deve ser acessível a todos.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 items-center">
              <div className="lg:pr-8">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Nossa Missão</h2>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  Criar ferramentas que transformam a maneira como pequenas e médias empresas gerenciam suas vendas.
                  Sem complexidade desnecessária, sem curvas de aprendizado intermináveis.
                </p>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">
                  Cada funcionalidade do Sirius CRM foi desenhada pensando na produtividade real do vendedor brasileiro.
                  Menos tempo configurando, mais tempo vendendo.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full h-64 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                  <Target className="h-32 w-32 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground text-center sm:text-4xl mb-12">
              Nossos Valores
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6 border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4">
                  <Lightbulb className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Simplicidade</h3>
                <p className="text-muted-foreground">
                  Acreditamos que software poderoso não precisa ser complicado. Cada feature é pensada para ser intuitiva.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Foco no Cliente</h3>
                <p className="text-muted-foreground">
                  Ouvimos nossos usuários e iteramos rápido. Seu feedback molda o produto que construímos.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Crescimento</h3>
                <p className="text-muted-foreground">
                  Evoluímos constantemente. Novas funcionalidades são lançadas regularmente baseadas em dados reais.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Labs Section */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-6">
                Parte do Grupo ROI Labs
              </h2>
              <p className="text-lg leading-8 text-muted-foreground mb-8">
                O Sirius CRM é desenvolvido pela ROI Labs, uma empresa focada em criar soluções tecnológicas
                que geram retorno real para negócios brasileiros.
              </p>
              <Button asChild variant="outline" size="lg">
                <Link href="https://roilabs.com.br" target="_blank" rel="noopener noreferrer">
                  Conheça a ROI Labs
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Pronto para simplificar suas vendas?
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Junte-se a centenas de empreendedores que já estão vendendo mais com o Sirius CRM.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button asChild size="lg">
                  <Link href="/register">Começar Grátis</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/features">Ver Funcionalidades</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
