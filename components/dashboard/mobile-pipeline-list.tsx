'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { StageStories } from './stage-stories'
import { DealMobileCard } from './deal-mobile-card'
import { MobileListSection } from '@/components/mobile/list-section'

interface Stage {
  id: string
  name: string
  color?: string | null
  deals: Array<{
    id: string
    title: string
    value?: number | null
    closeDate?: string | null
    dueDate?: string | null
    contact?: { name: string; company?: string | null } | null
  }>
}

interface MobilePipelineListProps {
  stages: Stage[]
  onCreateDeal?: () => void
}

export function MobilePipelineList({ stages, onCreateDeal }: MobilePipelineListProps) {
  const [activeStageId, setActiveStageId] = useState<string | null>(
    stages[0]?.id ?? null
  )
  const router = useRouter()

  const activeStage = stages.find((s) => s.id === activeStageId)

  const totalDeals = stages.reduce((sum, s) => sum + s.deals.length, 0)
  const totalValue = stages.reduce(
    (sum, s) => sum + s.deals.reduce((sv, d) => sv + (d.value ?? 0), 0),
    0
  )

  function formatTotal(v: number): string {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
    return `R$ ${v.toLocaleString('pt-BR')}`
  }

  return (
    <div className="flex flex-col">
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
                  className="mt-1 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white active:scale-95"
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
                  onClick={(id) => router.push(`/dashboard?deal=${id}`)}
                />
              ))}
            </div>
          )}
        </MobileListSection>
      )}
    </div>
  )
}
