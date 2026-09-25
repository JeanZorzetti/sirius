'use client'
import { cn } from '@/lib/utils'

interface Stage {
  id: string
  name: string
  deals: Array<{ value?: number | null }>
}

interface StageStoriesProps {
  stages: Stage[]
  activeStageId: string | null
  onSelect: (stageId: string) => void
}

// Stage chips: name + count. The old per-index rainbow dots coded nothing (spec 009).
export function StageStories({ stages, activeStageId, onSelect }: StageStoriesProps) {
  return (
    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {stages.map((stage) => {
        const isActive = stage.id === activeStageId
        return (
          <button
            key={stage.id}
            onClick={() => onSelect(stage.id)}
            aria-pressed={isActive}
            className={cn(
              'flex min-h-[44px] shrink-0 snap-start items-center gap-2 rounded-[var(--radius)] border px-3 text-[13px] font-semibold transition-colors active:scale-[.98]',
              isActive
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-input bg-card text-foreground hover:bg-muted',
            )}
          >
            {stage.name}
            <span className="hoje-mono text-[12.5px] font-medium tabular-nums opacity-80">{stage.deals.length}</span>
          </button>
        )
      })}
    </div>
  )
}
