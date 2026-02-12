import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, Bell, Target, TrendingUp, ArrowLeft, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sistema de Follow-up Inteligente | Sirius CRM',
  description: 'Nunca mais perca um follow-up. Sistema automático de lembretes e acompanhamento de leads com IA integrada.',
  keywords: ['follow-up', 'lembretes', 'automação vendas', 'alertas', 'crm'],
  openGraph: {
    title: 'Sistema de Follow-up Inteligente | Sirius CRM',
    description: 'Nunca mais perca um follow-up. Sistema automático de lembretes e acompanhamento de leads com IA.',
    url: 'https://sirius.roilabs.com.br/followup',
    images: [{
      url: 'https://sirius.roilabs.com.br/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Sirius CRM - CRM Inteligente para Vendedores Brasileiros',
    }],
  },
}

export default function FollowupPage() {
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
        "name": "Follow-up",
        "item": "https://sirius.roilabs.com.br/followup"
      }
    ]
  }

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-6xl py-12 px-6">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Home
          </Button>
        </Link>

        {/* Hero */}
        <div className="text-center mb-16">
          <Bell className="h-20 w-20 mx-auto mb-6 text-primary" />
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Follow-up Automático que <span className="text-primary">Converte</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Pare de perder vendas por esquecimento. O Sirius CRM te lembra automaticamente quando fazer follow-up com cada lead, no momento certo.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/proposta">
                Falar com Vendas
              </Link>
            </Button>
          </div>
        </div>

        {/* Problema */}
        <div className="mb-16">
          <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                📉 O Custo do Esquecimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-4">
                <strong>67% dos leads são perdidos</strong> por falta de follow-up adequado.
                Vendedores deixam de ganhar em média <strong className="text-red-600 dark:text-red-400">R$ 28.000 por mês</strong> por esquecerem de retornar contatos.
              </p>
              <p className="text-muted-foreground">
                A maioria dos vendedores depende da memória ou anotações em papel.
                Resultado: leads esquecem, o timing é perdido e a concorrência fecha primeiro.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Como Funciona */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Como o Follow-up Inteligente Funciona
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl mb-4">
                  1
                </div>
                <CardTitle>Lembretes Automáticos</CardTitle>
                <CardDescription>
                  O sistema analisa cada lead e sugere quando fazer o próximo contato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Notificações push no momento certo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Priorização inteligente por probabilidade</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Histórico completo de interações</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl mb-4">
                  2
                </div>
                <CardTitle>IA Preditiva</CardTitle>
                <CardDescription>
                  Nossa IA aprende com seus melhores fechamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Identifica padrões de sucesso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Sugere melhor momento para contato</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Alerta leads em risco de perda</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl mb-4">
                  3
                </div>
                <CardTitle>Execução Simples</CardTitle>
                <CardDescription>
                  1 clique para WhatsApp, email ou ligação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>WhatsApp integrado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Templates de mensagem personalizáveis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Registro automático de tentativas</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resultados */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Resultados Comprovados
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <div className="text-4xl font-bold text-green-500 mb-2">+34%</div>
                <p className="text-sm text-muted-foreground">
                  Aumento na taxa de conversão
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <div className="text-4xl font-bold text-blue-500 mb-2">2.5h</div>
                <p className="text-sm text-muted-foreground">
                  Economizadas por dia
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <div className="text-4xl font-bold text-purple-500 mb-2">0%</div>
                <p className="text-sm text-muted-foreground">
                  Leads esquecidos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <div className="text-4xl font-bold text-green-500 mb-2">87%</div>
                <p className="text-sm text-muted-foreground">
                  Follow-ups realizados no prazo
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Final */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Pronto para Parar de Perder Vendas?
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
              Comece gratuitamente e veja seus follow-ups se transformarem em vendas fechadas.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">
                  Começar Grátis Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="text-sm mt-4 opacity-75">
              Sem cartão de crédito • Cancele quando quiser
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}
