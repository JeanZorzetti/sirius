import { Metadata } from 'next'
import { CalculadoraROI } from '@/components/calculadora-roi'
import { Sun, TrendingUp, Users, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Calculadora de ROI para Empresas de Energia Solar | Sirius CRM',
  description: 'Calcule quanto dinheiro sua empresa de energia solar perde por desorganização. Veja o impacto real de um CRM no seu faturamento e conversão de propostas.',
  keywords: 'calculadora roi energia solar, crm energia solar, vendas fotovoltaica, gestão solar, propostas energia',
  openGraph: {
    title: 'Calculadora de ROI para Energia Solar | Quanto você perde por mês?',
    description: 'Descubra quanto faturamento você está deixando na mesa por falta de organização nas propostas.',
    url: 'https://siriuscrm.com.br/ferramentas/calculadora-roi-energia-solar',
    siteName: 'Sirius CRM',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculadora de ROI para Energia Solar | Sirius CRM',
    description: 'Calcule quanto sua empresa de energia solar perde por desorganização em vendas.',
  },
}

export default function CalculadoraEnergiaSolarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header com Logo */}
      <header className="border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-8 w-8 text-amber-500" />
              <span className="text-xl font-bold">Sirius CRM</span>
            </div>
            <a
              href="/vendas-automaticas"
              className="text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              Conheça o Sirius →
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-sm font-medium mb-6">
            <Sun className="h-4 w-4" />
            Ferramentas Gratuitas para Energia Solar
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            Quantas Propostas Você Está Perdendo por Desorganização?
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Descubra o impacto real de propostas não acompanhadas e follow-ups perdidos.
            <span className="font-semibold text-foreground"> Empresas de energia solar perdem em média 42% das propostas</span> por falta de follow-up.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-600" />
              <span>+150 integradoras usando</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>58% mais propostas fechadas</span>
            </div>
          </div>
        </div>

        {/* Calculadora */}
        <CalculadoraROI
          ctaText="Recuperar essas propostas agora"
          ctaHref="/vendas-automaticas?origem=calc-energia-solar"
        />
      </section>

      {/* Benefícios Específicos para Energia Solar */}
      <section className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-zinc-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Por que integradoras de sucesso usam CRM?
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Gestão de Propostas</h3>
                <p className="text-muted-foreground">
                  Acompanhe cada proposta desde o orçamento até a instalação. Nunca mais perca uma venda por falta de follow-up.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Pipeline por Etapa</h3>
                <p className="text-muted-foreground">
                  Visualize quantas propostas estão em orçamento, análise técnica, aprovação e instalação. Foque no que converte.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Histórico de Interações</h3>
                <p className="text-muted-foreground">
                  Todas as simulações, visitas técnicas e negociações registradas. Retome qualquer conversa do ponto exato.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Relatórios de Conversão</h3>
                <p className="text-muted-foreground">
                  Veja sua taxa de conversão por origem, região e vendedor. Otimize o que funciona, elimine o que não converte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Caso de Uso Real */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-8 md:p-12 rounded-2xl border">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-amber-600 text-white p-3 rounded-lg">
              <Sun className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Caso Real: Solar Tech RJ</h3>
              <p className="text-muted-foreground">
                "Antes do Sirius, perdíamos 40% das propostas porque não tínhamos controle de follow-up.
                Hoje, nossa taxa de conversão subiu de 15% para 26% em apenas 3 meses.
                <span className="font-semibold text-foreground"> Isso representou +R$ 340 mil em faturamento adicional</span>."
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                — Rafael Costa, Diretor Comercial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para converter mais propostas?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Comece grátis hoje. Sem cartão de crédito, sem limite de tempo.
          </p>
          <a
            href="/vendas-automaticas?origem=calc-energia-solar"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
          >
            Começar Grátis Agora
          </a>
          <p className="text-sm text-muted-foreground mt-4">
            50 propostas grátis para sempre • Cancele quando quiser
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
