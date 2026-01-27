'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { TrendingDown, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react'

interface CalculadoraROIProps {
  onCTAClick?: () => void
  ctaText?: string
  ctaHref?: string
}

export function CalculadoraROI({
  onCTAClick,
  ctaText = "Pare de perder esse dinheiro agora",
  ctaHref = "/cadastro"
}: CalculadoraROIProps) {
  const [volumeLeads, setVolumeLeads] = useState<number>(100)
  const [ticketMedio, setTicketMedio] = useState<number>(500)
  const [taxaConversao, setTaxaConversao] = useState<number>(10)

  // Cálculos
  const resultados = useMemo(() => {
    const faturamentoAtual = volumeLeads * (taxaConversao / 100) * ticketMedio

    // Cenário otimizado: melhoria de 20% na taxa de conversão
    const taxaOtimizada = taxaConversao * 1.2
    const faturamentoOtimizado = volumeLeads * (taxaOtimizada / 100) * ticketMedio

    const perdaMensal = faturamentoOtimizado - faturamentoAtual
    const perdaAnual = perdaMensal * 12

    // ROI do Sirius (supondo R$ 49/mês)
    const custoSirius = 49
    const roiMensal = perdaMensal / custoSirius
    const roiPrimeirasSemanas = (perdaMensal / 4) / custoSirius // ROI na primeira semana

    return {
      faturamentoAtual,
      faturamentoOtimizado,
      perdaMensal,
      perdaAnual,
      taxaOtimizada,
      roiMensal,
      roiPrimeirasSemanas
    }
  }, [volumeLeads, ticketMedio, taxaConversao])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const handleCTAClick = () => {
    if (onCTAClick) {
      onCTAClick()
    } else if (ctaHref) {
      window.location.href = ctaHref
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">
                Calculadora de Vazamento de Vendas
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1">
                Descubra quanto dinheiro está escapando do seu funil todos os meses
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Inputs */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Volume de Leads */}
            <div className="space-y-3">
              <Label htmlFor="volume-leads" className="text-base font-semibold">
                Volume de Leads/mês
              </Label>
              <Input
                id="volume-leads"
                type="number"
                min="0"
                value={volumeLeads}
                onChange={(e) => setVolumeLeads(Number(e.target.value) || 0)}
                className="text-lg h-12"
                placeholder="Ex: 100"
              />
              <p className="text-xs text-muted-foreground">
                Quantos leads você recebe por mês?
              </p>
            </div>

            {/* Ticket Médio */}
            <div className="space-y-3">
              <Label htmlFor="ticket-medio" className="text-base font-semibold">
                Ticket Médio (R$)
              </Label>
              <Input
                id="ticket-medio"
                type="number"
                min="0"
                step="0.01"
                value={ticketMedio}
                onChange={(e) => setTicketMedio(Number(e.target.value) || 0)}
                className="text-lg h-12"
                placeholder="Ex: 500"
              />
              <p className="text-xs text-muted-foreground">
                Valor médio de cada venda
              </p>
            </div>
          </div>

          {/* Taxa de Conversão - Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="taxa-conversao" className="text-base font-semibold">
                Taxa de Conversão Atual
              </Label>
              <span className="text-2xl font-bold text-indigo-500 tabular-nums">
                {taxaConversao}%
              </span>
            </div>
            <Slider
              id="taxa-conversao"
              min={1}
              max={50}
              step={1}
              value={[taxaConversao]}
              onValueChange={(value) => setTaxaConversao(value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Resultados */}
          <div className="space-y-4 pt-6 border-t-2 border-dashed border-zinc-200 dark:border-zinc-800">
            {/* Cenário Atual vs Otimizado */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Faturamento Atual */}
              <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Faturamento Atual
                  </span>
                </div>
                <p className="text-2xl font-bold font-mono text-zinc-700 dark:text-zinc-300">
                  {formatCurrency(resultados.faturamentoAtual)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Com {taxaConversao}% de conversão
                </p>
              </div>

              {/* Faturamento Otimizado */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-2 border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-500">
                    Potencial Organizado
                  </span>
                </div>
                <p className="text-2xl font-bold font-mono text-green-700 dark:text-green-400">
                  {formatCurrency(resultados.faturamentoOtimizado)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  Com {resultados.taxaOtimizada.toFixed(1)}% de conversão
                </p>
              </div>
            </div>

            {/* Perda Mensal - DESTAQUE PRINCIPAL */}
            <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-2xl shadow-red-500/30">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '32px 32px'
                }} />
              </div>

              <div className="relative space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider">
                    Você está perdendo
                  </h3>
                </div>

                <div className="space-y-1">
                  <p className="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight">
                    {formatCurrency(resultados.perdaMensal)}
                  </p>
                  <p className="text-lg sm:text-xl font-semibold opacity-90">
                    todo mês
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2 text-sm opacity-90">
                  <div className="w-1 h-1 rounded-full bg-white" />
                  <span>
                    Isso é <strong className="font-bold">{formatCurrency(resultados.perdaAnual)}</strong> por ano
                  </span>
                </div>
              </div>
            </div>

            {/* ROI do Sirius */}
            <div className="grid gap-3 sm:grid-cols-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground mb-1">Investimento Sirius</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">R$ 49/mês</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground mb-1">ROI Mensal</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {resultados.roiMensal.toFixed(1)}x
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground mb-1">ROI em 1 Semana</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {resultados.roiPrimeirasSemanas.toFixed(1)}x
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-6">
            <Button
              onClick={handleCTAClick}
              size="lg"
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {ctaText}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Sem cartão de crédito necessário • Cancele quando quiser
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
