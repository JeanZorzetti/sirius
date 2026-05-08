import { Metadata } from 'next'
import { CalculadoraROI } from '@/components/calculadora-roi'
import { Sparkles, TrendingUp, Users, CheckCircle2 } from 'lucide-react'
import { buildLocaleAlternates } from '@/lib/seo/canonical'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const alternates = buildLocaleAlternates(locale, '/ferramentas/calculadora-roi-agencias', '/tools/roi-calculator-agencies')
  return {
    title: 'Calculadora de ROI para Agências de Marketing | Sirius CRM',
    description: 'Descubra quanto sua agência perde por desorganização em vendas. Calcule o impacto real de um CRM na retenção de clientes e fechamento de propostas.',
    keywords: 'calculadora roi agencia, crm agencia marketing, vendas agencia, gestão clientes agencia, propostas comerciais',
    alternates,
    openGraph: {
      title: 'Calculadora de ROI para Agências | Quanto você perde por desorganização?',
      description: 'Calcule o impacto real de propostas perdidas e follow-ups esquecidos no faturamento da sua agência.',
      url: alternates.canonical,
      siteName: 'Sirius CRM',
      locale: locale === 'en' ? 'en_US' : 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Calculadora de ROI para Agências | Sirius CRM',
      description: 'Calcule o impacto real de propostas perdidas e follow-ups esquecidos no faturamento da sua agência.',
    },
  }
}

export default function CalculadoraAgenciasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header com Logo */}
      <header className="border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold">Sirius CRM</span>
            </div>
            <a
              href="/vendas-automaticas"
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              Conheça o Sirius →
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Ferramentas Gratuitas para Agências
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Quanto Faturamento Sua Agência Perde por Desorganização?
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Descubra o impacto real de propostas esquecidas e leads não qualificados.
            <span className="font-semibold text-foreground"> Agências perdem em média R$ 142.000/ano</span> por falta de processo comercial estruturado.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span>+380 agências usando</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>47% mais propostas fechadas</span>
            </div>
          </div>
        </div>

        {/* Calculadora */}
        <CalculadoraROI
          ctaText="Recuperar esse faturamento agora"
          ctaHref="/vendas-automaticas?origem=calc-agencias"
        />
      </section>

      {/* Benefícios Específicos para Agências */}
      <section className="bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/20 dark:to-zinc-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Por que agências de crescimento usam CRM?
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Pipeline de Propostas</h3>
                <p className="text-muted-foreground">
                  Gerencie todas as propostas comerciais em um único lugar. Da descoberta ao fechamento, sem perder nenhum lead.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Qualificação de Leads</h3>
                <p className="text-muted-foreground">
                  Identifique rapidamente quais leads têm fit com sua agência. Foque energia nos prospects certos.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Histórico de Interações</h3>
                <p className="text-muted-foreground">
                  Todas as reuniões, apresentações e negociações registradas. Nunca mais perca contexto numa conversa.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Métricas Comerciais</h3>
                <p className="text-muted-foreground">
                  Ticket médio, ciclo de venda, taxa de conversão por origem. Dados reais para tomar decisões melhores.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Caso de Uso Real */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-8 md:p-12 rounded-2xl border">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-purple-600 text-white p-3 rounded-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Caso Real: Pixel Perfect Agency</h3>
              <p className="text-muted-foreground">
                "Perdíamos leads porque a comunicação entre comercial e entrega era caótica.
                Com o Sirius, implementamos um processo previsível.
                <span className="font-semibold text-foreground"> Nossa taxa de fechamento subiu de 18% para 31%</span> e conseguimos escalar o time comercial sem perder qualidade."
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                — Mariana Alves, Head of Growth
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problema Específico de Agências */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Os 3 maiores problemas comerciais de agências
          </h2>

          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border-l-4 border-red-500">
              <h3 className="text-xl font-bold mb-2">1. Propostas esquecidas</h3>
              <p className="text-muted-foreground">
                Cliente pediu proposta, você enviou, mas não fez follow-up. Uma semana depois ele fechou com o concorrente.
                <span className="font-semibold text-foreground"> Isso acontece em 47% dos casos</span>.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border-l-4 border-orange-500">
              <h3 className="text-xl font-bold mb-2">2. Leads mal qualificados</h3>
              <p className="text-muted-foreground">
                Time comercial gasta tempo com leads que não têm fit ou budget. Enquanto isso, oportunidades reais ficam esperando.
                <span className="font-semibold text-foreground"> 38% do tempo comercial é desperdiçado</span>.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border-l-4 border-yellow-500">
              <h3 className="text-xl font-bold mb-2">3. Processo não escalável</h3>
              <p className="text-muted-foreground">
                Cada vendedor tem seu próprio método. Impossível replicar o que funciona ou identificar gargalos.
                <span className="font-semibold text-foreground"> Agências param de crescer aos 10 clientes</span> por isso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para estruturar seu comercial?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Comece grátis hoje. Sem cartão de crédito, sem limite de tempo.
          </p>
          <a
            href="/vendas-automaticas?origem=calc-agencias"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
          >
            Começar Grátis Agora
          </a>
          <p className="text-sm text-muted-foreground mt-4">
            50 leads grátis para sempre • Cancele quando quiser
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
