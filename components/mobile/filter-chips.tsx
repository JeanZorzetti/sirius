'use client'
import { X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterChip {
  id: string
  label: string
  active?: boolean
  removable?: boolean
}

interface FilterChipsProps {
  chips: FilterChip[]
  onChipClick: (id: string) => void
  onRemoveChip?: (id: string) => void
  onOpenFilters?: () => void
  showFiltersButton?: boolean
  activeCount?: number
  className?: string
}

export function FilterChips({
  chips,
  onChipClick,
  onRemoveChip,
  onOpenFilters,
  showFiltersButton = true,
  activeCount = 0,
  className,
}: FilterChipsProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onChipClick(chip.id)}
          style={{ scrollSnapAlign: 'start' }}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95',
            chip.active
              ? 'border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              : 'border border-border/60 bg-background text-muted-foreground',
          )}
        >
          {chip.label}
          {chip.active && chip.removable && onRemoveChip && (
            <span
              role="button"
              aria-label={`Remover ${chip.label}`}
              onClick={(e) => { e.stopPropagation(); onRemoveChip(chip.id) }}
              className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-500/20"
            >
              <X className="h-2 w-2" />
            </span>
          )}
        </button>
      ))}

      {showFiltersButton && onOpenFilters && (
        <button
          onClick={onOpenFilters}
          style={{ scrollSnapAlign: 'start' }}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95',
            activeCount > 0
              ? 'border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              : 'border border-border/60 bg-background text-muted-foreground',
          )}
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filtros
          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
