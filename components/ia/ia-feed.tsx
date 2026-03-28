'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Activity, Clock, CheckCircle2, Zap, RefreshCw } from 'lucide-react'
import { AgentActionCard } from './agent-action-card'
import { useRouter } from 'next/navigation'

interface Action {
  id: string
  agentName: string
  actionType: string
  entityType: string
  entityId: string
  reasoning: string
  confidence: number
  status: string
  createdAt: string
  output?: any
  reviewedAt?: string | null
  reviewedBy?: string | null
}

interface IAFeedProps {
  actions: Action[]
  stats: { today: number; pending: number; success: number }
  organizationId: string
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: typeof Activity
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${accent}`} />
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-2xl font-bold tracking-tight text-zinc-100 tabular-nums">{value}</span>
    </div>
  )
}

export function IAFeed({ actions: initialActions, stats, organizationId }: IAFeedProps) {
  const [actions, setActions] = useState(initialActions)
  const [filter, setFilter] = useState<string>('all')
  const router = useRouter()

  const handleReview = useCallback(async (actionId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/ia/actions/${actionId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      })

      if (res.ok) {
        setActions(prev => prev.map(a =>
          a.id === actionId
            ? { ...a, status: decision === 'APPROVED' ? 'SUCCESS' : 'FAILED' }
            : a
        ))
      }
    } catch (err) {
      console.error('Review failed:', err)
    }
  }, [])

  const filteredActions = filter === 'all'
    ? actions
    : filter === 'pending'
      ? actions.filter(a => a.status === 'NEEDS_APPROVAL' || a.status === 'PENDING')
      : actions.filter(a => a.agentName === filter)

  const uniqueAgents = [...new Set(actions.map(a => a.agentName))]

  // Group actions by relative time
  const now = new Date()
  const groups: { label: string; actions: Action[] }[] = []

  const pendingActions = filteredActions.filter(a => a.status === 'NEEDS_APPROVAL' || a.status === 'PENDING')
  const completedActions = filteredActions.filter(a => a.status !== 'NEEDS_APPROVAL' && a.status !== 'PENDING')

  if (pendingActions.length > 0) {
    groups.push({ label: `Pendente aprovação (${pendingActions.length})`, actions: pendingActions })
  }

  // Split completed by time
  const recentActions = completedActions.filter(a => {
    const diff = now.getTime() - new Date(a.createdAt).getTime()
    return diff < 3600000 // last 1h
  })

  const olderActions = completedActions.filter(a => {
    const diff = now.getTime() - new Date(a.createdAt).getTime()
    return diff >= 3600000
  })

  if (recentActions.length > 0) groups.push({ label: 'Última hora', actions: recentActions })
  if (olderActions.length > 0) groups.push({ label: 'Anteriores', actions: olderActions })

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Atividade dos Agentes</h1>
          <p className="text-sm text-zinc-500 mt-1">Monitoramento em tempo real</p>
        </div>
        <button
          onClick={() => router.refresh()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border border-zinc-800/50 transition-all duration-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard icon={Zap} label="Hoje" value={stats.today} accent="text-cyan-400" />
        <StatCard icon={Clock} label="Pendentes" value={stats.pending} accent="text-amber-400" />
        <StatCard icon={CheckCircle2} label="Sucesso" value={stats.success} accent="text-emerald-400" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pending', label: 'Pendentes' },
          ...uniqueAgents.map(a => ({ key: a, label: a }))
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              filter === f.key
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/40 hover:bg-zinc-800/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-8">
        {groups.map(group => (
          <div key={group.label}>
            <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">
              {group.label}
            </h3>
            <div className="space-y-2">
              {group.actions.map((action, i) => (
                <AgentActionCard
                  key={action.id}
                  action={action}
                  onApprove={(id) => handleReview(id, 'APPROVED')}
                  onReject={(id) => handleReview(id, 'REJECTED')}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredActions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center mb-4">
              <Activity className="h-7 w-7 text-zinc-600" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-1">Nenhuma atividade</h3>
            <p className="text-xs text-zinc-600 max-w-xs">
              Quando os agentes Sofia começarem a operar, suas ações aparecerão aqui em tempo real.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
