'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Clock, AlertTriangle, ListChecks, TrendingUp, Timer, TrendingDown, Minus, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComparisonDatum {
  current: number
  previous: number
  delta: number | null
}

interface KpisData {
  total: number
  completed: number
  inProgress: number
  overdue: number
  completionRate: number
  avgCompletionHours: number
  velocity: number
  created: number
}

interface ComparisonData {
  completed: ComparisonDatum
  overdue: ComparisonDatum
  created: ComparisonDatum
  avgCompletionHours: ComparisonDatum
  velocity: ComparisonDatum
}

interface Props {
  kpis: KpisData
  comparison?: ComparisonData
  rangeDays: number
}

const toneStyles = {
  neutral: {
    ring: 'ring-border/50',
    icon: 'text-foreground',
    glow: 'from-foreground/[0.04] via-transparent to-transparent',
  },
  success: {
    ring: 'ring-emerald-500/20',
    icon: 'text-emerald-500',
    glow: 'from-emerald-500/10 via-transparent to-transparent',
  },
  warning: {
    ring: 'ring-amber-500/20',
    icon: 'text-amber-500',
    glow: 'from-amber-500/10 via-transparent to-transparent',
  },
  danger: {
    ring: 'ring-rose-500/20',
    icon: 'text-rose-500',
    glow: 'from-rose-500/10 via-transparent to-transparent',
  },
  info: {
    ring: 'ring-sky-500/20',
    icon: 'text-sky-500',
    glow: 'from-sky-500/10 via-transparent to-transparent',
  },
  violet: {
    ring: 'ring-violet-500/20',
    icon: 'text-violet-500',
    glow: 'from-violet-500/10 via-transparent to-transparent',
  },
}

type Tone = keyof typeof toneStyles

function formatHours(h: number): string {
  if (h <= 0) return '—'
  if (h < 1) return `${Math.round(h * 60)}min`
  if (h < 48) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

interface DeltaBadgeProps {
  delta: number | null
  /** Se true, delta negativo é bom (ex: overdue) */
  invertedGood?: boolean
  /** Se true, delta negativo é bom (ex: tempo médio) */
  lowerIsBetter?: boolean
}

function DeltaBadge({ delta, invertedGood = false, lowerIsBetter = false }: DeltaBadgeProps) {
  if (delta === null) return null

  const isPositive = delta > 0
  const isGood = lowerIsBetter ? !isPositive : (invertedGood ? !isPositive : isPositive)

  if (delta === 0) {
    return (
      <div className="flex items-center gap-0.5 rounded-full bg-muted/60 px-1.5 py-0.5">
        <Minus className="h-2.5 w-2.5 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground">0%</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-full px-1.5 py-0.5',
        isGood
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      <span className="text-[10px] font-semibold">
        {isPositive ? '+' : ''}{delta}%
      </span>
    </div>
  )
}

export function AnalyticsOverview({ kpis, comparison, rangeDays }: Props) {
  const cards: Array<{
    label: string
    value: string | number
    sub?: string
    icon: React.ElementType
    tone: Tone
    delta?: number | null
    invertedGood?: boolean
    lowerIsBetter?: boolean
  }> = [
    {
      label: 'Concluídas',
      value: kpis.completed.toLocaleString('pt-BR'),
      sub: `${kpis.completionRate}% do total`,
      icon: CheckCircle2,
      tone: 'success',
      delta: comparison?.completed.delta,
    },
    {
      label: 'Criadas',
      value: kpis.created.toLocaleString('pt-BR'),
      sub: `últimos ${rangeDays}d`,
      icon: ListChecks,
      tone: 'neutral',
      delta: comparison?.created.delta,
    },
    {
      label: 'Em Progresso',
      value: kpis.inProgress.toLocaleString('pt-BR'),
      icon: Clock,
      tone: 'info',
    },
    {
      label: 'Atrasadas',
      value: kpis.overdue.toLocaleString('pt-BR'),
      sub: kpis.overdue > 0 ? 'requer atenção' : 'tudo em dia',
      icon: AlertTriangle,
      tone: kpis.overdue > 0 ? 'danger' : 'success',
      delta: comparison?.overdue.delta,
      invertedGood: true,
    },
    {
      label: 'Velocity',
      value: `${kpis.velocity}`,
      sub: 'tasks/semana',
      icon: Zap,
      tone: 'violet',
      delta: comparison?.velocity.delta,
    },
    {
      label: 'Tempo Médio',
      value: formatHours(kpis.avgCompletionHours),
      sub: 'criação → conclusão',
      icon: Timer,
      tone: 'neutral',
      delta: comparison?.avgCompletionHours.delta,
      lowerIsBetter: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card, i) => {
        const styles = toneStyles[card.tone]
        const Icon = card.icon
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.25, 0.1, 0.25, 1.0] }}
            className={cn(
              'group relative overflow-hidden rounded-2xl',
              'border border-border/50 bg-card/40 backdrop-blur-xl',
              'ring-1 ring-inset',
              styles.ring,
              'p-4 sm:p-5 transition-all duration-300',
              'hover:border-border hover:bg-card/60 hover:-translate-y-0.5'
            )}
          >
            {/* Glow gradient */}
            <div
              className={cn(
                'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70',
                styles.glow
              )}
            />

            <div className="relative space-y-3">
              {/* Icon + delta */}
              <div className="flex items-start justify-between gap-1">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    'bg-background/60 ring-1 ring-inset',
                    styles.ring
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', styles.icon)} />
                </div>
                <DeltaBadge
                  delta={card.delta ?? null}
                  invertedGood={card.invertedGood}
                  lowerIsBetter={card.lowerIsBetter}
                />
              </div>

              {/* Value */}
              <div>
                <p className="font-display text-2xl sm:text-3xl font-bold tracking-tighter text-foreground leading-none">
                  {card.value}
                </p>
                <p className="mt-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                {card.sub && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground/70 truncate">
                    {card.sub}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
