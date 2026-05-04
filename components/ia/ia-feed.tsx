'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Activity, Clock, CheckCircle2, Zap, RefreshCw, Lock, Bot, MessageSquare, UserPlus } from 'lucide-react'
import { AgentActionCard } from './agent-action-card'
import { IASetupProgress } from './ia-setup-progress'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  enabledAgentCount?: number
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

export function IAFeed({ actions: initialActions, stats, organizationId, enabledAgentCount = 0 }: IAFeedProps) {
  const [actions, setActions] = useState(initialActions)
  const [filter, setFilter] = useState<string>('all')
  const [tier, setTier] = useState<string>('FREE')
  const [iaConfig, setIaConfig] = useState<Record<string, unknown>>({})
  const router = useRouter()

  const canApprove = tier !== 'FREE'

  useEffect(() => {
    Promise.all([
      fetch('/api/ia/quota').then(r => r.json()),
      fetch('/api/ia/settings').then(r => r.json()),
    ])
      .then(([quota, settings]) => {
        if (quota.tier) setTier(quota.tier)
        if (settings.config) setIaConfig(settings.config)
      })
      .catch(() => {})
  }, [])

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

  const now = new Date()
  const groups: { label: string; actions: Action[] }[] = []

  const pendingActions = filteredActions.filter(a => a.status === 'NEEDS_APPROVAL' || a.status === 'PENDING')
  const completedActions = filteredActions.filter(a => a.status !== 'NEEDS_APPROVAL' && a.status !== 'PENDING')

  if (pendingActions.length > 0) {
    groups.push({ label: `Pendente aprovação (${pendingActions.length})`, actions: pendingActions })
  }

  const recentActions = completedActions.filter(a => {
    const diff = now.getTime() - new Date(a.createdAt).getTime()
    return diff < 3600000
  })

  const olderActions = completedActions.filter(a => {
    const diff = now.getTime() - new Date(a.createdAt).getTime()
    return diff >= 3600000
  })

  if (recentActions.length > 0) groups.push({ label: 'Última hora', actions: recentActions })
  if (olderActions.length > 0) groups.push({ label: 'Anteriores', actions: olderActions })

  const hasConfiguredThreshold = iaConfig.confidenceThreshold !== undefined
  const hasActions = stats.today > 0

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

      {/* Setup progress — shown while onboarding steps are incomplete */}
      <IASetupProgress
        enabledAgentCount={enabledAgentCount}
        hasConfiguredThreshold={hasConfiguredThreshold}
        hasActions={hasActions}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard icon={Zap} label="Hoje" value={stats.today} accent="text-cyan-400" />
        <StatCard icon={Clock} label="Pendentes" value={stats.pending} accent="text-amber-400" />
        <StatCard icon={CheckCircle2} label="Sucesso" value={stats.success} accent="text-emerald-400" />
      </div>

      {/* FREE tier banner */}
      {!canApprove && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-amber-400/80">
              Plano Free — visualização apenas. Faça upgrade para aprovar/rejeitar ações.
            </span>
          </div>
          <Link href="/dashboard/billing/plans" className="text-xs text-amber-300 hover:text-amber-200 font-medium">
            Upgrade
          </Link>
        </div>
      )}

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
              {group.actions.map((action) => (
                <AgentActionCard
                  key={action.id}
                  action={action}
                  onApprove={canApprove ? (id) => handleReview(id, 'APPROVED') : undefined}
                  onReject={canApprove ? (id) => handleReview(id, 'REJECTED') : undefined}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredActions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="h-14 w-14 rounded-2xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-zinc-600" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-1">Nenhuma ação ainda</h3>
            <p className="text-xs text-zinc-600 max-w-xs mb-5">
              Os agentes estão aguardando eventos do CRM para começar a operar.
            </p>

            {enabledAgentCount === 0 ? (
              <Link
                href="/IA/agents"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors"
              >
                <Bot className="h-3.5 w-3.5" />
                Ativar agentes primeiro
              </Link>
            ) : (
              <div className="space-y-2 text-left">
                <p className="text-[11px] text-zinc-600 font-semibold uppercase tracking-wider text-center mb-3">Como disparar os agentes</p>
                <div className="flex items-start gap-2.5 text-xs text-zinc-500">
                  <MessageSquare className="h-3.5 w-3.5 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Envie uma mensagem pelo WhatsApp para disparar o <span className="text-zinc-400">LeadQualifier</span></span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-zinc-500">
                  <UserPlus className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                  <span>Crie um contato para disparar o <span className="text-zinc-400">ContactEnricher</span></span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800/50">
                  <Link
                    href="/dashboard"
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Ir para o Dashboard →
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
