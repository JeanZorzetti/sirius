'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { AnalyticsOverview } from './analytics-overview'
import { TasksByStatusChart } from './tasks-by-status-chart'
import { CompletionTrendChart } from './completion-trend-chart'
import { ProductivityByUser } from './productivity-by-user'
import { OverdueTasksList } from './overdue-tasks-list'
import { cn } from '@/lib/utils'

interface AnalyticsData {
  rangeDays: number
  projectId: string | null
  kpis: {
    total: number
    completed: number
    inProgress: number
    overdue: number
    completionRate: number
    avgCompletionHours: number
  }
  tasksByStatus: Array<{
    statusId: string
    name: string
    color: string
    count: number
    type: string
  }>
  tasksByPriority: Array<{ priority: string; count: number }>
  trend: Array<{ date: string; created: number; completed: number }>
  topAssignees: Array<{
    userId: string
    name: string
    email: string
    image: string | null
    count: number
  }>
  overdueList: any[]
}

interface Props {
  projectId?: string
  locale: string
}

const RANGE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
]

export function AnalyticsDashboard({ projectId, locale }: Props) {
  const [range, setRange] = useState(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchAnalytics() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ rangeDays: String(range) })
        if (projectId) params.set('projectId', projectId)

        const res = await fetch(`/api/tasks/analytics?${params}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error || 'Erro ao carregar analytics')
        }
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAnalytics()
    return () => {
      cancelled = true
    }
  }, [range, projectId])

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-center justify-end">
        <div className="inline-flex items-center gap-1 rounded-xl border border-border/50 bg-card/40 p-1 backdrop-blur-xl">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                range === opt.value
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && !data ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[400px] items-center justify-center rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-xs">Carregando métricas…</p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-center"
          >
            <p className="text-sm text-rose-500">{error}</p>
          </motion.div>
        ) : data ? (
          <motion.div
            key={`data-${range}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="space-y-6"
          >
            {/* KPIs */}
            <AnalyticsOverview kpis={data.kpis} />

            {/* Grid de gráficos */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <CompletionTrendChart data={data.trend} rangeDays={data.rangeDays} />
              <TasksByStatusChart data={data.tasksByStatus} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ProductivityByUser data={data.topAssignees} />
              <OverdueTasksList data={data.overdueList} locale={locale} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
