import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getAllNicheSlugs, getNicheBySlug } from '@/config/niche-data'
import { Building2, Sun, Sparkles, Briefcase, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Soluções Sirius CRM por Segmento — Corretores, Solar, Agências e Mais',
  description: 'O Sirius CRM tem solução específica para cada segmento: corretores de imóveis, energia solar, agências de marketing, consultores e representantes comerciais. Comece grátis.',
  keywords: [
    'crm por segmento', 'crm corretores imóveis', 'crm energia solar', 'crm agências marketing',
    'crm consultores', 'crm representantes comerciais', 'solucoes crm brasil 2026',
  ],
  alternates: { canonical: 'https://sirius.roilabs.com.br/solucoes' },
  openGraph: {
    title: 'Soluções Sirius CRM por Segmento',
    description: 'CRM com solução específica para corretores, solar, agências, consultores e representantes. Comece grátis.',
    url: 'https://sirius.roilabs.com.br/solucoes',
    siteName: 'Sirius CRM',
    locale: 'pt_BR',
    type: 'website',
  },
}

const ICON_MAP = {
  Building2,
  Sun,
  Sparkles,
  Briefcase,
  TrendingUp,
}

const GRADIENT_TEXT: Record<string, string> = {
  'from-indigo-600 to-purple-600': 'from-indigo-600 to-purple-600',
  'from-yellow-500 to-orange-500': 'from-yellow-500 to-orange-500',
  'from-pink-600 to-rose-600': 'from-pink-600 to-rose-600',
  'from-blue-600 to-cyan-600': 'from-blue-600 to-cyan-600',
  'from-green-600 to-emerald-600': 'from-green-600 to-emerald-600',
}

export default function SolucoesPage() {
  const slugs = getAllNicheSlugs()
  const niches = slugs.map(slug => getNicheBySlug(slug)).filter(Boolean)

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sirius.roilabs.com.br' },
      { '@type': 'ListItem', position: 2, name: 'Soluções', item: 'https://sirius.roilabs.com.br/solucoes' },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Soluções por Segmento
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Um CRM feito para{' '}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              o seu mercado
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Cada segmento tem suas particularidades. O Sirius se adapta ao seu vocabulário, fluxo de trabalho e necessidades específicas.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Começar Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">Ver Planos</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Sem cartão de crédito • Cancele quando quiser
          </p>
        </section>

        {/* Niche Cards */}
        <section className="container mx-auto px-4 pb-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {niches.map((niche) => {
              if (!niche) return null
              const Icon = ICON_MAP[niche.icon]
              return (
                <Link
                  key={niche.slug}
                  href={`/solucoes/${niche.slug}`}
                  className="group flex flex-col bg-card border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${niche.color.gradient} mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {niche.title}
                  </h2>

                  <p className="text-muted-foreground text-sm mb-4 flex-1">
                    {niche.subtitle}
                  </p>

                  <div className="space-y-1.5 mb-5">
                    {niche.benefits.slice(0, 3).map((b, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-foreground/80">{b.title}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 text-sm font-medium text-primary">
                    Ver solução
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* CTA Final */}
        <section className="bg-gradient-to-r from-primary/10 to-purple-500/10 py-20">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Não encontrou seu segmento?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              O Sirius funciona para qualquer negócio com ciclo de vendas. Experimente grátis e configure do seu jeito.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">
                Criar conta grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}
