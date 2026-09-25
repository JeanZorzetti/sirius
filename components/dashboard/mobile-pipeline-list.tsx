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
import { dinheiroCompacto, resumirEtapa } from '@/lib/pipeline/hoje'
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

  // Honest section summary (spec 009): the filled values' sum and how many have one, never "R$ 0"
  function resumo(deals: PipelineDeal[]): string {
    const r = resumirEtapa(deals, new Date())
    return r.comValor ? `${dinheiroCompacto(r.soma)} em ${r.comValor} de ${r.n} com valor` : 'sem valor'
  }

  return (
    <div className="flex flex-col">
      {/* Pipeline selector — mobile only, shown when há mais de 1 pipeline */}
      {pipelines.length > 1 && onPipelineChange && (
        <div className="px-3 pt-2 pb-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-[var(--radius)] border border-input bg-card px-3 py-2.5 text-sm font-semibold transition-colors active:bg-muted">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{selectedPipeline?.name ?? 'Pipeline'}</span>
                  {selectedPipeline?.isDefault && (
                    <span className="shrink-0 rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
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
                    <span className={cn('truncate', p.id === selectedPipelineId && 'font-semibold')}>{p.name}</span>
                    {p.isDefault && (
                      <span className="shrink-0 rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Padrão
                      </span>
                    )}
                  </div>
                  {p.id === selectedPipelineId && (
                    <Check className="h-4 w-4 shrink-0 text-foreground" />
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
          total={activeStage.deals.length > 0 ? resumo(activeStage.deals) : undefined}
        >
          {activeStage.deals.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="hoje-mono text-xs text-muted-foreground">Nenhum negócio nesta etapa</p>
              {onCreateDeal && (
                <button
                  onClick={onCreateDeal}
                  className="flex min-h-[44px] items-center gap-2 rounded-[var(--radius)] bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[.98]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" /> Novo deal
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
