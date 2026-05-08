import { Metadata } from 'next'
import { CalculadoraROI } from '@/components/calculadora-roi'
import { TrendingUp, Users, CheckCircle2, Smartphone } from 'lucide-react'
import { buildLocaleAlternates } from '@/lib/seo/canonical'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const alternates = buildLocaleAlternates(locale, '/ferramentas/calculadora-roi-representantes', '/tools/roi-calculator-representatives')
  return {
    title: 'Calculadora de ROI para Representantes Comerciais | Sirius CRM',
    description: 'Descubra quanto em comissões você está perdendo por desorganização nas suas vendas. Calculadora gratuita que mostra o impacto real de um CRM na sua carteira de clientes.',
    keywords: 'calculadora roi representante, crm representante comercial, gestão carteira clientes, organizar vendas representante, aumentar comissões representante',
    alternates,
    openGraph: {
      title: 'Calculadora de ROI para Representantes | Quanto você perde por mês?',
      description: 'Calcule o impacto real de pedidos não acompanhados. Veja quanto um CRM pode aumentar suas recompras.',
      url: alternates.canonical,
      siteName: 'Sirius CRM',
      locale: locale === 'en' ? 'en_US' : 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Calculadora de ROI para Representantes Comerciais | Sirius CRM',
      description: 'Descubra quanto em comissões você está perdendo por desorganização nas suas vendas.',
    },
  }
}

export default function CalculadoraRepresentantesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header com Logo */}
      <header className="border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold">Sirius CRM</span>
            </div>
            <a
              href="/vendas-automaticas"
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              Conheça o Sirius →
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm font-medium mb-6">
            <TrendingUp className="h-4 w-4" />
            Ferramentas Gratuitas para Representantes
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Quanto em Comissões Você Está Perdendo por Desorganização?
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Descubra o impacto real de pedidos não acompanhados e clientes esquecidos.
            <span className="font-semibold text-foreground"> Representantes perdem em média 38% das recompras</span> por falta de follow-up no momento certo.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span>+920 representantes usando</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Média de 51% mais recompras</span>
            </div>
          </div>
        </div>

        {/* Calculadora */}
        <CalculadoraROI
          ctaText="Recuperar essas comissões agora"
          ctaHref="/vendas-automaticas?origem=calc-representantes"
        />
      </section>

      {/* Benefícios Específicos para Representantes */}
      <section className="bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-zinc-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Por que representantes campeões usam CRM?
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Gestão de Carteira de Clientes</h3>
                <p className="text-muted-foreground">
                  Organize todos os seus clientes por região, categoria e potencial. Foque nos clientes certos no momento certo.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Histórico de Pedidos Completo</h3>
                <p className="text-muted-foreground">
                  Veja todo o histórico de compras de cada cliente. Identifique padrões de recompra e antecipe necessidades.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Roteiro de Visitas Otimizado</h3>
                <p className="text-muted-foreground">
                  Planeje suas visitas por região e prioridade. Maximize o aproveitamento de cada dia de trabalho na rua.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Lembretes de Recompra Automáticos</h3>
                <p className="text-muted-foreground">
                  Sistema avisa quando cada cliente está no timing ideal para recomprar. Nunca mais perca um pedido por esquecimento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Caso de Uso Real */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-8 md:p-12 rounded-2xl border">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-green-600 text-white p-3 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Caso Real: Carlos Eduardo - Região Sul</h3>
              <p className="text-muted-foreground">
                "Antes do Sirius, eu tinha uma planilha gigante e perdia vendas porque esquecia de ligar para os clientes no momento certo.
                Agora, o sistema me avisa quando cada cliente está pronto para recomprar.
                <span className="font-semibold text-foreground"> Minhas vendas subiram 48% em 6 meses</span>. E o melhor: acesso tudo no celular, na rua."
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                — Carlos Eduardo, Representante Comercial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Diferencial Mobile */}
      <section className="bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-zinc-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Smartphone className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Acesse de Qualquer Lugar
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              O Sirius funciona perfeitamente no celular. Registre pedidos, consulte histórico de clientes e planeje rotas direto do seu smartphone.
              <span className="font-semibold text-foreground"> Feito para quem trabalha na rua</span>.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para aumentar suas comissões?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Comece grátis hoje. Sem cartão de crédito, sem limite de tempo.
          </p>
          <a
            href="/vendas-automaticas?origem=calc-representantes"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
          >
            Começar Grátis Agora
          </a>
          <p className="text-sm text-muted-foreground mt-4">
            50 clientes grátis para sempre • Cancele quando quiser
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
