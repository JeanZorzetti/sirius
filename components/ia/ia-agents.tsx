'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Bot, Zap, MessageSquare, GitBranch, Calendar, Search,
  Loader2, Lock, Crown, Pencil, ChevronRight,
  Home, MapPin, FileText, UserCheck, Handshake,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { AgentEditModal } from '@/components/ia/agent-edit-modal'
import type { AgentOverride } from '@/lib/agaas-types'
import { toast } from 'sonner'

interface VerticalDef {
  id: string
  label: string
  description: string
  icon: typeof Bot
  accentClasses: string
  iconClasses: string
}

// Add new verticals here — zero layout changes needed
const VERTICALS: Record<string, VerticalDef> = {
  'real-estate': {
    id: 'real-estate',
    label: 'Vertical Imobiliária',
    description: 'Agentes especializados para corretoras e imobiliárias. Ative os ideais para o seu fluxo de atendimento.',
    icon: Home,
    accentClasses: 'border-indigo-500/20 bg-indigo-500/5',
    iconClasses: 'text-indigo-400',
  },
}

interface AgentDef {
  id: string
  name: string
  description: string
  defaultPrompt: string
  icon: typeof Bot
  gradient: string
  borderColor: string
  capabilities: string[]
  triggers: string[]
  vertical?: string // key into VERTICALS
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
    borderColor: 'border-l-cyan-500',
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
    borderColor: 'border-l-violet-500',
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
    borderColor: 'border-l-amber-500',
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
    borderColor: 'border-l-emerald-500',
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
    borderColor: 'border-l-pink-500',
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
    borderColor: 'border-l-indigo-500',
    capabilities: ['Extração de critérios', 'Match de portfólio', 'Sugestões personalizadas', 'Envio via WhatsApp'],
    triggers: ['whatsapp.message.in'],
    vertical: 'real-estate',
  },
  {
    id: 'visit-scheduler',
    name: 'VisitScheduler',
    description: 'Detecta intenção de visita e propõe horários disponíveis no Google Calendar.',
    defaultPrompt: 'Você é um corretor de imóveis. O cliente demonstrou interesse em visitar um imóvel. Proponha horários de forma simpática e profissional.',
    icon: MapPin,
    gradient: 'from-teal-500 to-cyan-600',
    borderColor: 'border-l-teal-500',
    capabilities: ['Detecção de intenção', 'Check de agenda', 'Proposta de visita', 'Confirmação automática'],
    triggers: ['whatsapp.message.in'],
    vertical: 'real-estate',
  },
  {
    id: 'proposal-followup',
    name: 'ProposalFollowUp',
    description: 'Gera rascunhos de follow-up para propostas paradas. Sempre requer aprovação humana.',
    defaultPrompt: 'Você é um corretor de imóveis. Escreva um follow-up elegante e não insistente para retomar contato com um cliente que está avaliando uma proposta.',
    icon: FileText,
    gradient: 'from-amber-400 to-yellow-500',
    borderColor: 'border-l-amber-400',
    capabilities: ['Follow-up de proposta', 'Rascunho inteligente', 'Aprovação obrigatória', 'Timing estratégico'],
    triggers: ['deal.idle (estágio Proposta)'],
    vertical: 'real-estate',
  },
  {
    id: 'lead-profiler',
    name: 'LeadProfiler',
    description: 'Classifica o lead como COMPRADOR, VENDEDOR, LOCATARIO ou INVESTIDOR com base nas primeiras mensagens.',
    defaultPrompt: 'Você é um especialista em perfil de clientes imobiliários. Analise a conversa e classifique o lead em COMPRADOR, VENDEDOR, LOCATARIO ou INVESTIDOR.',
    icon: UserCheck,
    gradient: 'from-violet-500 to-indigo-500',
    borderColor: 'border-l-violet-500',
    capabilities: ['Classificação de perfil', 'Análise de intenção', 'Segmentação automática', 'Atualização de CRM'],
    triggers: ['whatsapp.message.in', 'contact.created'],
    vertical: 'real-estate',
  },
  {
    id: 'negotiation-assistant',
    name: 'NegotiationAssistant',
    description: 'Detecta objeções de preço/condição e sugere contra-propostas estratégicas. Sempre requer aprovação.',
    defaultPrompt: 'Você é um especialista em negociação imobiliária. Analise a objeção do cliente e sugira uma contra-proposta respeitosa e estratégica.',
    icon: Handshake,
    gradient: 'from-rose-500 to-pink-600',
    borderColor: 'border-l-rose-500',
    capabilities: ['Detecção de objeção', 'Contra-proposta', 'Aprovação obrigatória', 'Estratégia de negociação'],
    triggers: ['whatsapp.message.in'],
    vertical: 'real-estate',
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
  agentDescription: string
  agentGradient: string
  defaultPrompt: string
  currentOverride?: AgentOverride
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function AgentCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800/30 bg-zinc-900/30 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <Skeleton className="h-5 w-9 rounded-full" />
      </div>
      <div className="flex gap-1.5 mb-3">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-28 rounded-full" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>
    </div>
  )
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
  const visibleCaps = agent.capabilities.slice(0, 3)
  const extraCaps = agent.capabilities.length - 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative rounded-xl border border-l-2 transition-all duration-200',
        locked
          ? 'border-zinc-800/20 border-l-zinc-800/20 bg-zinc-900/20 opacity-40'
          : enabled
            ? `${agent.borderColor} border-t-zinc-700/50 border-r-zinc-700/50 border-b-zinc-700/50 bg-zinc-900/60 hover:bg-zinc-900/80 hover:border-t-zinc-600/60 hover:border-r-zinc-600/60 hover:border-b-zinc-600/60`
            : 'border-zinc-800/30 border-l-zinc-800/30 bg-zinc-900/30 opacity-60 hover:opacity-80'
      )}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shrink-0 transition-opacity',
              !enabled && !locked && 'opacity-50'
            )}>
              <div className={cn('h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center', agent.gradient)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'h-1.5 w-1.5 rounded-full shrink-0',
                  enabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                )} />
                <h3 className="text-sm font-semibold text-zinc-200 truncate">
                  {overrideName || agent.name}
                </h3>
                {overrideName && overrideName !== agent.name && (
                  <span className="text-[10px] text-zinc-600 font-mono shrink-0">({agent.name})</span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 max-w-xs">{agent.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {!locked && (
              <button
                onClick={() => onEdit(agent)}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all opacity-0 group-hover:opacity-100"
                title="Editar agente"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {locked ? (
              <Lock className="h-4 w-4 text-zinc-700" />
            ) : (
              <Switch
                checked={enabled}
                onCheckedChange={() => onToggle(agent.id)}
                disabled={saving}
                className="data-[state=checked]:bg-cyan-500"
              />
            )}
          </div>
        </div>

        {/* Triggers */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold shrink-0">Triggers</span>
          {agent.triggers.map(t => (
            <span key={t} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/30 text-zinc-400">
              {t}
            </span>
          ))}
        </div>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1.5">
          {visibleCaps.map(cap => (
            <span key={cap} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/60 text-zinc-400 border border-zinc-700/30">
              {cap}
            </span>
          ))}
          {extraCaps > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/40 text-zinc-600 border border-zinc-700/20">
              +{extraCaps}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function VerticalSection({
  vertical,
  agents,
  enabledAgents,
  isLocked,
  saving,
  agentOverrides,
  onToggle,
  onEdit,
  forceExpand,
}: {
  vertical: VerticalDef
  agents: AgentDef[]
  enabledAgents: Record<string, boolean>
  isLocked: (id: string) => boolean
  saving: boolean
  agentOverrides: Record<string, AgentOverride>
  onToggle: (id: string) => void
  onEdit: (agent: AgentDef) => void
  forceExpand?: boolean
}) {
  const [collapsed, setCollapsed] = useState(true)
  const Icon = vertical.icon
  const enabledCount = agents.filter(a => enabledAgents[a.id]).length
  const isOpen = forceExpand || !collapsed

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
          vertical.accentClasses,
          'hover:brightness-110'
        )}
      >
        <div className="flex items-center gap-2.5">
          <ChevronRight className={cn(
            'h-4 w-4 transition-transform duration-200',
            vertical.iconClasses,
            isOpen && 'rotate-90'
          )} />
          <Icon className={cn('h-4 w-4', vertical.iconClasses)} />
          <span className="text-sm font-semibold text-zinc-200">{vertical.label}</span>
          {enabledCount > 0 && (
            <span className="text-[11px] text-emerald-400 font-medium">
              {enabledCount} {enabledCount === 1 ? 'ativo' : 'ativos'}
            </span>
          )}
        </div>
        <span className={cn('text-[11px] font-mono', vertical.iconClasses)}>
          {agents.length} agentes
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-3 space-y-3">
              {sortAgents(agents, enabledAgents, isLocked).map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  enabled={!!enabledAgents[agent.id]}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  locked={isLocked(agent.id)}
                  saving={saving}
                  overrideName={agentOverrides[agent.id]?.displayName}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Pro',
  BUSINESS: 'Business',
}

function sortAgents(agents: AgentDef[], enabledAgents: Record<string, boolean>, isLockedFn: (id: string) => boolean) {
  return [...agents].sort((a, b) => {
    const aEnabled = !!enabledAgents[a.id]
    const bEnabled = !!enabledAgents[b.id]
    const aLocked = isLockedFn(a.id)
    const bLocked = isLockedFn(b.id)
    if (aEnabled && !bEnabled) return -1
    if (!aEnabled && bEnabled) return 1
    if (!aLocked && bLocked) return -1
    if (aLocked && !bLocked) return 1
    return 0
  })
}

export function IAAgents() {
  const [enabledAgents, setEnabledAgents] = useState<Record<string, boolean>>({})
  const [agentOverrides, setAgentOverrides] = useState<Record<string, AgentOverride>>({})
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [search, setSearch] = useState('')

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

      const response = await fetch('/api/ia/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: { ...existingConfig, enabledAgents: newEnabledAgents }
        })
      })
      if (!response.ok) throw new Error()
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }, [])

  const handleToggle = (id: string) => {
    if (!quotaInfo) return

    const currentlyEnabled = Object.entries(enabledAgents).filter(([, v]) => v).map(([k]) => k)
    const isEnabling = !enabledAgents[id]

    if (isEnabling && quotaInfo.agentLimit !== -1 && currentlyEnabled.length >= quotaInfo.agentLimit) {
      toast.error(`Limite de ${quotaInfo.agentLimit} agente${quotaInfo.agentLimit !== 1 ? 's' : ''} atingido. Faça upgrade para ativar mais.`)
      return
    }

    const agentDef = AGENT_DEFS.find(a => a.id === id)
    const label = agentDef?.name || id

    const newState = { ...enabledAgents, [id]: !enabledAgents[id] }
    setEnabledAgents(newState)
    saveConfig(newState)

    if (isEnabling) {
      toast.success(`${label} ativado`)
    } else {
      toast(`${label} desativado`)
    }
  }

  const handleEdit = (agent: AgentDef) => {
    setEditState({
      agentId: agent.id,
      agentName: agent.name,
      agentDescription: agent.description,
      agentGradient: agent.gradient,
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
  const isUnlimited = agentLimit === -1

  const enabledIds = AGENT_DEFS.filter(a => enabledAgents[a.id]).map(a => a.id)

  function isLocked(agentId: string): boolean {
    if (isFree) return true
    if (isUnlimited) return false
    if (enabledAgents[agentId]) return false
    return enabledIds.length >= agentLimit
  }

  const quotaUsed = quotaInfo?.used ?? 0
  const quotaTotal = quotaInfo?.quota ?? 0
  const quotaPct = quotaTotal > 0 ? Math.min(100, Math.round((quotaUsed / quotaTotal) * 100)) : 0
  const quotaBarColor = quotaPct >= 90 ? 'bg-red-500' : quotaPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
  const resetDays = daysUntil(quotaInfo?.resetsAt ?? null)

  const searchTerm = search.trim().toLowerCase()

  const matchesSearch = (agent: AgentDef) => {
    if (!searchTerm) return true
    return (
      agent.name.toLowerCase().includes(searchTerm) ||
      agent.description.toLowerCase().includes(searchTerm) ||
      agent.capabilities.some(c => c.toLowerCase().includes(searchTerm))
    )
  }

  const coreAgents = AGENT_DEFS.filter(a => !a.vertical && matchesSearch(a))

  // Build vertical groups dynamically — order follows VERTICALS dict insertion order
  const verticalGroups = Object.values(VERTICALS).map(v => ({
    vertical: v,
    agents: AGENT_DEFS.filter(a => a.vertical === v.id && matchesSearch(a)),
  })).filter(g => g.agents.length > 0)

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="space-y-2 w-48">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-3 mb-8">
          {[0, 1, 2].map(i => <AgentCardSkeleton key={i} />)}
        </div>
        <div className="space-y-3">
          {[0, 1].map(i => <AgentCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Agentes</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-zinc-500">
              {activeCount} de {isUnlimited ? AGENT_DEFS.length : agentLimit} ativos
              {!isUnlimited && ` · ${TIER_LABELS[tier]}`}
            </p>
            <span className="text-zinc-700">·</span>
            <div className="flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs text-zinc-500">Sofia IA</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Quota bar */}
        {!isFree && (
          <div className="shrink-0 w-52">
            {isUnlimited ? (
              <div className="text-right">
                <p className="text-xs text-zinc-500 mb-1">Ações este mês</p>
                <p className="text-sm font-semibold text-zinc-300">Ilimitado ∞</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-zinc-500">Ações este mês</p>
                  <p className="text-xs font-mono text-zinc-400">{quotaUsed.toLocaleString('pt-BR')} / {quotaTotal.toLocaleString('pt-BR')}</p>
                </div>
                <Progress
                  value={quotaPct}
                  className={cn('h-1.5 bg-zinc-800', `[&>div]:${quotaBarColor}`)}
                />
                {resetDays !== null && (
                  <p className="text-[11px] text-zinc-600 mt-1 text-right">
                    Reset em {resetDays} dia{resetDays !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
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
      {!isFree && !isUnlimited && (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-3 mb-6">
          <p className="text-xs text-zinc-500">
            Plano <span className="text-zinc-300 font-semibold">{TIER_LABELS[tier]}</span> — {activeCount}/{agentLimit} agentes ativos.
            {activeCount >= agentLimit && ' Faça upgrade para ativar mais agentes.'}
          </p>
        </div>
      )}

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar agente por nome ou capacidade..."
          className="pl-9 bg-zinc-900/60 border-zinc-800/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500 focus-visible:border-zinc-700"
        />
      </div>

      {/* Core agents */}
      {coreAgents.length > 0 && (
        <div className="space-y-3 mb-10">
          {sortAgents(coreAgents, enabledAgents, isLocked).map(agent => (
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
      )}

      {/* Vertical sections — collapsible, auto-expanded when searching */}
      {verticalGroups.map(({ vertical, agents }) => (
        <VerticalSection
          key={vertical.id}
          vertical={vertical}
          agents={agents}
          enabledAgents={enabledAgents}
          isLocked={isLocked}
          saving={saving}
          agentOverrides={agentOverrides}
          onToggle={handleToggle}
          onEdit={handleEdit}
          forceExpand={!!searchTerm}
        />
      ))}

      {/* No results */}
      {searchTerm && coreAgents.length === 0 && verticalGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-8 w-8 text-zinc-700 mb-3" />
          <p className="text-zinc-500 font-medium">Nenhum agente encontrado</p>
          <p className="text-xs text-zinc-700 mt-1">Tente buscar por outro termo</p>
        </div>
      )}

      {/* Edit modal */}
      {editState && (
        <AgentEditModal
          open={!!editState}
          onOpenChange={open => { if (!open) setEditState(null) }}
          agentId={editState.agentId}
          agentName={editState.agentName}
          agentDescription={editState.agentDescription}
          agentGradient={editState.agentGradient}
          defaultPrompt={editState.defaultPrompt}
          currentOverride={editState.currentOverride}
          onSaved={handleOverrideSaved}
        />
      )}
    </div>
  )
}
