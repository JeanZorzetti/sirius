import { Metadata } from 'next'
import { CalculadoraROI } from '@/components/calculadora-roi'
import { Briefcase, TrendingUp, Users, CheckCircle2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { buildLocaleAlternates } from '@/lib/seo/canonical'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.ferramentas.calculadoraRoiConsultores.meta' })
  const alternates = buildLocaleAlternates(locale, '/ferramentas/calculadora-roi-consultores', '/tools/roi-calculator-consultants')
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: alternates.canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  }
}

export default function CalculadoraConsultoresPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header com Logo */}
      <header className="border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">Sirius CRM</span>
            </div>
            <a
              href="/vendas-automaticas"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Conheça o Sirius →
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <Briefcase className="h-4 w-4" />
            Ferramentas Gratuitas para Consultores
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Quanto em Honorários Você Está Perdendo por Desorganização?
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Descubra o impacto real de projetos não acompanhados e diagnósticos esquecidos.
            <span className="font-semibold text-foreground"> Consultores perdem em média R$ 156.000/ano</span> por falta de follow-up estruturado.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>+450 consultores usando</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Média de 42% mais projetos fechados</span>
            </div>
          </div>
        </div>

        {/* Calculadora */}
        <CalculadoraROI
          ctaText="Recuperar esses honorários agora"
          ctaHref="/vendas-automaticas?origem=calc-consultores"
        />
      </section>

      {/* Benefícios Específicos para Consultores */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-zinc-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Por que consultores de sucesso usam CRM?
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Gestão de Pipeline de Projetos</h3>
                <p className="text-muted-foreground">
                  Acompanhe cada projeto desde a prospecção até o fechamento. Veja onde cada oportunidade está travando.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Histórico de Diagnósticos</h3>
                <p className="text-muted-foreground">
                  Registre todas as reuniões de diagnóstico, pontos de dor identificados e propostas. Retome qualquer projeto do ponto exato.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Follow-up Estruturado</h3>
                <p className="text-muted-foreground">
                  Crie lembretes automáticos para acompanhar cada proposta no timing certo. Nunca mais perca um projeto por esquecimento.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Relatórios de Performance</h3>
                <p className="text-muted-foreground">
                  Veja sua taxa de conversão, tempo médio de fechamento e ticket médio. Otimize seu processo comercial com dados reais.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para aumentar seus honorários?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Comece grátis hoje. Sem cartão de crédito, sem limite de tempo.
          </p>
          <a
            href="/vendas-automaticas?origem=calc-consultores"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
          >
            Começar Grátis Agora
          </a>
          <p className="text-sm text-muted-foreground mt-4">
            50 prospects grátis para sempre • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Sirius CRM - ROI Labs. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
