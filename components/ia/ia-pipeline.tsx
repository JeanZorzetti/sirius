'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Bot, User, ChevronDown } from 'lucide-react'

interface Deal {
  id: string
  title: string
  value: number | null
  contact: { id: string; name: string; company: string | null } | null
  user: { id: string; name: string | null } | null
  createdAt: string
  agentAction: {
    agentName: string
    actionType: string
    confidence: number
    status: string
    reasoning: string
    createdAt: string
  } | null
}

interface Stage {
  id: string
  name: string
  order: number
  deals: Deal[]
}

interface Pipeline {
  id: string
  name: string
  stages: Stage[]
}

interface IAPipelineProps {
  pipelines: Pipeline[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function DealCard({ deal }: { deal: Deal }) {
  const [showReasoning, setShowReasoning] = useState(false)
  const hasAgent = !!deal.agentAction

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'group rounded-lg border p-3 transition-all duration-200 hover:bg-zinc-800/60 cursor-pointer',
        hasAgent
          ? 'border-cyan-500/20 bg-zinc-900/60 shadow-[0_0_20px_-8px] shadow-cyan-500/10'
          : 'border-zinc-800/50 bg-zinc-900/40'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-200 truncate">{deal.title}</p>
          {deal.contact && (
            <p className="text-xs text-zinc-500 truncate mt-0.5">
              {deal.contact.name}{deal.contact.company ? ` · ${deal.contact.company}` : ''}
            </p>
          )}
        </div>
        {deal.value && (
          <span className="text-xs font-mono font-medium text-zinc-400 shrink-0">
            {formatCurrency(deal.value)}
          </span>
        )}
      </div>

      {/* Agent overlay */}
      {hasAgent && (
        <div className="mt-2 pt-2 border-t border-zinc-800/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[11px] font-medium text-cyan-400/80">{deal.agentAction!.agentName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'text-[11px] font-mono px-1.5 py-0.5 rounded',
                deal.agentAction!.confidence >= 0.8 ? 'text-emerald-400 bg-emerald-400/10' :
                deal.agentAction!.confidence >= 0.7 ? 'text-amber-400 bg-amber-400/10' :
                'text-red-400 bg-red-400/10'
              )}>
                {Math.round(deal.agentAction!.confidence * 100)}%
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowReasoning(!showReasoning) }}
                className="text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <ChevronDown className={cn('h-3 w-3 transition-transform', showReasoning && 'rotate-180')} />
              </button>
            </div>
          </div>

          {showReasoning && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-2 text-[11px] text-zinc-500 leading-relaxed bg-zinc-800/30 rounded p-2"
            >
              {deal.agentAction!.reasoning}
            </motion.p>
          )}
        </div>
      )}
    </motion.div>
  )
}

export function IAPipeline({ pipelines }: IAPipelineProps) {
  const [activePipeline, setActivePipeline] = useState(pipelines[0]?.id || '')
  const pipeline = pipelines.find(p => p.id === activePipeline) || pipelines[0]

  if (!pipeline) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-sm text-zinc-500">Nenhum pipeline encontrado.</p>
      </div>
    )
  }

  const totalValue = pipeline.stages.reduce((sum, s) =>
    sum + s.deals.reduce((ds, d) => ds + (d.value || 0), 0), 0
  )
  const totalDeals = pipeline.stages.reduce((sum, s) => sum + s.deals.length, 0)
  const agentDeals = pipeline.stages.reduce((sum, s) =>
    sum + s.deals.filter(d => d.agentAction).length, 0
  )

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 max-w-[1440px] mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Pipeline</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {totalDeals} deals · {formatCurrency(totalValue)} · {agentDeals} tocados por agentes
          </p>
        </div>

        {/* Pipeline selector */}
        {pipelines.length > 1 && (
          <div className="flex items-center gap-1">
            {pipelines.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePipeline(p.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
                  p.id === activePipeline
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/40'
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4 max-w-[1440px] mx-auto">
        {pipeline.stages.map(stage => {
          const stageValue = stage.deals.reduce((sum, d) => sum + (d.value || 0), 0)
          const stageAgentCount = stage.deals.filter(d => d.agentAction).length

          return (
            <div key={stage.id} className="flex-shrink-0 w-72">
              {/* Stage header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {stage.name}
                  </h3>
                  <span className="text-[11px] text-zinc-600 font-mono tabular-nums">
                    {stage.deals.length}
                  </span>
                </div>
                {stageAgentCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Bot className="h-3 w-3 text-cyan-500/60" />
                    <span className="text-[10px] text-cyan-500/60 font-mono">{stageAgentCount}</span>
                  </div>
                )}
              </div>

              {/* Stage value bar */}
              {stageValue > 0 && (
                <div className="mb-2 px-1">
                  <span className="text-[11px] text-zinc-600 font-mono">{formatCurrency(stageValue)}</span>
                </div>
              )}

              {/* Deals */}
              <div className="space-y-2">
                {stage.deals.map(deal => (
                  <DealCard key={deal.id} deal={deal} />
                ))}

                {stage.deals.length === 0 && (
                  <div className="rounded-lg border border-dashed border-zinc-800/50 p-6 flex items-center justify-center">
                    <span className="text-xs text-zinc-700">Vazio</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
