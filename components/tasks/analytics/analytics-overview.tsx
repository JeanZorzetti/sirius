'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Clock, AlertTriangle, ListChecks, TrendingUp, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpisData {
  total: number
  completed: number
  inProgress: number
  overdue: number
  completionRate: number
  avgCompletionHours: number
}

interface Props {
  kpis: KpisData
}

interface KpiCard {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}

const toneStyles: Record<KpiCard['tone'], { ring: string; icon: string; glow: string }> = {
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
}

function formatHours(h: number): string {
  if (h <= 0) return '—'
  if (h < 1) return `${Math.round(h * 60)}min`
  if (h < 48) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

export function AnalyticsOverview({ kpis }: Props) {
  const cards: KpiCard[] = [
    {
      label: 'Total de Tarefas',
      value: kpis.total.toLocaleString('pt-BR'),
      icon: ListChecks,
      tone: 'neutral',
    },
    {
      label: 'Concluídas',
      value: kpis.completed.toLocaleString('pt-BR'),
      sub: `${kpis.completionRate}% do total`,
      icon: CheckCircle2,
      tone: 'success',
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
    },
    {
      label: 'Taxa de Conclusão',
      value: `${kpis.completionRate}%`,
      icon: TrendingUp,
      tone: 'info',
    },
    {
      label: 'Tempo Médio',
      value: formatHours(kpis.avgCompletionHours),
      sub: 'criação → conclusão',
      icon: Timer,
      tone: 'neutral',
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
            transition={{
              duration: 0.4,
              delay: i * 0.05,
              ease: [0.25, 0.1, 0.25, 1.0],
            }}
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

            <div className="relative flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tighter text-foreground">
                  {card.value}
                </p>
                {card.sub && (
                  <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground truncate">
                    {card.sub}
                  </p>
                )}
              </div>
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                  'bg-background/60 ring-1 ring-inset',
                  styles.ring
                )}
              >
                <Icon className={cn('h-4 w-4', styles.icon)} />
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
