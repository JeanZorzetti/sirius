'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Bot, Zap, MessageSquare, GitBranch, Calendar, Search,
  ToggleLeft, ToggleRight, Loader2, Lock, Crown, Pencil,
  Home, MapPin, FileText, UserCheck, Handshake,
} from 'lucide-react'
import Link from 'next/link'
import { AgentEditModal } from '@/components/ia/agent-edit-modal'
import type { AgentOverride } from '@/lib/agaas-types'

interface AgentDef {
  id: string
  name: string
  description: string
  defaultPrompt: string
  icon: typeof Bot
  gradient: string
  capabilities: string[]
  triggers: string[]
  vertical?: string
}

const AGENT_DEFS: AgentDef[] = [
  // ── Core agents ──────────────────────────────────────────────────────
  {
    id: 'lead-qualifier',
    name: 'LeadQualifier',
    description: 'Qualifica leads via WhatsApp usando frameworks BANT/SPIN. Cria deals e roteia para vendedores.',
    defaultPrompt: 'Você é um analista de vendas B2B. Analise a conversa e qualifique o lead usando critérios BANT.',
    icon: Zap,
    gradient: 'from-cyan-500 to-blue-500',
    capabilities: ['Qualificação BANT', 'Análise SPIN', 'Criação de Deal', 'Roteamento automático'],
    triggers: ['whatsapp.message.in', 'contact.created'],
  },
  {
    id: 'followup-coordinator',
    name: 'FollowUpCoordinator',
    description: 'Envia follow-ups personalizados em deals parados. Mensagens contextuais, não templates.',
    defaultPrompt: 'Você é um vendedor B2B experiente. Escreva uma mensagem de follow-up natural e personalizada para retomar o contato.',
    icon: MessageSquare,
    gradient: 'from-violet-500 to-purple-500',
    capabilities: ['Follow-up inteligente', 'Análise de contexto', 'Mensagens personalizadas', 'Timing adaptativo'],
    triggers: ['deal.idle'],
  },
  {
    id: 'deal-stage-analyzer',
    name: 'DealStageAnalyzer',
    description: 'Analisa conversas para detectar intenção de compra e mover deals de estágio automaticamente.',
    defaultPrompt: 'Você é um analista de pipeline de vendas B2B. Analise a conversa e determine se o deal deve avançar de estágio.',
    icon: GitBranch,
    gradient: 'from-amber-500 to-orange-500',
    capabilities: ['Análise de sentimento', 'Detecção de intenção', 'Movimentação automática', 'Sugestões de próximo passo'],
    triggers: ['note.created', 'whatsapp.message.in'],
  },
  {
    id: 'meeting-scheduler',
    name: 'MeetingScheduler',
    description: 'Verifica disponibilidade no Google Calendar e propõe horários para reuniões com prospects.',
    defaultPrompt: 'Você é um assistente de vendas. Escreva uma mensagem curta e profissional propondo horários de reunião para um prospect.',
    icon: Calendar,
    gradient: 'from-emerald-500 to-green-500',
    capabilities: ['Check de disponibilidade', 'Proposta de horários', 'Agendamento automático', 'Confirmação via WhatsApp'],
    triggers: ['Delegação de outros agentes'],
  },
  {
    id: 'contact-enricher',
    name: 'ContactEnricher',
    description: 'Enriquece contatos com dados públicos da web. Adiciona cargo, empresa, LinkedIn e insights.',
    defaultPrompt: 'Você é um analista de inteligência comercial. Com base no nome, telefone e email, infira o perfil profissional mais provável.',
    icon: Search,
    gradient: 'from-pink-500 to-rose-500',
    capabilities: ['Busca web', 'Enriquecimento de dados', 'Perfil profissional', 'Insights de empresa'],
    triggers: ['contact.created'],
  },
  // ── Vertical: Imobiliária ─────────────────────────────────────────────
  {
    id: 'property-matcher',
    name: 'PropertyMatcher',
    description: 'Extrai critérios de busca da conversa e sugere imóveis compatíveis do portfólio.',
    defaultPrompt: 'Você é um corretor de imóveis experiente. Analise a conversa, extraia os critérios de busca do cliente e sugira os imóveis mais compatíveis do portfólio.',
    icon: Home,
    gradient: 'from-indigo-500 to-blue-600',
    capabilities: ['Extração de critérios', 'Match de portfólio', 'Sugestões personalizadas', 'Envio via WhatsApp'],
    triggers: ['whatsapp.message.in'],
    vertical: 'Imobiliária',
  },
  {
    id: 'visit-scheduler',
    name: 'VisitScheduler',
    description: 'Detecta intenção de visita e propõe horários disponíveis no Google Calendar.',
    defaultPrompt: 'Você é um corretor de imóveis. O cliente demonstrou interesse em visitar um imóvel. Proponha horários de forma simpática e profissional.',
    icon: MapPin,
    gradient: 'from-teal-500 to-cyan-600',
    capabilities: ['Detecção de intenção', 'Check de agenda', 'Proposta de visita', 'Confirmação automática'],
    triggers: ['whatsapp.message.in'],
    vertical: 'Imobiliária',
  },
  {
    id: 'proposal-followup',
    name: 'ProposalFollowUp',
    description: 'Gera rascunhos de follow-up para propostas paradas. Sempre requer aprovação humana.',
    defaultPrompt: 'Você é um corretor de imóveis. Escreva um follow-up elegante e não insistente para retomar contato com um cliente que está avaliando uma proposta.',
    icon: FileText,
    gradient: 'from-amber-400 to-yellow-500',
    capabilities: ['Follow-up de proposta', 'Rascunho inteligente', 'Aprovação obrigatória', 'Timing estratégico'],
    triggers: ['deal.idle (estágio Proposta)'],
    vertical: 'Imobiliária',
  },
  {
    id: 'lead-profiler',
    name: 'LeadProfiler',
    description: 'Classifica o lead como COMPRADOR, VENDEDOR, LOCATARIO ou INVESTIDOR com base nas primeiras mensagens.',
    defaultPrompt: 'Você é um especialista em perfil de clientes imobiliários. Analise a conversa e classifique o lead em COMPRADOR, VENDEDOR, LOCATARIO ou INVESTIDOR.',
    icon: UserCheck,
    gradient: 'from-violet-500 to-indigo-500',
    capabilities: ['Classificação de perfil', 'Análise de intenção', 'Segmentação automática', 'Atualização de CRM'],
    triggers: ['whatsapp.message.in', 'contact.created'],
    vertical: 'Imobiliária',
  },
  {
    id: 'negotiation-assistant',
    name: 'NegotiationAssistant',
    description: 'Detecta objeções de preço/condição e sugere contra-propostas estratégicas. Sempre requer aprovação.',
    defaultPrompt: 'Você é um especialista em negociação imobiliária. Analise a objeção do cliente e sugira uma contra-proposta respeitosa e estratégica.',
    icon: Handshake,
    gradient: 'from-rose-500 to-pink-600',
    capabilities: ['Detecção de objeção', 'Contra-proposta', 'Aprovação obrigatória', 'Estratégia de negociação'],
    triggers: ['whatsapp.message.in'],
    vertical: 'Imobiliária',
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

interface EditState {
  agentId: string
  agentName: string
  defaultPrompt: string
  currentOverride?: AgentOverride
}

function AgentCard({ agent, enabled, onToggle, onEdit, locked, saving, overrideName }: {
  agent: AgentDef
  enabled: boolean
  onToggle: (id: string) => void
  onEdit: (agent: AgentDef) => void
  locked: boolean
  saving: boolean
  overrideName?: string
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
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shrink-0', agent.gradient)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-200">{overrideName || agent.name}</h3>
              {overrideName && overrideName !== agent.name && (
                <span className="text-[10px] text-zinc-600 font-mono">({agent.name})</span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 max-w-sm">{agent.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {!locked && (
            <button
              onClick={() => onEdit(agent)}
              className="p-1.5 rounded-lg hover:bg-zinc-800/60 text-zinc-600 hover:text-zinc-300 transition-colors"
              title="Editar agente"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {locked ? (
            <Lock className="h-5 w-5 text-zinc-700" />
          ) : (
            <button
              onClick={() => onToggle(agent.id)}
              disabled={saving}
              className="disabled:opacity-50"
            >
              {enabled ? (
                <ToggleRight className="h-6 w-6 text-cyan-400" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-zinc-600" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {agent.capabilities.map(cap => (
          <span key={cap} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/60 text-zinc-400 border border-zinc-700/30">
            {cap}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
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
  const [agentOverrides, setAgentOverrides] = useState<Record<string, AgentOverride>>({})
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/ia/settings').then(r => r.json()),
      fetch('/api/ia/quota').then(r => r.json()),
    ])
      .then(([settingsData, quotaData]) => {
        const config = settingsData.config || {}
        setEnabledAgents(config.enabledAgents || {})
        setAgentOverrides(config.agentOverrides || {})
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

    if (isEnabling && quotaInfo.agentLimit !== -1 && currentlyEnabled.length >= quotaInfo.agentLimit) {
      return
    }

    const newState = { ...enabledAgents, [id]: !enabledAgents[id] }
    setEnabledAgents(newState)
    saveConfig(newState)
  }

  const handleEdit = (agent: AgentDef) => {
    setEditState({
      agentId: agent.id,
      agentName: agent.name,
      defaultPrompt: agent.defaultPrompt,
      currentOverride: agentOverrides[agent.id],
    })
  }

  const handleOverrideSaved = (agentId: string, override: AgentOverride | null) => {
    setAgentOverrides(prev => {
      const next = { ...prev }
      if (override === null) {
        delete next[agentId]
      } else {
        next[agentId] = override
      }
      return next
    })
  }

  const activeCount = AGENT_DEFS.filter(a => enabledAgents[a.id]).length
  const agentLimit = quotaInfo?.agentLimit ?? 0
  const tier = quotaInfo?.tier || 'FREE'
  const isFree = tier === 'FREE'

  const enabledIds = AGENT_DEFS.filter(a => enabledAgents[a.id]).map(a => a.id)

  function isLocked(agentId: string): boolean {
    if (isFree) return true
    if (agentLimit === -1) return false
    if (enabledAgents[agentId]) return false
    return enabledIds.length >= agentLimit
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
      </div>
    )
  }

  const coreAgents = AGENT_DEFS.filter(a => !a.vertical)
  const reAgents = AGENT_DEFS.filter(a => a.vertical === 'Imobiliária')

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

      {/* Core agents */}
      <div className="space-y-3 mb-8">
        {coreAgents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            enabled={!!enabledAgents[agent.id]}
            onToggle={handleToggle}
            onEdit={handleEdit}
            locked={isLocked(agent.id)}
            saving={saving}
            overrideName={agentOverrides[agent.id]?.displayName}
          />
        ))}
      </div>

      {/* Real estate vertical */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-semibold text-zinc-300">Vertical Imobiliária</span>
          </div>
          <div className="flex-1 h-px bg-zinc-800/60" />
          <span className="text-[11px] text-zinc-600 font-mono">5 agentes</span>
        </div>
        <div className="space-y-3">
          {reAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              enabled={!!enabledAgents[agent.id]}
              onToggle={handleToggle}
              onEdit={handleEdit}
              locked={isLocked(agent.id)}
              saving={saving}
              overrideName={agentOverrides[agent.id]?.displayName}
            />
          ))}
        </div>
      </div>

      {/* Edit modal */}
      {editState && (
        <AgentEditModal
          open={!!editState}
          onOpenChange={open => { if (!open) setEditState(null) }}
          agentId={editState.agentId}
          agentName={editState.agentName}
          defaultPrompt={editState.defaultPrompt}
          currentOverride={editState.currentOverride}
          onSaved={handleOverrideSaved}
        />
      )}
    </div>
  )
}
