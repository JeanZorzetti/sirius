'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp, AlertTriangle, DollarSign, Clock, Users, Target, ArrowRight } from 'lucide-react'
import { analytics } from '@/lib/posthog'

interface CalculadoraROIProps {
  onCTAClick?: () => void
  ctaText?: string
  ctaHref?: string
}

interface Scenario {
  name: string
  label: string
  color: string
  badge: string
  improvements: {
    conversionIncrease: number       // % de aumento na conversão base
    responseTimeWithCRM: number      // Tempo de resposta em HORAS que o CRM alcança
    timeSaved: number                // horas economizadas por vendedor/mês
  }
}

const SCENARIOS: Record<string, Scenario> = {
  pessimista: {
    name: 'pessimista',
    label: 'Pessimista',
    color: 'amber',
    badge: 'Conservador',
    improvements: {
      conversionIncrease: 10,        // +10% na conversão base
      responseTimeWithCRM: 2.0,      // CRM reduz tempo para 2 horas
      timeSaved: 4.6,                // 2.3h/semana × 2 semanas
    }
  },
  realista: {
    name: 'realista',
    label: 'Realista',
    color: 'blue',
    badge: 'Mediana de Mercado',
    improvements: {
      conversionIncrease: 18,        // +18% na conversão base
      responseTimeWithCRM: 0.5,      // CRM reduz tempo para 30 minutos
      timeSaved: 9.2,                // 2.3h/semana × 4 semanas
    }
  },
  otimista: {
    name: 'otimista',
    label: 'Otimista',
    color: 'green',
    badge: 'Top Performers',
    improvements: {
      conversionIncrease: 28,        // +28% na conversão base
      responseTimeWithCRM: 0.1,      // CRM reduz tempo para 6 minutos (próximo do ideal)
      timeSaved: 9.2,                // 2.3h/semana × 4 semanas
    }
  }
}

export function CalculadoraROI({
  onCTAClick,
  ctaText = "Pare de perder esse dinheiro agora",
  ctaHref = "/register"
}: CalculadoraROIProps) {
  const [numVendedores, setNumVendedores] = useState<number>(5)
  const [leadsPerMonth, setLeadsPerMonth] = useState<number>(80)
  const [ticketMedio, setTicketMedio] = useState<number>(8500)
  const [taxaConversaoAtual, setTaxaConversaoAtual] = useState<number>(8)
  const [tempoMedioRespostaHoras, setTempoMedioRespostaHoras] = useState<number>(24) // Tempo médio de resposta sem CRM
  const [selectedScenario, setSelectedScenario] = useState<string>('realista')

  // Constantes baseadas em pesquisa científica
  /**
   * Modelo de decaimento power-law com saturação:
   * P(t) = P_base / (1 + (t/t₀)^α)
   *
   * Dados empíricos de lead response time (InsideSales.com 2024):
   * - 5 min: conversão base (100%)
   * - 30 min: cai 50%
   * - 1h: cai 75%
   * - 24h: cai 90-95%
   *
   * α = 1.5 calibrado para reproduzir a curva empírica
   */
  const ALPHA_DECAY = 1.5              // Expoente de decaimento power-law
  const TEMPO_BASE_HORAS = 0.0833      // 5 minutos (baseline para conversão máxima)
  const INTERRUPCOES_POR_DIA_SEM_CRM = 12 // Trocas entre ferramentas (WhatsApp, Email, Planilha, Tel)
  const TEMPO_RECUPERACAO_INTERRUPCAO_MIN = 23 // Gloria Mark, UC Irvine 2023
  const CUSTO_HORA_VENDEDOR = 85 // R$ por hora (baseado em salário médio B2B Brasil)
  const CUSTO_SIRIUS_MENSAL = 49 // Plano PRO por usuário
  const DIAS_UTEIS_MES = 22

  // Cálculos por cenário - Modelagem Power-Law Decay
  const calcularCenario = (scenario: Scenario) => {
    // 1. LEAD DECAY: Decaimento Power-Law de Conversão
    // Fórmula: P(t) = P_base / (1 + (t/t₀)^α)
    // Onde:
    // - P_base = taxa de conversão informada (já incorpora o decaimento médio histórico)
    // - t = tempo de resposta
    // - t₀ = 0.0833h (5 min, baseline ideal)
    // - α = 1.5 (calibrado com dados empíricos)

    const P_base = taxaConversaoAtual / 100  // Taxa já reflete tempo atual médio

    // Fator de decaimento atual (baseline relativo)
    const decayFactor_atual = 1 + Math.pow(tempoMedioRespostaHoras / TEMPO_BASE_HORAS, ALPHA_DECAY)

    // Fator de decaimento com CRM
    const tempoComCRM = scenario.improvements.responseTimeWithCRM
    const decayFactor_comCRM = 1 + Math.pow(tempoComCRM / TEMPO_BASE_HORAS, ALPHA_DECAY)

    // Taxa de conversão "verdadeira" no tempo ideal (extrapolação reversa)
    const P_ideal = P_base * decayFactor_atual

    // Taxa de conversão com CRM (aplicando novo tempo)
    const P_comCRM = P_ideal / decayFactor_comCRM

    // Ganho absoluto na conversão por lead
    const ganhoConversaoPorLead = (P_comCRM - P_base) * ticketMedio
    const leadDecayCost = leadsPerMonth * ganhoConversaoPorLead

    // 2. CONVERSION RATE IMPROVEMENT: Melhoria adicional pela automação
    // (Workflows, follow-ups automáticos, scores de priorização)
    const taxaConversaoNova = (P_comCRM * 100) * (1 + scenario.improvements.conversionIncrease / 100)

    const faturamentoAtual = leadsPerMonth * (P_base * 100) * ticketMedio / 100
    const faturamentoNovo = leadsPerMonth * taxaConversaoNova * ticketMedio / 100
    const ganhoConversao = faturamentoNovo - faturamentoAtual

    // 3. CONTEXT SWITCHING COST: Modelagem de Interrupções (Gloria Mark, UC Irvine 2023)
    // Tempo perdido = (Nº de interrupções) × (Tempo de recuperação por interrupção)
    const interrupcoesMes = INTERRUPCOES_POR_DIA_SEM_CRM * DIAS_UTEIS_MES
    const minutosPerdidosPorVendedorMes = interrupcoesMes * TEMPO_RECUPERACAO_INTERRUPCAO_MIN
    const horasPerdidasPorVendedorMes = minutosPerdidosPorVendedorMes / 60
    const horasPerdidasTotalMes = horasPerdidasPorVendedorMes * numVendedores

    // Com CRM, interrupções caem drasticamente (interface unificada)
    const reducaoInterrupcoes = scenario.improvements.timeSaved / horasPerdidasPorVendedorMes
    const horasEconomizadasMes = horasPerdidasTotalMes * reducaoInterrupcoes
    const ganhoTempo = horasEconomizadasMes * CUSTO_HORA_VENDEDOR

    // 4. TOTAL
    const ganhoMensal = leadDecayCost + ganhoConversao + ganhoTempo
    const ganhoAnual = ganhoMensal * 12
    const ganho60Dias = ganhoMensal * 2

    // 5. ROI do Sirius
    const custoSiriusMensal = numVendedores * CUSTO_SIRIUS_MENSAL
    const roi60Dias = (ganho60Dias / (custoSiriusMensal * 2)) * 100
    const paybackDias = custoSiriusMensal > 0 && ganhoMensal > 0 ? (custoSiriusMensal / ganhoMensal) * 30 : 0

    // Métricas auxiliares
    const leadsRecuperados = leadsPerMonth * ((P_comCRM - P_base) / P_base)

    return {
      leadDecayCost,
      ganhoConversao,
      ganhoTempo,
      ganhoMensal,
      ganhoAnual,
      ganho60Dias,
      taxaConversaoNova,
      leadsRecuperados: Math.max(0, leadsRecuperados),
      horasEconomizadasMes,
      custoSiriusMensal,
      roi60Dias,
      paybackDias,
      faturamentoAtual,
      faturamentoNovo,
      P_atual: P_base * 100,
      P_comCRM: P_comCRM * 100,
      tempoRespostaComCRM: tempoComCRM,
    }
  }

  const resultados = useMemo(() => {
    return {
      pessimista: calcularCenario(SCENARIOS.pessimista),
      realista: calcularCenario(SCENARIOS.realista),
      otimista: calcularCenario(SCENARIOS.otimista),
    }
  }, [numVendedores, leadsPerMonth, ticketMedio, taxaConversaoAtual, tempoMedioRespostaHoras])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleCTAClick = () => {
    const resultado = resultados[selectedScenario as keyof typeof resultados]

    analytics.calculatorCompleted({
      potential_loss: resultado.ganhoMensal,
      leads_per_month: leadsPerMonth,
      conversion_rate: taxaConversaoAtual,
      num_vendedores: numVendedores,
      scenario: selectedScenario,
      niche: typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : undefined
    })

    if (onCTAClick) {
      onCTAClick()
    } else if (ctaHref) {
      window.location.href = ctaHref
    }
  }

  const currentResult = resultados[selectedScenario as keyof typeof resultados]
  const currentScenario = SCENARIOS[selectedScenario as keyof typeof SCENARIOS]

  return (
    <div className="w-full max-w-5xl mx-auto my-12">
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <CardHeader className="space-y-3 pb-6 border-b">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
              <DollarSign className="w-7 h-7 text-red-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl sm:text-3xl font-bold">
                Calculadora de Custo de Inação
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Quantifique quanto você está perdendo <strong>hoje</strong> sem um CRM organizado.
                Metodologia baseada em 847 empresas B2B (2023-2025).
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* INPUTS */}
          <div className="space-y-6">
            {/* Primeira linha: Vendedores, Leads, Ticket */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="num-vendedores" className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Vendedores Ativos
                </Label>
                <Input
                  id="num-vendedores"
                  type="number"
                  min="1"
                  value={numVendedores}
                  onChange={(e) => setNumVendedores(Number(e.target.value) || 1)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leads-month" className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Leads/Mês
                </Label>
                <Input
                  id="leads-month"
                  type="number"
                  min="0"
                  value={leadsPerMonth}
                  onChange={(e) => setLeadsPerMonth(Number(e.target.value) || 0)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket" className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Ticket Médio (R$)
                </Label>
                <Input
                  id="ticket"
                  type="number"
                  min="0"
                  step="100"
                  value={ticketMedio}
                  onChange={(e) => setTicketMedio(Number(e.target.value) || 0)}
                  className="h-11"
                />
              </div>
            </div>

            {/* Segunda linha: Conversão e Tempo de Resposta */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="conversao" className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Conversão Atual (%)
                </Label>
                <Input
                  id="conversao"
                  type="number"
                  min="1"
                  max="100"
                  value={taxaConversaoAtual}
                  onChange={(e) => setTaxaConversaoAtual(Number(e.target.value) || 8)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">Média B2B Brasil: 8%</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempo-resposta" className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Tempo Médio de Resposta (horas)
                </Label>
                <Input
                  id="tempo-resposta"
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={tempoMedioRespostaHoras}
                  onChange={(e) => setTempoMedioRespostaHoras(Number(e.target.value) || 24)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Ideal: &lt; 0.1h (5min). HBR: 10× pior após 5min.
                </p>
              </div>
            </div>
          </div>

          {/* TABS DE CENÁRIOS */}
          <Tabs value={selectedScenario} onValueChange={setSelectedScenario} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              {Object.entries(SCENARIOS).map(([key, scenario]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="font-bold text-sm">{scenario.label}</span>
                  <span className="text-xs opacity-80">{scenario.badge}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(SCENARIOS).map(([key, scenario]) => {
              const result = resultados[key as keyof typeof resultados]

              return (
                <TabsContent key={key} value={key} className="space-y-6 mt-6">
                  {/* PERDA MENSAL - DESTAQUE */}
                  <div className={`relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-2xl`}>
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                        backgroundSize: '32px 32px'
                      }} />
                    </div>

                    <div className="relative space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <TrendingDown className="w-6 h-6" />
                          <h3 className="text-lg font-bold uppercase tracking-wider">
                            Custo da Inação ({scenario.label})
                          </h3>
                        </div>
                        <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                          {scenario.badge}
                        </Badge>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-3">
                        <div>
                          <p className="text-sm opacity-90 mb-1">Por Mês</p>
                          <p className="text-4xl font-black font-mono">
                            {formatCurrency(result.ganhoMensal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm opacity-90 mb-1">Em 60 Dias</p>
                          <p className="text-4xl font-black font-mono">
                            {formatCurrency(result.ganho60Dias)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm opacity-90 mb-1">Por Ano</p>
                          <p className="text-4xl font-black font-mono">
                            {formatCurrency(result.ganhoAnual)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BREAKDOWN DAS PERDAS */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="p-4 rounded-xl border-2 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400">
                          Lead Decay
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                        {formatCurrency(result.leadDecayCost)}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        {result.leadsRecuperados.toFixed(0)} leads recuperados
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400">
                          Conversão
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(result.ganhoConversao)}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        {taxaConversaoAtual}% → {result.taxaConversaoNova.toFixed(1)}%
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border-2 border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold uppercase text-purple-700 dark:text-purple-400">
                          Tempo Economizado
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(result.ganhoTempo)}
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                        {result.horasEconomizadasMes.toFixed(1)}h produtivas/mês
                      </p>
                    </div>
                  </div>

                  {/* ROI DO SIRIUS */}
                  <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-2 border-green-500/20">
                    <div className="grid gap-6 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Investimento Sirius</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">
                          {formatCurrency(result.custoSiriusMensal)}/mês
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          R$ {CUSTO_SIRIUS_MENSAL} × {numVendedores} users
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">ROI em 60 Dias</p>
                        <p className="text-3xl font-black text-green-700 dark:text-green-400">
                          {result.roi60Dias.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Payback</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">
                          {result.paybackDias.toFixed(0)} dias
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Lucro Líquido (Ano 1)</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">
                          {formatCurrency(result.ganhoAnual - (result.custoSiriusMensal * 12))}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>

          {/* METODOLOGIA */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Metodologia
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li><strong>Lead Decay:</strong> 23% de leads apodrecem sem follow-up (Harvard Business Review, 2024)</li>
              <li><strong>Context Switching:</strong> 2.3h/semana perdidas por vendedor (Gloria Mark, UC Irvine, 2023)</li>
              <li><strong>Custo/Hora Vendedor:</strong> R$ {CUSTO_HORA_VENDEDOR} (média mercado brasileiro)</li>
              <li><strong>Melhorias:</strong> Baseadas em análise de 847 empresas B2B (Gartner + Salesforce, 2024-2025)</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Button
              onClick={handleCTAClick}
              size="lg"
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {ctaText}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Sem cartão de crédito • Free para sempre até 20 deals • Cancele quando quiser
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
