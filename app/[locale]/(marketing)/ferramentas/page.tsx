import { Metadata } from 'next'
import Link from 'next/link'
import { Calculator, Building2, Sun, Users, Briefcase, BarChart3 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { buildLocaleAlternates } from '@/lib/seo/canonical'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const alternates = buildLocaleAlternates(locale, '/ferramentas', '/tools')
  return {
    title: 'Ferramentas Gratuitas para Vendedores | Sirius CRM',
    description: 'Calculadoras de ROI gratuitas para vendedores brasileiros. Descubra quanto você perde sem um CRM e projete o retorno do investimento para o seu segmento.',
    keywords: ['calculadora roi', 'ferramentas vendas', 'crm roi', 'calculadora vendas', 'sirius crm ferramentas'],
    alternates,
    openGraph: {
      title: 'Ferramentas Gratuitas para Vendedores | Sirius CRM',
      description: 'Calculadoras de ROI gratuitas para vendedores brasileiros.',
      url: alternates.canonical,
      images: [{ url: 'https://siriuscrm.com.br/og-image.png', width: 1200, height: 630 }],
    },
  }
}

const calculators = [
  {
    href: '/ferramentas/calculadora-roi',
    icon: BarChart3,
    title: 'Calculadora de Vazamento de Vendas',
    description: 'Descubra quanto dinheiro você está perdendo por não ter um sistema organizado de vendas.',
  },
  {
    href: '/ferramentas/calculadora-roi-corretores',
    icon: Building2,
    title: 'ROI para Corretores de Imóveis',
    description: 'Calcule o retorno do CRM para corretores e imobiliárias.',
  },
  {
    href: '/ferramentas/calculadora-roi-agencias',
    icon: Users,
    title: 'ROI para Agências de Marketing',
    description: 'Projete o retorno do CRM para agências e consultorias de marketing.',
  },
  {
    href: '/ferramentas/calculadora-roi-consultores',
    icon: Briefcase,
    title: 'ROI para Consultores',
    description: 'Calcule o retorno do CRM para consultores e prestadores de serviço.',
  },
  {
    href: '/ferramentas/calculadora-roi-energia-solar',
    icon: Sun,
    title: 'ROI para Energia Solar',
    description: 'Projete o retorno do CRM para empresas de energia solar e eficiência energética.',
  },
  {
    href: '/ferramentas/calculadora-roi-representantes',
    icon: Calculator,
    title: 'ROI para Representantes Comerciais',
    description: 'Calcule o retorno do CRM para representantes e distribuidores.',
  },
]

export default function FerramentasPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://siriuscrm.com.br" },
      { "@type": "ListItem", "position": 2, "name": "Ferramentas", "item": "https://siriuscrm.com.br/ferramentas" },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Ferramentas Gratuitas para Vendedores
            </h1>
            <p className="text-lg text-muted-foreground">
              Calculadoras de ROI para projetar o retorno do Sirius CRM no seu segmento.
              Descubra quanto você perde sem um sistema organizado de vendas.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {calculators.map((calc) => {
              const Icon = calc.icon
              return (
                <Link key={calc.href} href={calc.href}>
                  <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all">
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{calc.title}</CardTitle>
                      <CardDescription>{calc.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Recursos de dados */}
          <div className="mt-12 max-w-5xl mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-center">Dados e Benchmarks</h2>
            <Link href="/anuario">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Anuário do Vendedor B2B Brasileiro 2026</CardTitle>
                    <CardDescription>Benchmarks exclusivos: taxa de conversão, ciclo de venda e impacto da IA por setor. Dados de +127 empresas.</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>

          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Quer ver o Sirius CRM em ação?
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
