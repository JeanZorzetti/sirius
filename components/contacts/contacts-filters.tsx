'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Filter, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import type { EnrichedContact } from './contacts-data-table-client'

export const CONTACT_STATUSES = [
  { value: 'active',      label: 'Ativo' },
  { value: 'prospect',    label: 'Em prospecção' },
  { value: 'inactive',    label: 'Inativo' },
  { value: 'researching', label: 'Em pesquisa' },
  { value: 'trash',       label: 'Lixo' },
] as const

export type ContactStatus = typeof CONTACT_STATUSES[number]['value']

export type ContactFilters = {
  assignees: string[]
  cities: string[]
  states: string[]
  statuses: string[]
  segments: string[]
}

export const EMPTY_FILTERS: ContactFilters = {
  assignees: [],
  cities: [],
  states: [],
  statuses: [],
  segments: [],
}

const NO_ASSIGNEE = '__none__'

interface ContactsFiltersProps {
  data: EnrichedContact[]
  value: ContactFilters
  onChange: (next: ContactFilters) => void
  customSegments: { id: string; name: string }[]
  onAddSegment: (name: string) => Promise<void>
  onDeleteSegment: (id: string, name: string) => Promise<void>
}

export function ContactsFilters({ data, value, onChange, customSegments, onAddSegment, onDeleteSegment }: ContactsFiltersProps) {
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

  const statusOptions = CONTACT_STATUSES.map(s => s.value)

  const totalActive =
    value.assignees.length +
    value.cities.length +
    value.states.length +
    value.statuses.length +
    value.segments.length

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
      <FilterPopover
        label="Status"
        options={statusOptions}
        selected={value.statuses}
        onSelectedChange={(next) => onChange({ ...value, statuses: next })}
        renderOption={(opt) => CONTACT_STATUSES.find(s => s.value === opt)?.label ?? opt}
      />
      <SegmentFilterPopover
        selected={value.segments}
        onSelectedChange={(next) => onChange({ ...value, segments: next })}
        customSegments={customSegments}
        onAddSegment={onAddSegment}
        onDeleteSegment={onDeleteSegment}
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

function SegmentFilterPopover({
  selected,
  onSelectedChange,
  customSegments,
  onAddSegment,
  onDeleteSegment,
}: {
  selected: string[]
  onSelectedChange: (next: string[]) => void
  customSegments: { id: string; name: string }[]
  onAddSegment: (name: string) => Promise<void>
  onDeleteSegment: (id: string, name: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [addValue, setAddValue] = useState('')
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return customSegments
    const q = search.toLowerCase()
    return customSegments.filter((s) => s.name.toLowerCase().includes(q))
  }, [customSegments, search])

  const isActive = selected.length > 0

  function toggle(name: string) {
    if (selected.includes(name)) {
      onSelectedChange(selected.filter((s) => s !== name))
    } else {
      onSelectedChange([...selected, name])
    }
  }

  async function handleAdd() {
    const trimmed = addValue.trim()
    if (!trimmed || adding) return
    setAdding(true)
    try {
      await onAddSegment(trimmed)
      setAddValue('')
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteCustom(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation()
    e.preventDefault()
    onSelectedChange(selected.filter((s) => s !== name))
    await onDeleteSegment(id, name)
  }

  function handleAddKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

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
          Segmento
          {isActive && (
            <span className="ml-1 rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {/* Search + Add row */}
        <div className="flex items-center gap-1.5 border-b border-border/60 p-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar segmento..."
            className="h-8 flex-1 text-sm"
            autoFocus
          />
          <Input
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="Nova categoria"
            className="h-8 w-32 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={adding}
            className="h-8 w-8 shrink-0 p-0"
            title="Adicionar categoria"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Options list */}
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              {customSegments.length === 0 ? 'Nenhum segmento cadastrado. Adicione um acima.' : 'Nenhum resultado.'}
            </div>
          ) : (
            filtered.map((seg) => {
              const checked = selected.includes(seg.name)
              return (
                <div
                  key={seg.id}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer select-none',
                    'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                    checked && 'bg-indigo-50/60 dark:bg-indigo-500/5'
                  )}
                  onClick={() => toggle(seg.name)}
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
                  <span className="truncate flex-1 text-left">{seg.name}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDeleteCustom(e, seg.id, seg.name)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDeleteCustom(e as any, seg.id, seg.name)}
                    className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors"
                    title="Remover categoria"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                </div>
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
      const l = (renderOption?.(o) ?? o).toLowerCase()
      return l.includes(q)
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

export function applyContactFilters(
  data: EnrichedContact[],
  filters: ContactFilters
): EnrichedContact[] {
  const { assignees, cities, states, statuses, segments } = filters

  if (
    assignees.length === 0 &&
    cities.length === 0 &&
    states.length === 0 &&
    statuses.length === 0 &&
    segments.length === 0
  ) {
    return data
  }

  const wantsUnassigned = assignees.includes(NO_ASSIGNEE)
  const wantedAssignees = new Set(assignees.filter((a) => a !== NO_ASSIGNEE))
  const wantedCities = new Set(cities)
  const wantedStates = new Set(states.map((s) => s.toUpperCase()))
  const wantedStatuses = new Set(statuses)
  const wantedSegments = new Set(segments)

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
    if (statuses.length > 0) {
      if (!c.status || !wantedStatuses.has(c.status)) return false
    }
    if (segments.length > 0) {
      if (!c.segment || !wantedSegments.has(c.segment)) return false
    }
    return true
  })
}
