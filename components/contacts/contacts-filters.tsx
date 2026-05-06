'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { EnrichedContact } from './contacts-data-table-client'

export type ContactFilters = {
  assignees: string[] // names; special value '__none__' = sem responsável
  cities: string[]
  states: string[]
}

export const EMPTY_FILTERS: ContactFilters = {
  assignees: [],
  cities: [],
  states: [],
}

const NO_ASSIGNEE = '__none__'

interface ContactsFiltersProps {
  data: EnrichedContact[]
  value: ContactFilters
  onChange: (next: ContactFilters) => void
}

export function ContactsFilters({ data, value, onChange }: ContactsFiltersProps) {
  // Build option lists from data
  const { assigneeOptions, cityOptions, stateOptions } = useMemo(() => {
    const assigneeSet = new Set<string>()
    const citySet = new Set<string>()
    const stateSet = new Set<string>()
    let hasUnassigned = false

    for (const c of data) {
      if (c.assigneeName) assigneeSet.add(c.assigneeName)
      else hasUnassigned = true
      if (c.city?.trim()) citySet.add(c.city.trim())
      if (c.state?.trim()) stateSet.add(c.state.trim().toUpperCase())
    }

    const assignees = Array.from(assigneeSet).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return {
      assigneeOptions: hasUnassigned ? [NO_ASSIGNEE, ...assignees] : assignees,
      cityOptions: Array.from(citySet).sort((a, b) => a.localeCompare(b, 'pt-BR')),
      stateOptions: Array.from(stateSet).sort(),
    }
  }, [data])

  const totalActive = value.assignees.length + value.cities.length + value.states.length

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterPopover
        label="Responsável"
        options={assigneeOptions}
        selected={value.assignees}
        onSelectedChange={(next) => onChange({ ...value, assignees: next })}
        renderOption={(opt) => (opt === NO_ASSIGNEE ? 'Sem responsável' : opt)}
      />
      <FilterPopover
        label="Cidade"
        options={cityOptions}
        selected={value.cities}
        onSelectedChange={(next) => onChange({ ...value, cities: next })}
      />
      <FilterPopover
        label="Estado"
        options={stateOptions}
        selected={value.states}
        onSelectedChange={(next) => onChange({ ...value, states: next })}
      />
      {totalActive > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="h-9 gap-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
          Limpar ({totalActive})
        </Button>
      )}
    </div>
  )
}

function FilterPopover({
  label,
  options,
  selected,
  onSelectedChange,
  renderOption,
}: {
  label: string
  options: string[]
  selected: string[]
  onSelectedChange: (next: string[]) => void
  renderOption?: (opt: string) => string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options.filter((o) => {
      const label = (renderOption?.(o) ?? o).toLowerCase()
      return label.includes(q)
    })
  }, [options, search, renderOption])

  const isActive = selected.length > 0

  function toggle(opt: string) {
    if (selected.includes(opt)) {
      onSelectedChange(selected.filter((s) => s !== opt))
    } else {
      onSelectedChange([...selected, opt])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2 border-dashed',
            isActive && 'border-solid border-indigo-500/40 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400'
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {label}
          {isActive && (
            <span className="ml-1 rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="border-b border-border/60 p-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar ${label.toLowerCase()}...`}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Nenhum resultado.
            </div>
          ) : (
            filtered.map((opt) => {
              const checked = selected.includes(opt)
              const display = renderOption?.(opt) ?? opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors',
                    'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                    checked && 'bg-indigo-50/60 dark:bg-indigo-500/5'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      checked
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-zinc-300 dark:border-zinc-600'
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </div>
                  <span className={cn('truncate flex-1', opt === NO_ASSIGNEE && 'italic text-muted-foreground')}>
                    {display}
                  </span>
                </button>
              )
            })
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t border-border/60 p-1">
            <button
              type="button"
              onClick={() => onSelectedChange([])}
              className="w-full rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Limpar seleção
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Apply filters in-memory — same array shape as data
export function applyContactFilters(
  data: EnrichedContact[],
  filters: ContactFilters
): EnrichedContact[] {
  const { assignees, cities, states } = filters
  if (assignees.length === 0 && cities.length === 0 && states.length === 0) {
    return data
  }

  const wantsUnassigned = assignees.includes(NO_ASSIGNEE)
  const wantedAssignees = new Set(assignees.filter((a) => a !== NO_ASSIGNEE))
  const wantedCities = new Set(cities)
  const wantedStates = new Set(states.map((s) => s.toUpperCase()))

  return data.filter((c) => {
    if (assignees.length > 0) {
      if (c.assigneeName) {
        if (!wantedAssignees.has(c.assigneeName)) return false
      } else {
        if (!wantsUnassigned) return false
      }
    }
    if (cities.length > 0) {
      if (!c.city || !wantedCities.has(c.city.trim())) return false
    }
    if (states.length > 0) {
      if (!c.state || !wantedStates.has(c.state.trim().toUpperCase())) return false
    }
    return true
  })
}
