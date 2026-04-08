'use client'

import { useMemo } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { TaskLite, TaskStatusLite } from './task-types'

export interface TaskFiltersState {
  search: string
  priorities: string[]
  statusIds: string[]
  assigneeIds: string[]
  labelIds: string[]
}

interface TaskFiltersProps {
  tasks: TaskLite[]
  statuses: TaskStatusLite[]
  value: TaskFiltersState
  onChange: (value: TaskFiltersState) => void
}

const PRIORITIES = [
  { value: 'URGENT', label: 'Urgente', color: 'text-red-500' },
  { value: 'HIGH', label: 'Alta', color: 'text-orange-500' },
  { value: 'MEDIUM', label: 'Média', color: 'text-amber-500' },
  { value: 'LOW', label: 'Baixa', color: 'text-sky-500' },
  { value: 'NONE', label: 'Nenhuma', color: 'text-zinc-400' },
]

export function TaskFilters({ tasks, statuses, value, onChange }: TaskFiltersProps) {
  const assignees = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    for (const t of tasks) {
      if (t.assignee) {
        map.set(t.assignee.id, {
          id: t.assignee.id,
          name: t.assignee.name || t.assignee.email,
        })
      }
    }
    return Array.from(map.values())
  }, [tasks])

  const labels = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>()
    for (const t of tasks) {
      if (t.labels) {
        for (const l of t.labels) {
          map.set(l.id, { id: l.id, name: l.name, color: l.color })
        }
      }
    }
    return Array.from(map.values())
  }, [tasks])

  const toggle = (key: keyof TaskFiltersState, id: string) => {
    if (key === 'search') return
    const current = value[key] as string[]
    onChange({
      ...value,
      [key]: current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    })
  }

  const activeCount =
    value.priorities.length +
    value.statusIds.length +
    value.assigneeIds.length +
    value.labelIds.length

  const clearAll = () => {
    onChange({
      search: '',
      priorities: [],
      statusIds: [],
      assigneeIds: [],
      labelIds: [],
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar tarefas..."
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className="h-9 pl-8 text-sm"
        />
      </div>

      {/* Filter popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {activeCount > 0 && (
              <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            {/* Priorities */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Prioridade
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => toggle('priorities', p.value)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs transition-all',
                      value.priorities.includes(p.value)
                        ? 'border-indigo-500 bg-indigo-500/10 text-foreground'
                        : 'border-border/50 text-muted-foreground hover:border-border'
                    )}
                  >
                    <span className={p.color}>●</span> {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Statuses */}
            {statuses.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => toggle('statusIds', s.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-all',
                        value.statusIds.includes(s.id)
                          ? 'border-indigo-500 bg-indigo-500/10 text-foreground'
                          : 'border-border/50 text-muted-foreground hover:border-border'
                      )}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Assignees */}
            {assignees.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Responsável
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {assignees.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => toggle('assigneeIds', a.id)}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs transition-all',
                        value.assigneeIds.includes(a.id)
                          ? 'border-indigo-500 bg-indigo-500/10 text-foreground'
                          : 'border-border/50 text-muted-foreground hover:border-border'
                      )}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Labels */}
            {labels.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Labels
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => toggle('labelIds', l.id)}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs transition-all',
                        value.labelIds.includes(l.id)
                          ? 'border-indigo-500 bg-indigo-500/10 text-foreground'
                          : 'border-border/50 text-muted-foreground hover:border-border'
                      )}
                      style={
                        value.labelIds.includes(l.id)
                          ? {}
                          : { color: l.color }
                      }
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeCount > 0 && (
              <div className="border-t border-border/50 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-7 w-full text-xs"
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active chips inline */}
      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Limpar
        </button>
      )}
    </div>
  )
}

export function applyTaskFilters(tasks: TaskLite[], filters: TaskFiltersState): TaskLite[] {
  const search = filters.search.trim().toLowerCase()
  return tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search) && !t.description?.toLowerCase().includes(search)) {
      return false
    }
    if (filters.priorities.length > 0 && !filters.priorities.includes(t.priority)) {
      return false
    }
    if (filters.statusIds.length > 0 && !filters.statusIds.includes(t.statusId)) {
      return false
    }
    if (filters.assigneeIds.length > 0 && (!t.assigneeId || !filters.assigneeIds.includes(t.assigneeId))) {
      return false
    }
    if (filters.labelIds.length > 0) {
      const taskLabelIds = t.labels?.map((l) => l.id) || []
      if (!filters.labelIds.some((id) => taskLabelIds.includes(id))) {
        return false
      }
    }
    return true
  })
}
