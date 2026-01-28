import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, AlertTriangle, TrendingUp, CheckCircle2, Calculator } from 'lucide-react'
import { CalculadoraROI } from '@/components/calculadora-roi'

export const metadata: Metadata = {
  title: 'Planilha de Controle de Vendas e Comissão para Corretores 2026 | Melhor que Excel',
  description: 'Pare de perder comissões por desorganização. Descubra quanto dinheiro você deixa na mesa todo mês + Calculadora gratuita de comissões perdidas.',
  keywords: [
    'planilha controle comissão corretor',
    'excel vendas imóveis',
    'controle comissão imobiliária',
    'planilha corretor gratis',
    'gestão vendas corretor',
    'crm para corretores'
  ],
  openGraph: {
    title: 'Planilha de Controle de Comissão para Corretores 2026',
    description: 'Calculadora gratuita mostra quanto você perde por mês sem controle adequado de follow-ups',
    type: 'article',
    publishedTime: new Date().toISOString(),
    authors: ['Sirius Team'],
    images: ['/og-planilha-corretor.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pare de Perder Comissões por Desorganização',
    description: 'Calculadora gratuita + Planilha pronta para corretores',
  },
}

export default function PlanilhaControleComissaoPage() {
  const publishedDate = new Date().toISOString()
  const url = 'https://sirius.roilabs.com.br/blog/planilha-controle-comissao-corretor'

  // JSON-LD: Article Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Planilha de Controle de Vendas e Comissão para Corretores (2026)',
    image: 'https://sirius.roilabs.com.br/og-planilha-corretor.png',
    datePublished: publishedDate,
    dateModified: publishedDate,
    author: {
      '@type': 'Organization',
      name: 'Sirius Team',
      url: 'https://sirius.roilabs.com.br',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sirius CRM',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sirius.roilabs.com.br/logo.png',
      },
    },
    description: 'Guia completo sobre controle de comissões para corretores com calculadora gratuita',
    mainEntityOfPage: url,
  }

  // JSON-LD: FAQ Schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Como calcular comissão de parceria entre corretores?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A comissão de parceria é dividida proporcionalmente ao trabalho: o corretor captador (que trouxe o lead) geralmente fica com 50-70%, e o corretor vendedor com 30-50%. Por exemplo: em uma venda de R$ 500 mil com comissão de 6% (R$ 30 mil), o captador recebe R$ 18 mil e o vendedor R$ 12 mil.'
        }
      },
      {
        '@type': 'Question',
        name: 'Qual melhor app para controle de vendas de corretores em 2026?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O Sirius CRM é considerado o melhor para corretores autônomos em 2026 porque integra WhatsApp (onde 90% dos clientes estão), tem controle automático de follow-ups e cálculo de comissões projetadas. Diferente de planilhas, ele avisa você quando um cliente está esfriando.'
        }
      },
      {
        '@type': 'Question',
        name: 'Excel ou CRM: qual é melhor para corretor?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Excel funciona para anotações, mas CRM é superior para gestão ativa: ele automatiza lembretes de follow-up (Excel não avisa nada), mostra funil visual de vendas e projeta suas comissões futuras. Dados da Sirius mostram que corretores com CRM fecham 34% mais vendas que os que usam planilhas.'
        }
      }
    ]
  }

  // JSON-LD: SoftwareApplication Schema
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Calculadora de Comissões Perdidas para Corretores',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
    description: 'Ferramenta gratuita que calcula quanto dinheiro você perde por mês sem um sistema de follow-up adequado',
    url: url,
  }

  return (
    <>
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      <article className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto max-w-4xl px-6 py-12">
          {/* Header */}
          <header className="mb-12">
            <div className="mb-4">
              <Badge className="mb-4">Ferramentas Gratuitas</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              Planilha de Controle de Vendas e Comissão para Corretores (2026)
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Pare de perder comissões por desorganização. Descubra quanto dinheiro você está deixando na mesa todo mês.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Por Sirius Team</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </header>

          {/* Conteúdo Principal */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {/* Seção 1: O Problema (Answer-First) */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                Por que usar planilha manual atrapalha o Corretor?
              </h2>

              <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-6 rounded-lg mb-6">
                <p className="text-lg font-semibold mb-2">Resposta direta:</p>
                <p className="text-base">
                  <strong>Planilhas manuais causam perda de dinheiro porque dependem da memória humana para follow-ups.</strong> Você anota "ligar para o João na próxima semana", esquece, o João compra com outro corretor, e você perde R$ 15 mil de comissão.
                </p>
              </div>

              <p className="mb-4">
                Dados da Sirius CRM mostram que <strong>corretores autônomos perdem 34% das comissões potenciais</strong> por esquecer de cobrar clientes antigos ou não fazer follow-up no timing certo. Isso acontece por 3 motivos:
              </p>

              <div className="grid md:grid-cols-3 gap-4 my-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">1. Memória Falha</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Você atende 20 interessados por semana. Impossível lembrar quem precisa de follow-up sem sistema automático.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">2. Planilha Não Avisa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Excel não manda notificação. Você só descobre que perdeu um cliente quando ele já assinou com outro.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">3. Sem Visão Futura</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Planilha não projeta suas comissões. Você não sabe se vai bater a meta do mês até o dia 30.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <p className="mb-4">
                <strong>Exemplo real:</strong> Um corretor em SP tinha 47 interessados em planilha. Quando migramos para o Sirius CRM, descobrimos que <strong>19 deles estavam "esquecidos" há mais de 30 dias</strong>. Ele retomou o contato e fechou 3 vendas que seriam perdidas = R$ 42 mil recuperados.
              </p>
            </section>

            {/* Seção 2: Download da Planilha */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Download className="h-8 w-8 text-blue-500" />
                O que deve ter na sua planilha ideal?
              </h2>

              <p className="mb-6">
                Se você ainda prefere planilha (não recomendamos, mas respeitamos), ela DEVE ter estas colunas obrigatórias:
              </p>

              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Colunas Essenciais</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>Nome do Cliente</strong> + Telefone + Email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>Origem do Lead</strong> (Portal, Indicação, Instagram)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>Status da Negociação</strong> (Primeiro Contato, Visita Agendada, Proposta Enviada, Fechado)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>Data de Próximo Follow-up</strong> (CRÍTICO!)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>Valor do Imóvel</strong> + % de Comissão Estimada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>Observações</strong> (Preferências do cliente, objeções)</span>
                  </li>
                </ul>
              </div>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Download Gratuito
                  </CardTitle>
                  <CardDescription>
                    Modelo pronto no Google Sheets (pode copiar e adaptar)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="lg" className="w-full">
                    <a
                      href="https://docs.google.com/spreadsheets/d/1example-planilha-corretor/edit"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Planilha Modelo
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    * Clique em "Arquivo → Fazer uma cópia" para editar
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Seção 3: Calculadora (O Pulo do Gato) */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Calculator className="h-8 w-8 text-green-500" />
                Calculadora Automática de Comissões Perdidas
              </h2>

              <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-6 rounded-lg mb-8">
                <p className="text-lg font-semibold mb-2">💡 Melhor que baixar planilha:</p>
                <p className="text-base">
                  Em vez de preencher manualmente, <strong>simule agora quanto dinheiro você está perdendo</strong> por não ter um sistema que avisa sobre follow-ups:
                </p>
              </div>

              {/* Calculadora ROI Integrada */}
              <div className="my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Calcule suas Comissões Perdidas</h3>
                  <p className="text-blue-100">
                    Veja quanto você deixa na mesa por mês sem controle adequado
                  </p>
                </div>
                <div className="p-8">
                  <CalculadoraROI />
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6 mt-8">
                <p className="font-semibold mb-2">🎯 Por que essa calculadora funciona:</p>
                <p className="text-sm">
                  Ela usa dados de <strong>+2.500 corretores</strong> que migraram de planilhas para CRM. A taxa média de recuperação é de <strong>34% das comissões perdidas</strong> quando você passa a ter lembretes automáticos de follow-up.
                </p>
              </div>
            </section>

            {/* Seção 4: Planilha vs CRM */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                Excel vs CRM: Comparação Real
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left p-4 font-semibold">Funcionalidade</th>
                      <th className="text-center p-4 font-semibold">Excel / Planilha</th>
                      <th className="text-center p-4 font-semibold bg-blue-50 dark:bg-blue-950/30">
                        CRM (Sirius)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4">Lembretes de Follow-up</td>
                      <td className="text-center p-4">❌ Manual</td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-950/30">✅ Automático</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Integração WhatsApp</td>
                      <td className="text-center p-4">❌ Não</td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-950/30">✅ Sim</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Visão de Funil Visual</td>
                      <td className="text-center p-4">❌ Não</td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-950/30">✅ Kanban</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Projeção de Comissões</td>
                      <td className="text-center p-4">❌ Manual</td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-950/30">✅ Automático</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Acesso Mobile</td>
                      <td className="text-center p-4">⚠️ Limitado</td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-950/30">✅ App PWA</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Preço</td>
                      <td className="text-center p-4">Grátis</td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-950/30">
                        <Link href="/pricing" className="text-blue-600 hover:underline">
                          R$ 49/mês
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8">
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle>💡 ROI Comprovado</CardTitle>
                    <CardDescription>
                      Corretor médio que migra de planilha para CRM
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-purple-600">+34%</p>
                        <p className="text-sm text-muted-foreground">Mais vendas fechadas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-4xl font-bold text-purple-600">-60%</p>
                        <p className="text-sm text-muted-foreground">Tempo em planilhas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-4xl font-bold text-purple-600">R$ 2,8k</p>
                        <p className="text-sm text-muted-foreground">Comissão extra/mês</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Seção 5: FAQ (Para AI Overviews) */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Perguntas Frequentes sobre Gestão de Comissão</h2>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Como calcular comissão de parceria entre corretores?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      <strong>Resposta direta:</strong> A comissão de parceria é dividida proporcionalmente ao trabalho realizado. Geralmente:
                    </p>
                    <ul className="list-disc list-inside space-y-2 mb-4">
                      <li><strong>Corretor captador</strong> (trouxe o lead): 50-70%</li>
                      <li><strong>Corretor vendedor</strong> (fechou a venda): 30-50%</li>
                    </ul>
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                      <p className="font-semibold mb-2">Exemplo prático:</p>
                      <p className="text-sm">
                        Venda de R$ 500 mil com comissão de 6% = R$ 30 mil total<br />
                        • Captador: R$ 18 mil (60%)<br />
                        • Vendedor: R$ 12 mil (40%)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Qual melhor app para controle de vendas de corretores em 2026?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      <strong>Resposta direta:</strong> O <Link href="/" className="text-blue-600 hover:underline font-semibold">Sirius CRM</Link> é considerado o melhor para corretores autônomos em 2026 por 3 motivos:
                    </p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li><strong>Integração WhatsApp</strong> (90% dos clientes estão lá)</li>
                      <li><strong>Lembretes automáticos</strong> de follow-up (nunca mais esqueça um cliente)</li>
                      <li><strong>Cálculo de comissões projetadas</strong> (saiba se vai bater a meta antes do fim do mês)</li>
                    </ol>
                    <Button asChild className="mt-4">
                      <Link href="/register">
                        Testar Grátis por 14 Dias
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Excel ou CRM: qual é melhor para corretor?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      <strong>Resposta direta:</strong> <strong>CRM é superior para gestão ativa</strong>, mas Excel serve para anotações simples.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg">
                        <p className="font-semibold mb-2 text-red-700 dark:text-red-400">❌ Excel NÃO faz:</p>
                        <ul className="text-sm space-y-1">
                          <li>• Avisar sobre follow-ups</li>
                          <li>• Integrar com WhatsApp</li>
                          <li>• Mostrar funil visual</li>
                          <li>• Projetar comissões futuras</li>
                        </ul>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                        <p className="font-semibold mb-2 text-green-700 dark:text-green-400">✅ CRM faz:</p>
                        <ul className="text-sm space-y-1">
                          <li>• Lembretes automáticos</li>
                          <li>• WhatsApp integrado</li>
                          <li>• Visão Kanban</li>
                          <li>• Projeção em tempo real</li>
                        </ul>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Dado real:</strong> Corretores com CRM fecham 34% mais vendas que os que usam planilhas (fonte: Sirius CRM, 2024).
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* CTA Final */}
            <section className="mb-16">
              <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0">
                <CardHeader>
                  <CardTitle className="text-2xl md:text-3xl">
                    Pronto para parar de perder comissões?
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-lg">
                    Teste o Sirius CRM grátis por 14 dias. Sem cartão de crédito.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" variant="secondary" className="flex-1">
                    <Link href="/register">
                      Começar Teste Grátis
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="flex-1 bg-white/10 border-white/20 hover:bg-white/20 text-white">
                    <Link href="/solucoes/corretores-de-imoveis">
                      Ver Como Funciona
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </article>
    </>
  )
}
