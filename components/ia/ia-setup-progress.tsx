'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Circle, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface IASetupProgressProps {
  enabledAgentCount: number
  hasConfiguredThreshold: boolean
  hasActions: boolean
}

const DISMISS_KEY = 'ia-setup-dismissed'

export function IASetupProgress({ enabledAgentCount, hasConfiguredThreshold, hasActions }: IASetupProgressProps) {
  const [dismissed, setDismissed] = useState(true) // start hidden, check localStorage

  useEffect(() => {
    const isDismissed = localStorage.getItem(DISMISS_KEY) === '1'
    setDismissed(isDismissed)
  }, [])

  const steps = [
    {
      label: 'Ative pelo menos 1 agente',
      done: enabledAgentCount > 0,
      href: '/IA/agents',
      cta: 'Ir para Agentes',
    },
    {
      label: 'Ajuste o threshold de confiança',
      done: hasConfiguredThreshold,
      href: '/IA/settings',
      cta: 'Configurar',
    },
    {
      label: 'Aguarde as primeiras ações dos agentes',
      done: hasActions,
      href: null,
      cta: 'Automático',
    },
  ]

  const allDone = steps.every(s => s.done)

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  if (dismissed || allDone) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 p-4 mb-6"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-zinc-200">Configure o Sirius IA em 3 passos</span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={cn(
                  'text-[11px] font-mono font-semibold shrink-0 w-4 text-center',
                  step.done ? 'text-emerald-400' : 'text-zinc-600'
                )}>
                  {i + 1}
                </span>
                {step.done
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  : <Circle className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                }
                <span className={cn(
                  'text-xs truncate',
                  step.done ? 'text-zinc-500 line-through' : 'text-zinc-300'
                )}>
                  {step.label}
                </span>
              </div>

              {!step.done && (
                step.href ? (
                  <Link
                    href={step.href}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 shrink-0 transition-colors"
                  >
                    {step.cta}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="text-[11px] text-zinc-600 shrink-0">{step.cta}</span>
                )
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
