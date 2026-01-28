import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getNicheBySlug, getAllNicheSlugs } from '@/config/niche-data'
import { CalculadoraROI } from '@/components/calculadora-roi'
import { Building2, Sun, Sparkles, Briefcase, TrendingUp, CheckCircle2, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// Mapear ícones
const ICON_MAP = {
  Building2,
  Sun,
  Sparkles,
  Briefcase,
  TrendingUp
}

// Gerar todas as páginas estaticamente no build (SSG)
// Força rebuild: 2025-01-27
export async function generateStaticParams() {
  const slugs = getAllNicheSlugs()
  return slugs.map(slug => ({ slug }))
}

// Meta tags dinâmicas por nicho
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const niche = getNicheBySlug(slug)

  if (!niche) {
    return {
      title: 'Página não encontrada',
    }
  }

  return {
    title: niche.seo.title,
    description: niche.seo.description,
    keywords: niche.seo.keywords.join(', '),
    openGraph: {
      title: niche.seo.title,
      description: niche.seo.description,
      url: `https://sirius.roilabs.com.br/solucoes/${niche.slug}`,
      siteName: 'Sirius CRM',
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: niche.seo.title,
      description: niche.seo.description,
    }
  }
}

export default async function NicheSolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const niche = getNicheBySlug(slug)

  if (!niche) {
    notFound()
  }

  const Icon = ICON_MAP[niche.icon]

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-${niche.color.primary}-100 dark:bg-${niche.color.primary}-950 text-${niche.color.primary}-700 dark:text-${niche.color.primary}-300 text-sm font-medium mb-6`}>
            <Icon className="h-4 w-4" />
            Solução para {niche.slug.replace(/-/g, ' ')}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className={`bg-gradient-to-r ${niche.color.gradient} bg-clip-text text-transparent`}>
              {niche.title}
            </span>
          </h1>

          <p className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-4">
            {niche.subtitle}
          </p>

          <div className="space-y-3 mb-8">
            <p className="text-xl text-red-600 dark:text-red-400 font-medium">
              ❌ {niche.painPoint}
            </p>
            <p className="text-xl text-red-600 dark:text-red-400 font-medium">
              ❌ {niche.painPointSecondary}
            </p>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <Users className={`h-4 w-4 text-${niche.color.primary}-600`} />
              <span>{niche.socialProof.users} usando</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>{niche.socialProof.improvement}</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <a href="/register">
              <Button size="lg" className={`bg-gradient-to-r ${niche.color.gradient} hover:opacity-90 text-lg px-8`}>
                Começar Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="#calculadora">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Calcular minha perda
              </Button>
            </a>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Sem cartão de crédito • Sem limite de tempo • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Benefícios Específicos */}
      <section className={`bg-gradient-to-b from-${niche.color.primary}-50 to-white dark:from-${niche.color.primary}-950/20 dark:to-zinc-900 py-20`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Como o Sirius resolve seus problemas
            </h2>
            <p className="text-xl text-center text-muted-foreground mb-12">
              Funcionalidades pensadas especialmente para {niche.jargon.lead.toLowerCase()}s e {niche.jargon.deal.toLowerCase()}s
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {niche.benefits.map((benefit, index) => (
                <div key={index} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Calculadora Adaptada */}
      <section id="calculadora" className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {niche.calculatorCopy.title}
          </h2>
          <p className="text-xl text-muted-foreground">
            {niche.calculatorCopy.subtitle}
          </p>
        </div>

        <CalculadoraROI
          ctaText={niche.calculatorCopy.ctaText}
          ctaHref={`/register?origem=solucoes-${niche.slug}`}
        />
      </section>

      {/* Depoimento */}
      <section className={`bg-gradient-to-r from-${niche.color.primary}-50 to-${niche.color.secondary}-50 dark:from-${niche.color.primary}-950/20 dark:to-${niche.color.secondary}-950/20 py-20`}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 p-8 md:p-12 rounded-2xl border shadow-lg">
              <div className="flex items-start gap-4 mb-6">
                <div className={`bg-${niche.color.primary}-600 text-white p-3 rounded-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-lg md:text-xl text-muted-foreground mb-6 italic">
                    "{niche.testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-bold">{niche.testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{niche.testimonial.role}</p>
                    <p className="text-sm text-muted-foreground">{niche.testimonial.company}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Gratuitos - only for corretores */}
      {slug === 'corretores-de-imoveis' && (
        <section className="container mx-auto px-4 py-20 bg-linear-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Recursos Gratuitos para Corretores
              </h2>
              <p className="text-xl text-muted-foreground">
                Ferramentas e guias práticos para organizar suas vendas
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <a
                href="/blog/planilha-controle-comissao-corretor"
                className="group block p-6 bg-card rounded-2xl border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      Planilha de Controle de Comissões
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      Descubra quanto você perde por mês com desorganização. Calculadora gratuita + guia completo.
                    </p>
                    <span className="text-primary font-medium inline-flex items-center gap-2">
                      Acessar gratuitamente
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </a>

              <a
                href="/ferramentas/calculadora-roi-corretores"
                className="group block p-6 bg-card rounded-2xl border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      Calculadora de ROI
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      Calcule quanto você pode ganhar com automação e organização de vendas.
                    </p>
                    <span className="text-primary font-medium inline-flex items-center gap-2">
                      Calcular agora
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perguntas Frequentes
          </h2>

          <Accordion type="single" collapsible className="space-y-4">
            {niche.faq.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para organizar suas vendas?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Comece grátis hoje. Sem cartão de crédito, sem limite de tempo.
          </p>
          <a href="/register">
            <Button size="lg" className={`bg-gradient-to-r ${niche.color.gradient} hover:opacity-90 text-lg px-12 py-6`}>
              Começar Grátis Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
          <p className="text-sm text-muted-foreground mt-4">
            50 {niche.jargon.lead.toLowerCase()}s grátis para sempre • Cancele quando quiser
          </p>
        </div>
      </section>
    </div>
  )
}
