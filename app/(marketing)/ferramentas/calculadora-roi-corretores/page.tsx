import { Metadata } from 'next'
import { CalculadoraROI } from '@/components/calculadora-roi'
import { Building2, TrendingUp, Users, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Calculadora de ROI para Corretores de Imóveis | Sirius CRM',
  description: 'Descubra quanto dinheiro você está perdendo por desorganização nas vendas. Calculadora gratuita para corretores de imóveis que mostra o impacto real de um CRM nas suas comissões.',
  keywords: 'calculadora roi corretor, crm imobiliário, vendas imóveis, comissão imobiliária, gestão imobiliária',
  openGraph: {
    title: 'Calculadora de ROI para Corretores | Quanto você perde por desorganização?',
    description: 'Calcule o impacto real de perder leads e oportunidades. Veja quanto um CRM pode aumentar suas comissões.',
    url: 'https://sirius.roilabs.com.br/ferramentas/calculadora-roi-corretores',
    siteName: 'Sirius CRM',
    locale: 'pt_BR',
    type: 'website',
  }
}

export default function CalculadoraCorretoresPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header com Logo */}
      <header className="border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold">Sirius CRM</span>
            </div>
            <a
              href="/vendas-automaticas"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Conheça o Sirius →
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6">
            <Building2 className="h-4 w-4" />
            Ferramentas Gratuitas para Corretores
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Quanto Dinheiro Você Está Perdendo por Desorganização?
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Descubra o impacto real de leads perdidos e follow-ups esquecidos nas suas comissões.
            <span className="font-semibold text-foreground"> A média do mercado perde R$ 87.500/ano</span> por falta de organização.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>+2.500 corretores usando</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Média de 34% mais vendas</span>
            </div>
          </div>
        </div>

        {/* Calculadora */}
        <CalculadoraROI
          ctaText="Recuperar esse dinheiro agora"
          ctaHref="/vendas-automaticas?origem=calc-corretores"
        />
      </section>

      {/* Benefícios Específicos para Corretores */}
      <section className="bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/20 dark:to-zinc-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Por que corretores de sucesso usam CRM?
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Follow-up Automático</h3>
                <p className="text-muted-foreground">
                  Nunca mais perca um cliente por esquecer de retornar. Sistema lembra você de cada follow-up no momento certo.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Pipeline Visual</h3>
                <p className="text-muted-foreground">
                  Veja todos os seus imóveis e clientes em um funil organizado. Saiba exatamente onde cada negociação está.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Histórico Completo</h3>
                <p className="text-muted-foreground">
                  Todas as conversas, visitas e propostas registradas. Retome qualquer negociação de onde parou.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Comissões Projetadas</h3>
                <p className="text-muted-foreground">
                  Visualize quanto dinheiro está em cada etapa do funil. Saiba exatamente suas comissões futuras.
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
            Pronto para parar de perder dinheiro?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Comece grátis hoje. Sem cartão de crédito, sem limite de tempo.
          </p>
          <a
            href="/vendas-automaticas?origem=calc-corretores"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Começar Grátis Agora
          </a>
          <p className="text-sm text-muted-foreground mt-4">
            50 contatos grátis para sempre • Cancele quando quiser
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
