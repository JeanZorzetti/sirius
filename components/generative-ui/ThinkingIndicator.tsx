/**
 * Thinking Indicator
 *
 * Visual feedback for AI processing states.
 * Shows contextual messages based on what the AI is doing.
 */

'use client'

import { Loader2, Brain, Calculator, FileSearch, Calendar, Lightbulb, Sparkles } from 'lucide-react'
import type { ThinkingState } from '@/lib/generative-ui/types'

interface ThinkingIndicatorProps {
  state: ThinkingState
  message?: string
}

const STATE_CONFIG: Record<
  ThinkingState,
  {
    icon: React.ComponentType<{ className?: string }>
    defaultMessage: string
    color: string
  }
> = {
  thinking: {
    icon: Brain,
    defaultMessage: 'Pensando...',
    color: 'text-blue-500',
  },
  querying_knowledge: {
    icon: FileSearch,
    defaultMessage: 'Consultando base de conhecimento...',
    color: 'text-purple-500',
  },
  analyzing_deal: {
    icon: Lightbulb,
    defaultMessage: 'Analisando deal...',
    color: 'text-green-500',
  },
  calculating_roi: {
    icon: Calculator,
    defaultMessage: 'Calculando ROI...',
    color: 'text-emerald-500',
  },
  generating_script: {
    icon: Sparkles,
    defaultMessage: 'Gerando script...',
    color: 'text-amber-500',
  },
  checking_availability: {
    icon: Calendar,
    defaultMessage: 'Verificando disponibilidade...',
    color: 'text-indigo-500',
  },
  analyzing_fit: {
    icon: Lightbulb,
    defaultMessage: 'Analisando fit do produto...',
    color: 'text-cyan-500',
  },
  generating_ui: {
    icon: Sparkles,
    defaultMessage: 'Preparando componente visual...',
    color: 'text-pink-500',
  },
  extracting_context: {
    icon: FileSearch,
    defaultMessage: 'Extraindo contexto da conversa...',
    color: 'text-orange-500',
  },
}

export function ThinkingIndicator({ state, message }: ThinkingIndicatorProps) {
  const config = STATE_CONFIG[state]
  const Icon = config.icon
  const displayMessage = message || config.defaultMessage

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Icon className={`h-4 w-4 ${config.color} animate-pulse`} />
      <span>{displayMessage}</span>
      <Loader2 className="h-3 w-3 animate-spin ml-1" />
    </div>
  )
}

/**
 * Compact version for inline use
 */
export function ThinkingIndicatorCompact({ state }: { state: ThinkingState }) {
  const config = STATE_CONFIG[state]
  const Icon = config.icon

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className={`h-3 w-3 ${config.color}`} />
      <Loader2 className="h-3 w-3 animate-spin" />
    </div>
  )
}
