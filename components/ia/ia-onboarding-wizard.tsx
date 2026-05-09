'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, MessageSquare, GitBranch, Calendar, Search,
  ChevronRight, Check, Loader2, BookOpen, Rocket,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AgentOption {
  id: string
  name: string
  description: string
  icon: typeof Zap
  gradient: string
}

const CORE_AGENTS: AgentOption[] = [
  { id: 'lead-qualifier', name: 'LeadQualifier', description: 'Qualifica leads via WhatsApp com BANT/SPIN.', icon: Zap, gradient: 'from-cyan-500 to-blue-500' },
  { id: 'followup-coordinator', name: 'FollowUpCoordinator', description: 'Follow-ups personalizados em deals parados.', icon: MessageSquare, gradient: 'from-violet-500 to-purple-500' },
  { id: 'deal-stage-analyzer', name: 'DealStageAnalyzer', description: 'Move deals de estágio automaticamente.', icon: GitBranch, gradient: 'from-amber-500 to-orange-500' },
  { id: 'meeting-scheduler', name: 'MeetingScheduler', description: 'Propõe horários de reunião com prospects.', icon: Calendar, gradient: 'from-emerald-500 to-green-500' },
  { id: 'contact-enricher', name: 'ContactEnricher', description: 'Enriquece contatos com dados da web.', icon: Search, gradient: 'from-pink-500 to-rose-500' },
]

const TOTAL_STEPS = 4

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
            i < current
              ? 'bg-cyan-500 text-black'
              : i === current
                ? 'bg-zinc-700 border-2 border-cyan-500 text-cyan-400'
                : 'bg-zinc-800 text-zinc-600'
          )}>
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={cn(
              'h-px w-8 transition-all duration-300',
              i < current ? 'bg-cyan-500' : 'bg-zinc-700'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

interface WizardProps {
  orgName: string
  initialEnabledAgents?: Record<string, boolean>
  initialThreshold?: number
}

export function IAOnboardingWizard({ orgName, initialEnabledAgents, initialThreshold }: WizardProps) {
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 1 — agents
  const [enabledAgents, setEnabledAgents] = useState<Record<string, boolean>>(
    initialEnabledAgents ?? { 'lead-qualifier': true }
  )

  // Step 2 — threshold
  const [threshold, setThreshold] = useState(initialThreshold ?? 75)

  const activeCount = Object.values(enabledAgents).filter(Boolean).length

  function toggleAgent(id: string) {
    setEnabledAgents(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function applyRecommendedThreshold() {
    setThreshold(75)
  }

  async function saveAndFinish() {
    setSaving(true)
    try {
      // Save enabled agents + threshold
      const settingsRes = await fetch('/api/ia/settings')
      const settingsData = await settingsRes.json()
      const existingConfig = settingsData.config || {}

      const putRes = await fetch('/api/ia/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...existingConfig,
            enabledAgents,
            confidenceThreshold: threshold,
            setupCompleted: true,
          }
        })
      })
      if (!putRes.ok) throw new Error()
      router.push('/IA')
    } catch {
      toast.error('Erro ao salvar configuração. Tente novamente.')
      setSaving(false)
    }
  }

  const STEP_LABELS = ['Agentes', 'Threshold', 'Conhecimento', 'Pronto']

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[128px]" />
      </div>

      <div className="relative w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <Rocket className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-400">Configuração Inicial</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Ativar Sirius IA</h1>
          <p className="text-sm text-zinc-500">{orgName} — configure em menos de 2 minutos</p>
        </div>

        {/* Step indicator */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <StepIndicator current={step} total={TOTAL_STEPS} />
          <p className="text-xs text-zinc-500">
            Passo {step + 1} de {TOTAL_STEPS} — {STEP_LABELS[step]}
          </p>
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Step 1 — Activate agents */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                <h2 className="text-lg font-semibold text-zinc-100 mb-1">Ative seus primeiros agentes</h2>
                <p className="text-sm text-zinc-500 mb-5">Escolha pelo menos 1 agente para começar. Você pode mudar isso a qualquer momento.</p>

                <div className="space-y-2.5">
                  {CORE_AGENTS.map(agent => {
                    const Icon = agent.icon
                    const enabled = !!enabledAgents[agent.id]
                    return (
                      <div
                        key={agent.id}
                        onClick={() => toggleAgent(agent.id)}
                        className={cn(
                          'flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
                          enabled
                            ? 'border-cyan-500/30 bg-cyan-500/5'
                            : 'border-zinc-800/50 bg-zinc-800/20 hover:border-zinc-700/60'
                        )}
                      >
                        <div className={cn('h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0', agent.gradient)}>
                          <Icon className="h-4.5 w-4.5 text-white h-[18px] w-[18px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200">{agent.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{agent.description}</p>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={() => toggleAgent(agent.id)}
                          className="data-[state=checked]:bg-cyan-500 shrink-0"
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2 — Confidence threshold */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                <h2 className="text-lg font-semibold text-zinc-100 mb-1">Threshold de confiança</h2>
                <p className="text-sm text-zinc-500 mb-6">
                  Abaixo de <span className="text-zinc-300 font-semibold">{threshold}%</span>, o agente pedirá aprovação humana antes de agir.
                </p>

                <div className="space-y-6">
                  <div className="px-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-zinc-500">Cautela máxima</span>
                      <span className="text-2xl font-bold text-cyan-400 tabular-nums">{threshold}%</span>
                      <span className="text-xs text-zinc-500">Autonomia máxima</span>
                    </div>
                    <Slider
                      value={[threshold]}
                      onValueChange={([v]) => setThreshold(v)}
                      min={50}
                      max={95}
                      step={5}
                      className="[&_[role=slider]]:bg-cyan-500 [&_[role=slider]]:border-cyan-400 [&_.relative]:bg-zinc-800"
                    />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-zinc-700">50%</span>
                      <span className="text-[10px] text-zinc-700">95%</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800/60 bg-zinc-800/30 p-4 space-y-2.5">
                    <p className="text-xs text-zinc-400 font-medium">O que significa?</p>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono shrink-0 mt-0.5">≥ {threshold}%</span>
                      <p className="text-xs text-zinc-500">Agente age automaticamente sem pedir aprovação</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono shrink-0 mt-0.5">&lt; {threshold}%</span>
                      <p className="text-xs text-zinc-500">Agente cria rascunho para sua revisão antes de enviar</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={applyRecommendedThreshold}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all',
                      threshold === 75
                        ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 cursor-default'
                        : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                    )}
                  >
                    {threshold === 75 && <Check className="h-3.5 w-3.5" />}
                    Usar recomendado (75%)
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Knowledge base (optional) */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-zinc-100">Base de conhecimento</h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-700/60 text-zinc-400 font-medium">Opcional</span>
                </div>
                <p className="text-sm text-zinc-500 mb-6">
                  Adicione scripts de vendas, FAQs ou processos para que os agentes usem como referência. Você pode pular e adicionar depois.
                </p>

                <div className="rounded-xl border border-zinc-800/50 bg-zinc-800/20 p-5 text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
                    <BookOpen className="h-6 w-6 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-300 mb-1">Configure após o wizard</p>
                    <p className="text-xs text-zinc-500">
                      Acesse <span className="text-zinc-300 font-mono">/IA/knowledge</span> para adicionar documentos a qualquer momento. Os agentes funcionam sem base de conhecimento — ela apenas melhora a precisão das respostas.
                    </p>
                  </div>
                  <a
                    href="/IA/knowledge"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-700/50 text-zinc-300 text-sm font-medium hover:bg-zinc-700/80 transition-all"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Abrir Base de Conhecimento
                    <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            )}

            {/* Step 4 — Done */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1, stiffness: 200, damping: 15 }}
                  className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="h-8 w-8 text-white" />
                </motion.div>

                <h2 className="text-xl font-bold text-zinc-100 mb-1">Tudo pronto!</h2>
                <p className="text-sm text-zinc-500 mb-6">Sirius IA está configurado e pronto para operar.</p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="rounded-xl border border-zinc-800/50 bg-zinc-800/30 p-3 text-center">
                    <p className="text-2xl font-bold text-cyan-400 tabular-nums">{activeCount}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">agente{activeCount !== 1 ? 's' : ''} ativo{activeCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800/50 bg-zinc-800/30 p-3 text-center">
                    <p className="text-2xl font-bold text-violet-400 tabular-nums">{threshold}%</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">threshold</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800/50 bg-zinc-800/30 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">∞</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">autonomia</p>
                  </div>
                </div>

                <Button
                  onClick={saveAndFinish}
                  disabled={saving}
                  size="lg"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4" />
                  )}
                  {saving ? tCommon('buttons.saving') : tCommon('buttons.finish')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        {step < 3 && (
          <div className="flex items-center justify-between mt-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 disabled:opacity-0"
            >
              {tCommon('buttons.back')}
            </Button>

            <Button
              size="sm"
              onClick={() => {
                if (step === 0 && activeCount === 0) {
                  toast.error('Ative pelo menos 1 agente para continuar.')
                  return
                }
                setStep(s => s + 1)
              }}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold gap-1.5"
            >
              {step === 2 ? tCommon('buttons.continue') : tCommon('buttons.next')}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
