'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { TrendingDown, TrendingUp, AlertCircle, ArrowRight, Mail, Lock } from 'lucide-react'

interface CalculadoraROIWithLeadCaptureProps {
  onEmailCapture?: (email: string, calculationData: any) => void
  ctaText?: string
  ctaHref?: string
}

/**
 * Versão AVANÇADA da calculadora que captura email antes de mostrar resultado completo
 * Estratégia: Mostrar prévia do cálculo → Pedir email para "desbloquear" resultado detalhado
 */
export function CalculadoraROIWithLeadCapture({
  onEmailCapture,
  ctaText = "Acessar resultado completo",
  ctaHref = "/register"
}: CalculadoraROIWithLeadCaptureProps) {
  const [volumeLeads, setVolumeLeads] = useState<number>(100)
  const [ticketMedio, setTicketMedio] = useState<number>(500)
  const [taxaConversao, setTaxaConversao] = useState<number>(10)

  // Lead capture state
  const [email, setEmail] = useState<string>('')
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false)
  const [showLeadDialog, setShowLeadDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cálculos
  const resultados = useMemo(() => {
    const faturamentoAtual = volumeLeads * (taxaConversao / 100) * ticketMedio
    const taxaOtimizada = taxaConversao * 1.2
    const faturamentoOtimizado = volumeLeads * (taxaOtimizada / 100) * ticketMedio
    const perdaMensal = faturamentoOtimizado - faturamentoAtual
    const perdaAnual = perdaMensal * 12
    const custoSirius = 49
    const roiMensal = perdaMensal / custoSirius
    const roiPrimeirasSemanas = (perdaMensal / 4) / custoSirius

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

  const handleUnlock = () => {
    if (!hasSubmittedEmail) {
      setShowLeadDialog(true)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setIsSubmitting(true)

    // Simula envio para backend/CRM
    if (onEmailCapture) {
      await onEmailCapture(email, {
        volumeLeads,
        ticketMedio,
        taxaConversao,
        perdaMensal: resultados.perdaMensal,
        perdaAnual: resultados.perdaAnual
      })
    }

    // Aqui você pode integrar com:
    // - API de email marketing (Resend, SendGrid)
    // - CRM interno
    // - Google Sheets
    // - Webhook

    setTimeout(() => {
      setIsSubmitting(false)
      setHasSubmittedEmail(true)
      setShowLeadDialog(false)
    }, 1000)
  }

  return (
    <>
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
              </div>

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
            </div>

            {/* Preview do Resultado - Sempre visível (ISCA) */}
            <div className="space-y-4 pt-6 border-t-2 border-dashed border-zinc-200 dark:border-zinc-800">
              {/* Perda Mensal - PREVIEW BLUR */}
              <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-2xl shadow-red-500/30">
                <div className="relative space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider">
                      Você está perdendo
                    </h3>
                  </div>

                  {/* BLUR overlay se não tiver email */}
                  {!hasSubmittedEmail && (
                    <div className="absolute inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-10 rounded-2xl">
                      <div className="text-center space-y-3 p-6">
                        <Lock className="w-12 h-12 mx-auto opacity-80" />
                        <p className="text-sm font-semibold">
                          Digite seu email para ver o resultado completo
                        </p>
                        <Button
                          onClick={handleUnlock}
                          variant="secondary"
                          size="sm"
                          className="bg-white text-red-600 hover:bg-zinc-100"
                        >
                          Desbloquear Agora
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight">
                      {formatCurrency(resultados.perdaMensal)}
                    </p>
                    <p className="text-lg sm:text-xl font-semibold opacity-90">
                      todo mês
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalhes completos - Só aparecem após email */}
              {hasSubmittedEmail && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
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
                    </div>

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
                    </div>
                  </div>

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

                  {/* CTA - Só aparece após email */}
                  <div className="pt-6">
                    <Button
                      onClick={() => window.location.href = ctaHref}
                      size="lg"
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-xl shadow-indigo-500/30"
                    >
                      {ctaText}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      Sem cartão de crédito necessário • Cancele quando quiser
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Capture Dialog */}
      <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Desbloqueie seu resultado</DialogTitle>
            <DialogDescription>
              Digite seu email para ver a análise completa do seu potencial de vendas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEmailSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email profissional</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Seus dados estão seguros. Usaremos apenas para enviar dicas de vendas.
                  Sem spam, cancele quando quiser.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Desbloqueando...' : 'Ver Resultado Completo'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
