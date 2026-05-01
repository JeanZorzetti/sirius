'use client'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  dateFrom: string
  onDateFromChange: (v: string) => void
  dateTo: string
  onDateToChange: (v: string) => void
  hasActiveFilters: boolean
  onClear: () => void
}

export function PostFilters({
  search, onSearchChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
  hasActiveFilters, onClear,
}: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Text search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Buscar na legenda…"
          className="pl-8 h-8 text-xs"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={dateFrom}
          onChange={e => onDateFromChange(e.target.value)}
          className="h-8 text-xs w-36"
          title="De"
        />
        <span className="text-xs text-muted-foreground">até</span>
        <Input
          type="date"
          value={dateTo}
          onChange={e => onDateToChange(e.target.value)}
          className="h-8 text-xs w-36"
          title="Até"
        />
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="text-xs px-2.5 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Limpar
        </button>
      )}
    </div>
  )
}
