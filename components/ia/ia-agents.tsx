'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Bot, Zap, MessageSquare, GitBranch, Calendar, Search, ToggleLeft, ToggleRight, Loader2, Lock, Crown } from 'lucide-react'
import Link from 'next/link'

interface AgentDef {
  id: string
  name: string
  description: string
  icon: typeof Bot
  gradient: string
  capabilities: string[]
  triggers: string[]
}

const AGENT_DEFS: AgentDef[] = [
  {
    id: 'lead-qualifier',
    name: 'LeadQualifier',
    description: 'Qualifica leads via WhatsApp usando frameworks BANT/SPIN. Cria deals e roteia para vendedores.',
    icon: Zap,
    gradient: 'from-cyan-500 to-blue-500',
    capabilities: ['Qualificação BANT', 'Análise SPIN', 'Criação de Deal', 'Roteamento automático'],
    triggers: ['whatsapp.message.in', 'contact.created'],
  },
  {
    id: 'followup-coordinator',
    name: 'FollowUpCoordinator',
    description: 'Envia follow-ups personalizados em deals parados. Mensagens contextuais, não templates.',
    icon: MessageSquare,
    gradient: 'from-violet-500 to-purple-500',
    capabilities: ['Follow-up inteligente', 'Análise de contexto', 'Mensagens personalizadas', 'Timing adaptativo'],
    triggers: ['deal.idle'],
  },
  {
    id: 'deal-stage-analyzer',
    name: 'DealStageAnalyzer',
    description: 'Analisa conversas e notas para detectar intenção de compra e mover deals de estágio automaticamente.',
    icon: GitBranch,
    gradient: 'from-amber-500 to-orange-500',
    capabilities: ['Análise de sentimento', 'Detecção de intenção', 'Movimentação automática', 'Sugestões de próximo passo'],
    triggers: ['note.created', 'whatsapp.message.in'],
  },
  {
    id: 'meeting-scheduler',
    name: 'MeetingScheduler',
    description: 'Verifica disponibilidade no Google Calendar e propõe horários para reuniões com prospects.',
    icon: Calendar,
    gradient: 'from-emerald-500 to-green-500',
    capabilities: ['Check de disponibilidade', 'Proposta de horários', 'Agendamento automático', 'Confirmação via WhatsApp'],
    triggers: ['Delegação de outros agentes'],
  },
  {
    id: 'contact-enricher',
    name: 'ContactEnricher',
    description: 'Enriquece contatos com dados públicos da web. Adiciona cargo, empresa, LinkedIn e insights.',
    icon: Search,
    gradient: 'from-pink-500 to-rose-500',
    capabilities: ['Busca web', 'Enriquecimento de dados', 'Perfil profissional', 'Insights de empresa'],
    triggers: ['contact.created'],
  },
]

interface QuotaInfo {
  tier: string
  agentLimit: number
  quota: number
  used: number
  remaining: number
  resetsAt: string | null
}

function AgentCard({ agent, enabled, onToggle, locked, saving }: {
  agent: AgentDef
  enabled: boolean
  onToggle: (id: string) => void
  locked: boolean
  saving: boolean
}) {
  const Icon = agent.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-5 transition-all duration-200',
        locked
          ? 'border-zinc-800/20 bg-zinc-900/20 opacity-50'
          : enabled
            ? 'border-zinc-700/50 bg-zinc-900/60'
            : 'border-zinc-800/30 bg-zinc-900/30 opacity-70'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', agent.gradient)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">{agent.name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{agent.description}</p>
          </div>
        </div>

        {locked ? (
          <Lock className="h-5 w-5 text-zinc-700 shrink-0 mt-1" />
        ) : (
          <button
            onClick={() => onToggle(agent.id)}
            disabled={saving}
            className="shrink-0 mt-1 disabled:opacity-50"
          >
            {enabled ? (
              <ToggleRight className="h-6 w-6 text-cyan-400" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-zinc-600" />
            )}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {agent.capabilities.map(cap => (
          <span key={cap} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/60 text-zinc-400 border border-zinc-700/30">
            {cap}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">Triggers:</span>
        {agent.triggers.map(t => (
          <span key={t} className="text-[11px] text-zinc-500 font-mono">{t}</span>
        ))}
      </div>
    </motion.div>
  )
}

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Pro',
  BUSINESS: 'Business',
}

export function IAAgents() {
  const [enabledAgents, setEnabledAgents] = useState<Record<string, boolean>>({})
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/ia/settings').then(r => r.json()),
      fetch('/api/ia/quota').then(r => r.json()),
    ])
      .then(([settingsData, quotaData]) => {
        const config = settingsData.config || {}
        setEnabledAgents(config.enabledAgents || {})
        setQuotaInfo(quotaData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveConfig = useCallback(async (newEnabledAgents: Record<string, boolean>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/ia/settings')
      const data = await res.json()
      const existingConfig = data.config || {}

      await fetch('/api/ia/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: { ...existingConfig, enabledAgents: newEnabledAgents }
        })
      })
    } catch {
      // Silently fail
    } finally {
      setSaving(false)
    }
  }, [])

  const handleToggle = (id: string) => {
    if (!quotaInfo) return

    const currentlyEnabled = Object.entries(enabledAgents).filter(([, v]) => v).map(([k]) => k)
    const isEnabling = !enabledAgents[id]

    // Check agent limit when enabling
    if (isEnabling && quotaInfo.agentLimit !== -1 && currentlyEnabled.length >= quotaInfo.agentLimit) {
      return // Can't enable more agents than the limit
    }

    const newState = { ...enabledAgents, [id]: !enabledAgents[id] }
    setEnabledAgents(newState)
    saveConfig(newState)
  }

  const activeCount = AGENT_DEFS.filter(a => enabledAgents[a.id]).length
  const agentLimit = quotaInfo?.agentLimit ?? 0
  const tier = quotaInfo?.tier || 'FREE'
  const isFree = tier === 'FREE'

  // Determine which agents are locked (beyond the limit)
  const enabledIds = AGENT_DEFS.filter(a => enabledAgents[a.id]).map(a => a.id)

  function isLocked(agentId: string): boolean {
    if (isFree) return true
    if (agentLimit === -1) return false // BUSINESS = unlimited
    // If already enabled, not locked
    if (enabledAgents[agentId]) return false
    // If at the limit and not enabled, locked
    return enabledIds.length >= agentLimit
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Agentes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {activeCount} de {agentLimit === -1 ? AGENT_DEFS.length : agentLimit} agentes
            {agentLimit !== -1 && ` (${TIER_LABELS[tier]})`}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
          <Bot className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-medium text-zinc-400">Sofia IA</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400">Conectada</span>
        </div>
      </div>

      {/* Upgrade banner for FREE tier */}
      {isFree && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">Upgrade para ativar agentes</span>
          </div>
          <p className="text-xs text-amber-400/70 mb-3">
            No plano Free, você pode visualizar os agentes mas não ativá-los. Faça upgrade para Starter (1 agente), Pro (3 agentes) ou Business (ilimitados).
          </p>
          <Link
            href="/dashboard/billing/plans"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-colors"
          >
            <Crown className="h-3 w-3" />
            Ver Planos
          </Link>
        </div>
      )}

      {/* Agent limit info for STARTER/PRO */}
      {!isFree && agentLimit !== -1 && (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-3 mb-6">
          <p className="text-xs text-zinc-500">
            Plano <span className="text-zinc-300 font-semibold">{TIER_LABELS[tier]}</span> — {activeCount}/{agentLimit} agentes ativos.
            {activeCount >= agentLimit && ' Faça upgrade para ativar mais agentes.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {AGENT_DEFS.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            enabled={!!enabledAgents[agent.id]}
            onToggle={handleToggle}
            locked={isLocked(agent.id)}
            saving={saving}
          />
        ))}
      </div>
    </div>
  )
}
