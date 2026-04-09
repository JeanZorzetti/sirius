'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskLite, TaskStatusLite } from './task-types'

interface Props {
  tasks: TaskLite[]
  statuses: TaskStatusLite[]
  projectId: string
  locale: string
  canAccessAnalytics: boolean
}

export function ProjectMetricsBar({
  tasks,
  statuses,
  projectId,
  locale,
  canAccessAnalytics,
}: Props) {
  const metrics = useMemo(() => {
    const now = new Date()

    const doneStatusIds = new Set(
      statuses.filter((s) => s.type === 'DONE' || s.type === 'CLOSED').map((s) => s.id)
    )
    const inProgressStatusIds = new Set(
      statuses.filter((s) => s.type === 'IN_PROGRESS').map((s) => s.id)
    )

    let total = 0
    let done = 0
    let inProgress = 0
    let overdue = 0

    for (const t of tasks) {
      total += 1
      if (doneStatusIds.has(t.statusId) || t.completedAt) done += 1
      else if (inProgressStatusIds.has(t.statusId)) inProgress += 1

      if (t.dueDate && !t.completedAt) {
        const due = new Date(t.dueDate)
        if (due < now) overdue += 1
      }
    }

    const progress = total > 0 ? Math.round((done / total) * 100) : 0

    // Burn indicator: on track / at risk / behind
    let burn: 'on-track' | 'at-risk' | 'behind' = 'on-track'
    const overdueRate = total > 0 ? overdue / total : 0
    if (overdueRate > 0.2) burn = 'behind'
    else if (overdueRate > 0.05) burn = 'at-risk'

    return { total, done, inProgress, overdue, progress, burn }
  }, [tasks, statuses])

  const burnStyles = {
    'on-track': {
      label: 'No prazo',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      ring: 'ring-emerald-500/20',
      dot: 'bg-emerald-500',
    },
    'at-risk': {
      label: 'Atenção',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      ring: 'ring-amber-500/20',
      dot: 'bg-amber-500',
    },
    behind: {
      label: 'Atrasado',
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      ring: 'ring-rose-500/20',
      dot: 'bg-rose-500',
    },
  }

  const burnStyle = burnStyles[metrics.burn]

  if (metrics.total === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50',
        'bg-card/30 backdrop-blur-xl'
      )}
    >
      {/* Glow sutil baseado no burn */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-r opacity-50',
          metrics.burn === 'on-track' && 'from-emerald-500/[0.03] via-transparent to-transparent',
          metrics.burn === 'at-risk' && 'from-amber-500/[0.03] via-transparent to-transparent',
          metrics.burn === 'behind' && 'from-rose-500/[0.04] via-transparent to-transparent'
        )}
      />

      <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        {/* Progresso */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Progresso
              </span>
            </div>
            <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
              {metrics.progress}%
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.progress}%` }}
              transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1.0] }}
              className={cn(
                'absolute inset-y-0 left-0 rounded-full',
                metrics.burn === 'on-track' &&
                  'bg-gradient-to-r from-emerald-500/70 to-emerald-400',
                metrics.burn === 'at-risk' &&
                  'bg-gradient-to-r from-amber-500/70 to-amber-400',
                metrics.burn === 'behind' &&
                  'bg-gradient-to-r from-rose-500/70 to-rose-400'
              )}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {metrics.done} de {metrics.total} tarefas concluídas
          </p>
        </div>

        <div className="h-px w-full bg-border/50 sm:h-10 sm:w-px" />

        {/* Stats compactos */}
        <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-4">
          <Stat
            icon={CheckCircle2}
            label="Concluídas"
            value={metrics.done}
            tone="emerald"
          />
          <Stat icon={Clock} label="Em progresso" value={metrics.inProgress} tone="sky" />
          <Stat
            icon={AlertTriangle}
            label="Atrasadas"
            value={metrics.overdue}
            tone={metrics.overdue > 0 ? 'rose' : 'muted'}
          />
        </div>

        <div className="h-px w-full bg-border/50 sm:h-10 sm:w-px" />

        {/* Burn indicator */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 ring-inset',
              burnStyle.bg,
              burnStyle.ring
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', burnStyle.dot)} />
            <span className={cn('text-xs font-semibold', burnStyle.color)}>
              {burnStyle.label}
            </span>
          </div>

          {canAccessAnalytics && (
            <Link
              href={`/${locale}/dashboard/tasks/analytics?projectId=${projectId}`}
              className={cn(
                'group hidden items-center gap-1.5 rounded-full border border-border/50',
                'bg-background/40 px-3 py-1.5 text-xs font-medium text-foreground',
                'transition-all duration-200 hover:border-border hover:bg-background/80 sm:flex',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
            >
              <BarChart3 className="h-3 w-3" />
              Analytics
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface StatProps {
  icon: React.ElementType
  label: string
  value: number
  tone: 'emerald' | 'sky' | 'rose' | 'muted'
}

function Stat({ icon: Icon, label, value, tone }: StatProps) {
  const toneColors = {
    emerald: 'text-emerald-500',
    sky: 'text-sky-500',
    rose: 'text-rose-500',
    muted: 'text-muted-foreground',
  }
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('h-3.5 w-3.5 shrink-0', toneColors[tone])} />
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold text-foreground tabular-nums leading-none">
          {value}
        </p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  )
}
