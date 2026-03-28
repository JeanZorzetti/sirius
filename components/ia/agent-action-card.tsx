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
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  SUCCESS: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Executado' },
  FAILED: { icon: XCircle, color: 'text-red-400', label: 'Falhou' },
  PENDING: { icon: Clock, color: 'text-zinc-400', label: 'Pendente' },
  NEEDS_APPROVAL: { icon: AlertTriangle, color: 'text-amber-400', label: 'Aguardando aprovação' },
}

function ConfidenceBadge({ value }: { value: number }) {
  const percent = Math.round(value * 100)
  const color = value >= 0.8 ? 'text-emerald-400' : value >= 0.7 ? 'text-amber-400' : 'text-red-400'
  const bgColor = value >= 0.8 ? 'bg-emerald-400/10' : value >= 0.7 ? 'bg-amber-400/10' : 'bg-red-400/10'

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium', color, bgColor)}>
      {percent}%
    </span>
  )
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
            <ConfidenceBadge value={action.confidence} />
            <StatusIcon className={cn('h-4 w-4', status.color)} />
            <span className="text-[11px] text-zinc-600 font-mono tabular-nums">
              {formatTimeAgo(action.createdAt)}
            </span>
          </div>
        </div>

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
