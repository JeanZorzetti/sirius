'use client'

import { motion } from 'framer-motion'
import { Activity, CheckCircle2, XCircle, Clock, TrendingUp, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentStat {
  name: string
  count: number
  avgConfidence: number
}

interface IAAnalyticsProps {
  stats: {
    totalActions: number
    successActions: number
    failedActions: number
    pendingActions: number
    approvalRate: number
    agentStats: AgentStat[]
  }
}

const agentGradients: Record<string, string> = {
  LeadQualifier: 'from-cyan-500 to-blue-500',
  FollowUpCoordinator: 'from-violet-500 to-purple-500',
  DealStageAnalyzer: 'from-amber-500 to-orange-500',
  MeetingScheduler: 'from-emerald-500 to-green-500',
  ContactEnricher: 'from-pink-500 to-rose-500',
}

function MetricCard({ icon: Icon, label, value, suffix, accent }: {
  icon: typeof Activity
  label: string
  value: number | string
  suffix?: string
  accent: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-sm p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn('h-4 w-4', accent)} />
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight text-zinc-100 tabular-nums">{value}</span>
        {suffix && <span className="text-sm text-zinc-500">{suffix}</span>}
      </div>
    </motion.div>
  )
}

export function IAAnalytics({ stats }: IAAnalyticsProps) {
  const maxAgentCount = Math.max(...stats.agentStats.map(a => a.count), 1)

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Analytics</h1>
        <p className="text-sm text-zinc-500 mt-1">Performance dos agentes autônomos</p>
      </div>

      {/* Overview metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <MetricCard icon={Activity} label="Total de ações" value={stats.totalActions} accent="text-cyan-400" />
        <MetricCard icon={CheckCircle2} label="Aprovadas" value={stats.successActions} accent="text-emerald-400" />
        <MetricCard icon={XCircle} label="Rejeitadas" value={stats.failedActions} accent="text-red-400" />
        <MetricCard icon={TrendingUp} label="Taxa de aprovação" value={stats.approvalRate} suffix="%" accent="text-violet-400" />
      </div>

      {/* Pending */}
      {stats.pendingActions > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-8 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">
              {stats.pendingActions} {stats.pendingActions === 1 ? 'ação pendente' : 'ações pendentes'} de aprovação
            </p>
            <p className="text-xs text-amber-400/60 mt-0.5">Revise no Feed de atividade</p>
          </div>
        </div>
      )}

      {/* Agent breakdown */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-sm p-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-5">Performance por Agente</h2>

        {stats.agentStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Bot className="h-10 w-10 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">Nenhum agente executou ações ainda.</p>
            <p className="text-xs text-zinc-600 mt-1">Os dados aparecerão quando os agentes Sofia começarem a operar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.agentStats.map(agent => {
              const barWidth = (agent.count / maxAgentCount) * 100
              const gradient = agentGradients[agent.name] || 'from-zinc-500 to-zinc-600'

              return (
                <div key={agent.name} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2.5 w-2.5 rounded-full bg-gradient-to-r', gradient)} />
                      <span className="text-sm font-medium text-zinc-300">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 font-mono">
                        confiança: {agent.avgConfidence}%
                      </span>
                      <span className="text-sm font-semibold text-zinc-200 tabular-nums w-8 text-right">
                        {agent.count}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn('h-full rounded-full bg-gradient-to-r', gradient)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
