'use client'

import { useState, useMemo } from 'react'
import { KanbanBoard } from '@/components/kanban-board'
import { PipelineSelector } from '@/components/pipelines/pipeline-selector'
import { CreateDealDialog } from '@/components/deals/create-deal-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { DollarSign } from 'lucide-react'

type Pipeline = {
  id: string
  name: string
  isDefault: boolean
  _count: {
    stages: number
    deals: number
  }
}

type Stage = {
  id: string
  name: string
  order: number
  pipelineId: string
  deals: any[]
  createdAt: string
  updatedAt: string
}

type Contact = {
  id: string
  name: string
  phone?: string | null
}

type DashboardWithPipelineSelectorProps = {
  pipelines: Pipeline[]
  allStages: Stage[]
  contacts: Contact[]
  dealCount: number
  isPro: boolean
  isMember: boolean
}

export function DashboardWithPipelineSelector({
  pipelines,
  allStages,
  contacts,
  dealCount,
  isPro,
  isMember
}: DashboardWithPipelineSelectorProps) {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(() => {
    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedPipelineId')
      if (stored && pipelines.find(p => p.id === stored)) {
        return stored
      }
    }
    // Fallback to default pipeline
    const defaultPipeline = pipelines.find(p => p.isDefault)
    return defaultPipeline ? defaultPipeline.id : pipelines[0]?.id || ''
  })

  // Filter stages and deals by selected pipeline
  const filteredStages = useMemo(() => {
    return allStages.filter(stage => stage.pipelineId === selectedPipelineId)
  }, [allStages, selectedPipelineId])

  const filteredDealCount = useMemo(() => {
    return filteredStages.flatMap(stage => stage.deals).length
  }, [filteredStages])

  const hasDeals = filteredDealCount > 0

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId)
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Pipeline</h2>
          {isMember ? (
            <span className="px-2 py-1 rounded-full bg-zinc-800 text-xs font-medium text-zinc-400 border border-zinc-700">
              👤 Meus Negócios
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full bg-indigo-500/10 text-xs font-medium text-indigo-400 border border-indigo-500/20">
              🏢 Visão Global
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <PipelineSelector
            pipelines={pipelines}
            onPipelineChange={handlePipelineChange}
          />
          <CreateDealDialog
            stages={filteredStages}
            contacts={contacts}
            dealCount={filteredDealCount}
            isPro={isPro}
          />
        </div>
      </div>

      {filteredStages.length > 0 ? (
        <KanbanBoard stages={filteredStages} contacts={contacts} />
      ) : (
        <EmptyState
          icon={DollarSign}
          title="Nenhuma etapa configurada"
          description="Crie etapas no pipeline para começar a organizar seus negócios"
        />
      )}
    </div>
  )
}
