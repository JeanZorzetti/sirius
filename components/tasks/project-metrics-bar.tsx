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
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/15',
      ring: 'ring-emerald-500/30',
      dot: 'bg-emerald-500',
      glow: 'from-emerald-500/10'
    },
    'at-risk': {
      label: 'Atenção',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/15',
      ring: 'ring-amber-500/30',
      dot: 'bg-amber-500',
      glow: 'from-amber-500/10'
    },
    behind: {
      label: 'Atrasado',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/15',
      ring: 'ring-rose-500/30',
      dot: 'bg-rose-500',
      glow: 'from-rose-500/10'
    },
  }

  const burnStyle = burnStyles[metrics.burn]

  if (metrics.total === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'relative overflow-hidden rounded-[24px] border border-border/30 shadow-sm',
        'bg-card/40 backdrop-blur-2xl'
      )}
    >
      {/* Ambient Burn Glow */}
      <div className={cn('absolute top-0 -left-1/4 w-full h-[150%] rounded-full blur-[100px] opacity-40 pointer-events-none bg-gradient-to-r via-transparent to-transparent', burnStyle.glow)} />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center gap-6 xl:gap-10 p-6 md:p-8">
        
        {/* Progress Display */}
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2.5">
               <div className="bg-primary/10 p-1.5 rounded-md"><TrendingUp className="w-4 h-4 text-primary" /></div>
               <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Progresso</span>
             </div>
             <div className="text-3xl font-black text-foreground tabular-nums tracking-tighter">
               {metrics.progress}%
             </div>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary/70 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={cn(
                'absolute inset-y-0 left-0 rounded-full',
                metrics.burn === 'on-track' && 'bg-gradient-to-r from-emerald-400 to-emerald-500',
                metrics.burn === 'at-risk' && 'bg-gradient-to-r from-amber-400 to-amber-500',
                metrics.burn === 'behind' && 'bg-gradient-to-r from-rose-400 to-rose-500'
              )}
            />
          </div>
          <p className="mt-2.5 text-xs font-medium text-muted-foreground">
             <strong className="text-foreground">{metrics.done}</strong> concluídas de <strong className="text-foreground">{metrics.total}</strong> totais
          </p>
        </div>

        <div className="hidden xl:block h-16 w-px bg-border/40" />
        <div className="xl:hidden h-px w-full bg-border/40" />

        {/* Floating Stat Pills */}
        <div className="flex flex-wrap items-center gap-4 xl:gap-6">
          <StatPill
            icon={CheckCircle2}
            label="Concluídas"
            value={metrics.done}
            tone="emerald"
          />
          <StatPill 
             icon={Clock} 
             label="Em Andamento" 
             value={metrics.inProgress} 
             tone="sky" 
          />
          <StatPill
            icon={AlertTriangle}
            label="Atrasadas"
            value={metrics.overdue}
            tone={metrics.overdue > 0 ? 'rose' : 'muted'}
          />
        </div>

        <div className="hidden xl:block h-16 w-px bg-border/40" />
        <div className="xl:hidden h-px w-full bg-border/40" />

        {/* Burn Indicator & Actions */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-full px-4 py-2 ring-1 ring-inset shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105',
              burnStyle.bg,
              burnStyle.ring
            )}
          >
            <span className={cn('relative flex h-2 w-2')}>
               <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', burnStyle.bg)} />
               <span className={cn('relative inline-flex rounded-full h-2 w-2', burnStyle.dot)} />
            </span>
            <span className={cn('text-sm font-bold', burnStyle.color)}>
              {burnStyle.label}
            </span>
          </div>

          {canAccessAnalytics && (
            <Link
              href={`/${locale}/dashboard/tasks/analytics?projectId=${projectId}`}
              className={cn(
                'group flex items-center gap-2 rounded-full border border-border/50',
                'bg-card shadow-sm px-4 py-2 text-sm font-semibold text-foreground',
                'transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:-translate-y-0.5',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
            >
              <BarChart3 className="h-4 w-4 text-emerald-500/70" />
              Ver Analytics
              <ArrowRight className="h-4 w-4 opacity-50 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface StatPillProps {
  icon: React.ElementType
  label: string
  value: number
  tone: 'emerald' | 'sky' | 'rose' | 'muted'
}

function StatPill({ icon: Icon, label, value, tone }: StatPillProps) {
  const toneMap = {
    emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    sky: { text: 'text-sky-500', bg: 'bg-sky-500/10' },
    rose: { text: 'text-rose-500', bg: 'bg-rose-500/15' },
    muted: { text: 'text-muted-foreground', bg: 'bg-muted' },
  }
  
  const currentTone = toneMap[tone]

  return (
    <div className="flex items-center gap-3 bg-secondary/50 rounded-2xl p-2 pr-5 border border-border/40 hover:bg-secondary/70 transition-colors">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", currentTone.bg)}>
         <Icon className={cn('h-5 w-5', currentTone.text)} />
      </div>
      <div>
        <p className="font-display text-xl font-bold text-foreground tabular-nums leading-none tracking-tight">
          {value}
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          {label}
        </p>
      </div>
    </div>
  )
}
