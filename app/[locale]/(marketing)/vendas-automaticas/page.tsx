import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  X,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  Users,
  CreditCard,
  ArrowRight,
  Sparkles,
  ChevronDown,
  DollarSign
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { buildLocaleAlternates, DEFAULT_OG_IMAGES } from '@/lib/seo/canonical'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.vendasAutomaticas.meta' })
  const alternates = buildLocaleAlternates(locale, '/vendas-automaticas', '/automated-sales')
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: {
      images: DEFAULT_OG_IMAGES,
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

export default function VendasAutomaticasPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://siriuscrm.com.br"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Vendas Automáticas",
        "item": "https://siriuscrm.com.br/vendas-automaticas"
      }
    ]
  }

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Sirius CRM",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "67",
      "priceCurrency": "BRL",
      "priceValidUntil": "2027-12-31",
      "availability": "https://schema.org/InStock"
    },
    "description": "CRM self-service para organizar vendas em 5 minutos. Pipeline visual, automações e WhatsApp integrado.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "12"
    }
  }

  return (
    <>
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-200">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="container mx-auto px-4 py-16 sm:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <Badge className="bg-muted text-foreground border-border px-4 py-1.5 text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Sem Reuniões • Sem Treinamento • Sem Implantação
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Seu Processo de Vendas{' '}
              <span className="text-foreground">
                Organizado
              </span>
              <br />
              em 5 Minutos.
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-zinc-600 max-w-3xl mx-auto leading-relaxed">
              Sem falar com vendedores. Sem reuniões de implantação.{' '}
              <strong className="text-zinc-900 font-semibold">
                Apenas crie sua conta e comece.
              </strong>
            </p>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                <Link href="/register">
                  Começar Grátis (Sem Limite de Tempo)
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg font-semibold border-2"
              >
                <Link href="/ferramentas/calculadora-roi">
                  Ver Quanto Estou Perdendo
                </Link>
              </Button>
            </div>

            {/* Trust Signal */}
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
              <Shield className="w-4 h-4 text-foreground" />
              <span>
                <strong className="text-zinc-900 font-semibold">
                  Não pedimos cartão de crédito
                </strong>{' '}
                para testar
              </span>
            </div>

            {/* Social Proof */}
            <div className="pt-8 flex items-center justify-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">50+</div>
                <div className="text-zinc-600">Empresas Ativas</div>
              </div>
              <div className="w-px h-10 bg-zinc-300" />
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">R$ 67</div>
                <div className="text-zinc-600">Por Mês</div>
              </div>
              <div className="w-px h-10 bg-zinc-300" />
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">5 min</div>
                <div className="text-zinc-600">Para Começar</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-zinc-400" />
        </div>
      </section>

      {/* Comparação - Ancoragem de Preço */}
      <section className="py-16 sm:py-24 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Por Que Empresas Estão{' '}
                <span className="text-foreground">Abandonando</span>{' '}
                CRMs Tradicionais?
              </h2>
              <p className="text-lg text-zinc-600">
                Compare você mesmo e entenda por que o self-service é o futuro.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* CRM Tradicional */}
              <Card className="border-2 border-border bg-muted">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl">CRM Tradicional</CardTitle>
                    <Badge variant="destructive" className="text-xs text-primary-foreground">Ultrapassado</Badge>
                  </div>
                  <div className="text-3xl font-bold text-destaque">
                    R$ 500+
                    <span className="text-base font-normal text-zinc-600">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destaque shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-900">Implantação Cara</p>
                      <p className="text-sm text-zinc-600">
                        R$ 2.000+ de setup inicial + consultoria obrigatória
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destaque shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-900">Consultor Chato</p>
                      <p className="text-sm text-zinc-600">
                        Reuniões infinitas, treinamentos forçados, "melhorias" que ninguém pediu
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destaque shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-900">Complexidade Desnecessária</p>
                      <p className="text-sm text-zinc-600">
                        Centenas de funcionalidades que você nunca vai usar
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destaque shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-900">Contrato Longo</p>
                      <p className="text-sm text-zinc-600">
                        Mínimo 12 meses, multa para cancelar
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destaque shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-900">Demora para Começar</p>
                      <p className="text-sm text-zinc-600">
                        2-4 semanas até estar funcionando
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sirius Self-Service */}
              <Card className="border-2 border-border shadow-xl relative">
                {/* Badge "Recomendado" */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded bg-destaque text-primary-foreground text-sm font-bold">
                  ✨ Recomendado
                </div>

                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl">Sirius Self-Service</CardTitle>
                    <Badge className="bg-muted text-foreground text-xs">
                      Moderno
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    R$ 67
                    <span className="text-base font-normal text-zinc-600">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-900">Pronto na Hora</p>
                      <p className="text-sm text-zinc-600">
                        Crie sua conta e comece em 5 minutos. Zero setup.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-900">Você no Controle</p>
                      <p className="text-sm text-zinc-600">
                        Sem consultor te enrolando. Configure do seu jeito.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-900">Simples e Direto</p>
                      <p className="text-sm text-zinc-600">
                        Apenas o essencial para organizar vendas. Nada de firula.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-900">Cancele Quando Quiser</p>
                      <p className="text-sm text-zinc-600">
                        1 clique. Sem multa. Sem burocracia.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-900">Use Hoje Mesmo</p>
                      <p className="text-sm text-zinc-600">
                        Cadastrou? Já está vendendo melhor.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA após comparação */}
            <div className="text-center mt-12">
              <p className="text-lg text-zinc-600 mb-6">
                A escolha é óbvia. Pare de pagar caro por complicação.
              </p>
              <Button
                asChild
                size="lg"
                className="h-12 px-8"
              >
                <Link href="/register">
                  Começar Agora por R$ 67/mês
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Preview do Produto */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-muted text-foreground">
                Veja Como Funciona
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Seu Funil de Vendas{' '}
                <span className="text-foreground">Visual</span>
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Arraste, solte, organize. É tão simples que você vai aprender sozinho.
              </p>
            </div>

            {/* Screenshot/Preview do Kanban */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-zinc-200 shadow-2xl">
              {/* Placeholder - você pode substituir por screenshot real ou componente interativo */}
              <div className="p-8 aspect-video flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Pipeline Kanban</h3>
                    <p className="text-zinc-600">
                      Visualize todas as negociações em um funil interativo
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center pt-4">
                    <div className="px-4 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-semibold">
                      Novo Lead
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-semibold">
                      Qualificação
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-semibold">
                      Proposta
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-muted border border-border text-sm font-semibold text-foreground">
                      Fechado
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefícios Visuais */}
            <div className="grid sm:grid-cols-3 gap-6 mt-12">
              <div className="text-center p-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center">
                  <Zap className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="font-bold mb-2">Arraste e Solte</h3>
                <p className="text-sm text-zinc-600">
                  Mova deals entre etapas com um clique
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center">
                  <Users className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="font-bold mb-2">Leads Ilimitados</h3>
                <p className="text-sm text-zinc-600">
                  Cadastre quantos contatos quiser
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center">
                  <Clock className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="font-bold mb-2">Follow-up Automático</h3>
                <p className="text-sm text-zinc-600">
                  Nunca mais esqueça de um cliente
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Preço */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-muted text-foreground">
                Preço Justo
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Tudo Que Você Precisa.{' '}
                <span className="text-foreground">
                  Um Preço Honesto.
                </span>
              </h2>
              <p className="text-lg text-zinc-600">
                Sem pegadinhas. Sem planos escondidos. Apenas R$ 67/mês.
              </p>
            </div>

            {/* Card de Preço */}
            <Card className="max-w-lg mx-auto border-2 border-border shadow-2xl relative overflow-hidden">
              {/* Badge "Mais Popular" */}
              <div className="absolute top-0 right-0 bg-destaque text-primary-foreground text-xs font-bold px-4 py-2 rounded-bl-lg">
                MAIS POPULAR
              </div>

              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-3xl mb-2">Plano PRO</CardTitle>
                <div className="px-6 py-2 mb-4 rounded-lg bg-muted border border-border">
                  <p className="text-sm font-semibold text-foreground">
                    ✨ Comece Grátis: 50 contatos + 3 pipelines sem limite de tempo
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-black text-foreground">R$ 67</span>
                    <span className="text-xl text-zinc-600">/mês</span>
                  </div>
                  <p className="text-sm text-zinc-600">
                    Quando precisar de mais • Sem setup • Sem contrato
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pb-8">
                {/* Benefícios */}
                <div className="space-y-4">
                  {[
                    'Leads e Contatos Ilimitados',
                    'Pipeline Kanban Visual',
                    'Importação de Excel/CSV',
                    'Integração WhatsApp',
                    'Relatórios e Gráficos',
                    'Tarefas e Follow-ups',
                    'Aplicativo Mobile (PWA)',
                    'Suporte por Email'
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                        <Check className="w-3 h-3 text-foreground" />
                      </div>
                      <span className="text-sm font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  asChild
                  size="lg"
                  className="w-full h-14 text-lg font-bold shadow-xl"
                >
                  <Link href="/register">
                    <DollarSign className="mr-2 w-5 h-5" />
                    Começar Agora por R$ 67/mês
                  </Link>
                </Button>

                {/* Garantia */}
                <div className="text-center p-4 rounded-xl bg-muted border border-border">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-foreground" />
                    <span className="font-bold text-foreground">
                      Garantia de Satisfação
                    </span>
                  </div>
                  <p className="text-sm text-foreground">
                    Cancele com 1 clique quando quiser. Sem multa, sem burocracia.
                  </p>
                </div>

                {/* Trust Signals */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <CreditCard className="w-6 h-6 mx-auto mb-1 text-zinc-400" />
                    <p className="text-xs text-zinc-600">Sem cartão para testar</p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-6 h-6 mx-auto mb-1 text-zinc-400" />
                    <p className="text-xs text-zinc-600">Dados seguros</p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-6 h-6 mx-auto mb-1 text-zinc-400" />
                    <p className="text-xs text-zinc-600">Cancele a qualquer momento</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ROI Calculator CTA */}
            <div className="text-center mt-12 p-6 rounded-xl bg-muted border border-border">
              <p className="text-lg font-semibold mb-4">
                💡 Descubra quanto você está perdendo sem um CRM organizado
              </p>
              <Button
                asChild
                variant="outline"
                className="border-border text-foreground hover:bg-muted"
              >
                <Link href="/ferramentas/calculadora-roi">
                  Calcular Meu Vazamento de Vendas
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - Matador de Objeções */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Perguntas Frequentes
              </h2>
              <p className="text-lg text-zinc-600">
                Respostas diretas. Sem enrolação.
              </p>
            </div>

            <div className="space-y-6">
              {/* FAQ 1 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Preciso de treinamento para usar?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600">
                    <strong className="text-zinc-900">Não.</strong> O Sirius é tão intuitivo que você aprende sozinho.
                    Assim que criar sua conta, oferecemos um tour rápido de 2 minutos mostrando o básico.
                    Depois disso, é só usar. Se surgir dúvida, nossa central de ajuda tem vídeos curtos e diretos.
                  </p>
                </CardContent>
              </Card>

              {/* FAQ 2 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Consigo importar meus contatos atuais?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600">
                    <strong className="text-zinc-900">Sim!</strong> Você pode importar seus contatos de:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600">
                    <li>Planilhas Excel (.xlsx, .xls)</li>
                    <li>Arquivos CSV</li>
                    <li>Google Contacts (em breve)</li>
                  </ul>
                  <p className="text-zinc-600 mt-2">
                    O processo leva menos de 3 minutos. Upload, mapeie as colunas, pronto.
                  </p>
                </CardContent>
              </Card>

              {/* FAQ 3 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    E se eu não gostar? Como cancelo?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600">
                    <strong className="text-zinc-900">1 clique.</strong> Acesse Configurações → Assinatura → Cancelar.
                    Não pedimos motivo, não tentamos te convencer a ficar, não cobramos multa.
                    Você cancela na hora e seus dados ficam disponíveis para exportação por 30 dias.
                  </p>
                  <p className="text-zinc-600 mt-2">
                    Sem burocracia. Sem ligação de "retenção". Sem email pedindo para voltar.
                  </p>
                </CardContent>
              </Card>

              {/* FAQ 4 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Meus dados estão seguros?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600">
                    <strong className="text-zinc-900">Absolutamente.</strong> Usamos:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600">
                    <li>Criptografia SSL/TLS em todas as conexões</li>
                    <li>Backup automático diário</li>
                    <li>Servidores no Brasil (conformidade LGPD)</li>
                    <li>Autenticação de dois fatores disponível</li>
                  </ul>
                  <p className="text-zinc-600 mt-2">
                    Seus dados são seus. Nunca vendemos ou compartilhamos com terceiros.
                  </p>
                </CardContent>
              </Card>

              {/* FAQ 5 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    R$ 67/mês é para sempre ou aumenta depois?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600">
                    <strong className="text-zinc-900">R$ 67/mês é o preço.</strong> Não tem "promoção de lançamento" que aumenta depois.
                    Não temos planos escondidos com recursos básicos bloqueados.
                  </p>
                  <p className="text-zinc-600 mt-2">
                    No futuro, podemos lançar um plano PRO com recursos avançados (IA, automações complexas),
                    mas o plano de R$ 67 continuará existindo com tudo que você precisa para organizar vendas.
                  </p>
                </CardContent>
              </Card>

              {/* FAQ 6 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Funciona no celular?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600">
                    <strong className="text-zinc-900">Sim!</strong> O Sirius é um Progressive Web App (PWA).
                    Isso significa que você pode:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600">
                    <li>Adicionar à tela inicial do seu celular (como um app nativo)</li>
                    <li>Usar offline (sincroniza quando voltar a conexão)</li>
                    <li>Receber notificações push de novos leads</li>
                  </ul>
                  <p className="text-zinc-600 mt-2">
                    Funciona perfeitamente em iOS e Android.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Pare de Perder Vendas.{' '}
              <br className="hidden sm:block" />
              Comece Hoje.
            </h2>

            <p className="text-xl text-primary-foreground">
              Junte-se a 50+ empresas que organizaram suas vendas com o Sirius.{' '}
              Sem burocracia, sem complicação.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-lg font-bold bg-white text-foreground hover:bg-muted"
              >
                <Link href="/register">
                  Criar Minha Conta Grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg font-semibold border-2 border-white bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/ferramentas/calculadora-roi">
                  Calcular Meu ROI
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-primary-foreground pt-4">
              <Shield className="w-4 h-4" />
              <span>Sem cartão • Sem contrato • Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
