'use client'
import { cn } from '@/lib/utils'

interface Stage {
  id: string
  name: string
  color?: string | null
  deals: Array<{ value?: number | null }>
}

interface StageStoriesProps {
  stages: Stage[]
  activeStageId: string | null
  onSelect: (stageId: string) => void
}

const STAGE_COLORS = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-blue-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-orange-500',
  'bg-rose-500',
]

export function StageStories({ stages, activeStageId, onSelect }: StageStoriesProps) {
  return (
    <div
      className="flex gap-3 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {stages.map((stage, idx) => {
        const isActive = stage.id === activeStageId
        const totalValue = stage.deals.reduce((sum, d) => sum + (d.value ?? 0), 0)
        const colorClass = STAGE_COLORS[idx % STAGE_COLORS.length]

        return (
          <button
            key={stage.id}
            onClick={() => onSelect(stage.id)}
            style={{ scrollSnapAlign: 'start' }}
            className={cn(
              'flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition-all duration-150',
              'min-w-[88px] active:scale-95',
              isActive
                ? 'border border-indigo-500/30 bg-indigo-500/5 shadow-sm'
                : 'border border-border/40 bg-card hover:bg-muted/30',
            )}
          >
            <div className={cn('h-3 w-3 rounded-full', colorClass, isActive && 'ring-2 ring-offset-1 ring-indigo-500/40')} />
            <span className={cn(
              'text-center text-[11px] font-semibold leading-tight',
              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground',
            )}>
              {stage.name}
            </span>
            {totalValue > 0 && (
              <span className={cn('text-[10px] font-medium', isActive ? 'text-indigo-500' : 'text-muted-foreground/70')}>
                {totalValue >= 1000
                  ? `R$ ${(totalValue / 1000).toFixed(0)}k`
                  : `R$ ${totalValue.toLocaleString('pt-BR')}`}
              </span>
            )}
            <span className={cn('text-[10px]', isActive ? 'text-indigo-400' : 'text-muted-foreground/50')}>
              ({stage.deals.length})
            </span>
          </button>
        )
      })}
    </div>
  )
}
