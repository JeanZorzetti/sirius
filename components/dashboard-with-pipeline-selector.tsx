'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { KanbanBoard } from '@/components/kanban-board'
import { PipelineSelector } from '@/components/pipelines/pipeline-selector'
import { CreateDealDialog } from '@/components/deals/create-deal-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ExportButtons } from '@/components/ui/export-buttons'
import { UsageLimitsBanner } from '@/components/plan/usage-limits-banner'
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

type PlanLimits = {
  plan: 'FREE' | 'PRO'
  limits: {
    maxContacts: number
    maxPipelines: number
    maxDeals: number
  }
  usage: {
    contacts: number
    pipelines: number
    deals: number
  }
  contactsUsagePercent: number
  pipelinesUsagePercent: number
  hasReachedContactLimit: boolean
  hasReachedPipelineLimit: boolean
  isApproachingContactLimit: boolean
  isApproachingPipelineLimit: boolean
}

type DashboardWithPipelineSelectorProps = {
  pipelines: Pipeline[]
  allStages: Stage[]
  contacts: Contact[]
  dealCount: number
  isPro: boolean
  isMember: boolean
  planLimits: PlanLimits
}

export function DashboardWithPipelineSelector({
  pipelines,
  allStages: initialStages,
  contacts,
  dealCount,
  isPro,
  isMember,
  planLimits
}: DashboardWithPipelineSelectorProps) {
  const router = useRouter()

  // Local state for optimistic updates
  const [localStages, setLocalStages] = useState<Stage[]>(initialStages)

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
    return localStages.filter(stage => stage.pipelineId === selectedPipelineId)
  }, [localStages, selectedPipelineId])

  const filteredDealCount = useMemo(() => {
    return filteredStages.flatMap(stage => stage.deals).length
  }, [filteredStages])

  const hasDeals = filteredDealCount > 0

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId)
  }

  // Optimistic UI callbacks
  const addDealOptimistic = useCallback((tempDeal: any) => {
    setLocalStages(prevStages =>
      prevStages.map(stage =>
        stage.id === tempDeal.stageId
          ? { ...stage, deals: [...stage.deals, tempDeal] }
          : stage
      )
    )
  }, [])

  const updateDealOptimistic = useCallback((dealId: string, updates: any) => {
    setLocalStages(prevStages =>
      prevStages.map(stage => ({
        ...stage,
        deals: stage.deals.map(deal =>
          deal.id === dealId ? { ...deal, ...updates } : deal
        )
      }))
    )
  }, [])

  const deleteDealOptimistic = useCallback((dealId: string) => {
    setLocalStages(prevStages =>
      prevStages.map(stage => ({
        ...stage,
        deals: stage.deals.filter(deal => deal.id !== dealId)
      }))
    )
  }, [])

  const rollbackDeal = useCallback((tempId: string) => {
    setLocalStages(prevStages =>
      prevStages.map(stage => ({
        ...stage,
        deals: stage.deals.filter(deal => deal.id !== tempId)
      }))
    )
  }, [])

  const syncWithServer = useCallback(() => {
    router.refresh()
  }, [router])

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
          {hasDeals && <ExportButtons resourceType="deals" />}
          <CreateDealDialog
            stages={filteredStages}
            contacts={contacts}
            dealCount={filteredDealCount}
            isPro={isPro}
            onOptimisticAdd={addDealOptimistic}
            onRollback={rollbackDeal}
            onSuccess={syncWithServer}
          />
        </div>
      </div>

      {/* Usage Limits Banner */}
      <UsageLimitsBanner
        plan={planLimits.plan}
        usage={planLimits.usage}
        limits={planLimits.limits}
        contactsUsagePercent={planLimits.contactsUsagePercent}
        pipelinesUsagePercent={planLimits.pipelinesUsagePercent}
        hasReachedContactLimit={planLimits.hasReachedContactLimit}
        hasReachedPipelineLimit={planLimits.hasReachedPipelineLimit}
        isApproachingContactLimit={planLimits.isApproachingContactLimit}
        isApproachingPipelineLimit={planLimits.isApproachingPipelineLimit}
      />

      {filteredStages.length > 0 ? (
        <KanbanBoard
          stages={filteredStages}
          contacts={contacts}
          onOptimisticUpdate={updateDealOptimistic}
          onOptimisticDelete={deleteDealOptimistic}
          onRollback={rollbackDeal}
          onSuccess={syncWithServer}
        />
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
