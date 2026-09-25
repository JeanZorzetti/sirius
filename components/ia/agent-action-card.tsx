'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Bot, CheckCircle2, XCircle, Clock, AlertTriangle,
  Undo2, Eye, ChevronDown
} from 'lucide-react'
import { useState } from 'react'

interface AgentActionCardProps {
  action: {
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
  }
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onRevert?: (id: string) => void
}

const agentColors: Record<string, string> = {
  LeadQualifier: 'from-cyan-500 to-blue-500',
  FollowUpCoordinator: 'from-violet-500 to-purple-500',
  DealStageAnalyzer: 'from-amber-500 to-orange-500',
  MeetingScheduler: 'from-emerald-500 to-green-500',
  ContactEnricher: 'from-pink-500 to-rose-500',
  // Real estate vertical
  PropertyMatcher: 'from-indigo-500 to-blue-600',
  VisitScheduler: 'from-teal-500 to-cyan-600',
  ProposalFollowUp: 'from-amber-400 to-yellow-500',
  LeadProfiler: 'from-violet-500 to-indigo-500',
  NegotiationAssistant: 'from-rose-500 to-pink-600',
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  SUCCESS: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Executado' },
  FAILED: { icon: XCircle, color: 'text-red-400', label: 'Falhou' },
  PENDING: { icon: Clock, color: 'text-zinc-400', label: 'Pendente' },
  NEEDS_APPROVAL: { icon: AlertTriangle, color: 'text-amber-400', label: 'Aguardando aprovação' },
}

/** Agents whose approval sends a WhatsApp message to the contact. */
const ENVIAM_MENSAGEM = new Set(['FollowUpCoordinator', 'MeetingScheduler', 'PropertyMatcher', 'VisitScheduler'])

/** What approving this action does, in words, from the draft written when it was proposed (spec 011). */
function resumoDaProposta(action: AgentActionCardProps['action']): { titulo: string; texto: string } | null {
  const r = action.output?.rascunho
  if (!r) {
    if (action.output?.erroRascunho) {
      return {
        titulo: 'Sem rascunho',
        texto: ENVIAM_MENSAGEM.has(action.agentName)
          ? 'O rascunho não foi escrito. Aprovar escreve a mensagem e envia na mesma hora, sem revisão.'
          : 'O rascunho não foi escrito. Aprovar gera a proposta e aplica na mesma hora.',
      }
    }
    return null
  }
  if (ENVIAM_MENSAGEM.has(action.agentName) && r.message) return { titulo: 'Mensagem que será enviada', texto: String(r.message) }
  if (r.message) return { titulo: 'Rascunho (aprovar não envia)', texto: String(r.message) }
  if (action.agentName === 'LeadQualifier') {
    return { titulo: 'Proposta', texto: `Abrir o negócio "${r.suggestedDealTitle ?? 'sem título'}"${Number(r.suggestedDealValue) > 0 ? ` com valor sugerido de R$ ${Number(r.suggestedDealValue).toLocaleString('pt-BR')}` : ', sem valor'}.` }
  }
  if (action.agentName === 'DealStageAnalyzer') {
    return r.shouldMove
      ? { titulo: 'Proposta', texto: `Mover de "${r.previousStage ?? '?'}" para "${r.suggestedStage}".` }
      : { titulo: 'Proposta', texto: `Manter em "${r.previousStage ?? r.suggestedStage}".` }
  }
  if (action.agentName === 'ContactEnricher') {
    return { titulo: 'Sugestão (o contato não muda)', texto: [r.company && `Empresa: ${r.company}`, r.jobTitle && `Cargo: ${r.jobTitle}`, r.notes].filter(Boolean).join(' · ') || 'Nada a sugerir.' }
  }
  if (action.agentName === 'LeadProfiler') {
    return { titulo: 'Sugestão (o contato não muda)', texto: `Perfil: ${r.profile}${r.profileNotes ? ` · ${r.profileNotes}` : ''}` }
  }
  return null
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin} min`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d`
}

function formatActionType(type: string): string {
  return type.toLowerCase().replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export function AgentActionCard({ action, onApprove, onReject, onRevert }: AgentActionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const gradient = agentColors[action.agentName] || 'from-zinc-500 to-zinc-600'
  const status = statusConfig[action.status] || statusConfig.PENDING
  const StatusIcon = status.icon
  const needsApproval = action.status === 'NEEDS_APPROVAL'
  const proposta = needsApproval ? resumoDaProposta(action) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative rounded-xl border bg-zinc-900/50 backdrop-blur-sm transition-all duration-200 hover:bg-zinc-900/80',
        needsApproval ? 'border-amber-500/30' : 'border-zinc-800/50'
      )}
    >
      {/* Glow for pending approval */}
      {needsApproval && (
        <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 blur-sm pointer-events-none" />
      )}

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Agent avatar */}
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br', gradient)}>
              <Bot className="h-4 w-4 text-white" />
            </div>

            {/* Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-200">{action.agentName}</span>
                <span className="text-xs text-zinc-600">
                  {formatActionType(action.actionType)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                {action.entityType} · {action.entityId.slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            <StatusIcon className={cn('h-4 w-4', status.color)} aria-label={status.label} />
            <span className="text-[11px] text-zinc-600 font-mono tabular-nums">
              {formatTimeAgo(action.createdAt)}
            </span>
          </div>
        </div>

        {/* What approving does: the draft the person is about to approve */}
        {proposta && (
          <div className="mt-3 rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{proposta.titulo}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap">{proposta.texto}</p>
          </div>
        )}

        {/* Actions bar */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all duration-200"
          >
            <Eye className="h-3.5 w-3.5" />
            Raciocínio
            <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
          </button>

          {needsApproval && (
            <>
              <button
                onClick={() => onApprove?.(action.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-400 hover:bg-emerald-400/10 transition-all duration-200"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aprovar
              </button>
              <button
                onClick={() => onReject?.(action.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-red-400 hover:bg-red-400/10 transition-all duration-200"
              >
                <XCircle className="h-3.5 w-3.5" />
                Rejeitar
              </button>
            </>
          )}

          {action.status === 'SUCCESS' && (
            <button
              onClick={() => onRevert?.(action.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Reverter
            </button>
          )}
        </div>

        {/* Expanded reasoning */}
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30 p-3"
          >
            <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
              {action.reasoning}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
