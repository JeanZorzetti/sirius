'use client'
import { useState } from 'react'
import { Plus, ChevronDown, Check } from 'lucide-react'
import { StageStories } from './stage-stories'
import { DealMobileCard } from './deal-mobile-card'
import { MobileListSection } from '@/components/mobile/list-section'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { PipelineDeal, PipelineStageWithDeals } from '@/lib/types/pipeline'

interface MobilePipelineListProps {
  stages: PipelineStageWithDeals[]
  pipelines?: Array<{ id: string; name: string; isDefault: boolean }>
  selectedPipelineId?: string
  onPipelineChange?: (id: string) => void
  onCreateDeal?: () => void
  onDealClick?: (deal: PipelineDeal) => void
}

export function MobilePipelineList({
  stages,
  pipelines = [],
  selectedPipelineId,
  onPipelineChange,
  onCreateDeal,
  onDealClick,
}: MobilePipelineListProps) {
  const [activeStageId, setActiveStageId] = useState<string | null>(
    stages[0]?.id ?? null
  )

  const activeStage = stages.find((s) => s.id === activeStageId)
  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId)

  // Reset active stage when stages change (pipeline switch)
  const prevStagesRef = stages
  if (activeStageId && !stages.find((s) => s.id === activeStageId) && stages.length > 0) {
    setActiveStageId(stages[0].id)
  }

  function formatTotal(v: number): string {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
    return `R$ ${v.toLocaleString('pt-BR')}`
  }

  return (
    <div className="flex flex-col">
      {/* Pipeline selector — mobile only, shown when há mais de 1 pipeline */}
      {pipelines.length > 1 && onPipelineChange && (
        <div className="px-3 pt-2 pb-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center justify-between gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 text-sm font-medium transition-colors active:bg-muted/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  <span className="truncate">{selectedPipeline?.name ?? 'Pipeline'}</span>
                  {selectedPipeline?.isDefault && (
                    <span className="shrink-0 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      Padrão
                    </span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[calc(100vw-1.5rem)]">
              {pipelines.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => onPipelineChange(p.id)}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn('h-2 w-2 shrink-0 rounded-full', p.id === selectedPipelineId ? 'bg-indigo-500' : 'bg-muted-foreground/40')} />
                    <span className="truncate">{p.name}</span>
                    {p.isDefault && (
                      <span className="shrink-0 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        Padrão
                      </span>
                    )}
                  </div>
                  {p.id === selectedPipelineId && (
                    <Check className="h-4 w-4 shrink-0 text-indigo-500" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Stage stories scroll */}
      <StageStories
        stages={stages}
        activeStageId={activeStageId}
        onSelect={setActiveStageId}
      />

      {/* Active stage deals */}
      {activeStage && (
        <MobileListSection
          label={activeStage.name}
          count={activeStage.deals.length}
          total={activeStage.deals.length > 0
            ? formatTotal(activeStage.deals.reduce((sum, d) => sum + (d.value ?? 0), 0))
            : undefined
          }
        >
          {activeStage.deals.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 sm:py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                <Plus className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nenhum deal nesta etapa</p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">Crie um deal para começar</p>
              </div>
              {onCreateDeal && (
                <button
                  onClick={onCreateDeal}
                  className="mt-1 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white active:scale-95 min-h-[44px]"
                >
                  + Novo deal
                </button>
              )}
            </div>
          ) : (
            <div className="md:grid md:grid-cols-2">
              {activeStage.deals.map((deal) => (
                <DealMobileCard
                  key={deal.id}
                  deal={deal}
                  onClick={onDealClick ? () => onDealClick(deal) : undefined}
                />
              ))}
            </div>
          )}
        </MobileListSection>
      )}
    </div>
  )
}
