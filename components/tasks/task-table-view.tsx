'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import type { TaskLite, TaskStatusLite } from './task-types'
import { TaskPriorityIcon } from './task-priority-icon'
import { TaskDueDate } from './task-due-date'
import { TaskAssigneeAvatar } from './task-assignee-avatar'
import { TaskLabels } from './task-labels'

interface TaskTableViewProps {
  tasks: TaskLite[]
  statuses: TaskStatusLite[]
  onTaskClick?: (task: TaskLite) => void
  onBulkDelete?: (taskIds: string[]) => Promise<void>
  onBulkStatusChange?: (taskIds: string[], statusId: string) => Promise<void>
  onBulkPriorityChange?: (taskIds: string[], priority: string) => Promise<void>
}

type SortKey = 'title' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'createdAt'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  NONE: 1,
}

export function TaskTableView({
  tasks,
  statuses,
  onTaskClick,
  onBulkDelete,
  onBulkStatusChange,
  onBulkPriorityChange,
}: TaskTableViewProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('dueDate')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sorted = useMemo(() => {
    const arr = [...tasks]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'status':
          cmp = (a.status?.name || '').localeCompare(b.status?.name || '')
          break
        case 'priority':
          cmp = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0)
          break
        case 'assignee':
          cmp = (a.assignee?.name || '').localeCompare(b.assignee?.name || '')
          break
        case 'dueDate': {
          const aT = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const bT = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          cmp = aT - bT
          break
        }
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [tasks, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleSelectAll = () => {
    if (selected.size === sorted.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sorted.map((t) => t.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Excluir ${selected.size} tarefa(s)?`)) return
    try {
      await onBulkDelete?.(Array.from(selected))
      toast.success(`${selected.size} tarefa(s) excluída(s)`)
      setSelected(new Set())
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const handleBulkStatus = async (statusId: string) => {
    try {
      await onBulkStatusChange?.(Array.from(selected), statusId)
      toast.success('Status atualizado')
      setSelected(new Set())
    } catch {
      toast.error('Erro ao atualizar')
    }
  }

  const handleBulkPriority = async (priority: string) => {
    try {
      await onBulkPriorityChange?.(Array.from(selected), priority)
      toast.success('Prioridade atualizada')
      setSelected(new Set())
    } catch {
      toast.error('Erro ao atualizar')
    }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-40" />
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  return (
    <div className="space-y-3">
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-indigo-500/30 bg-indigo-500/5 px-4 py-2">
          <div className="text-xs font-medium text-foreground">
            {selected.size} selecionada(s)
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Mudar status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {statuses.map((s) => (
                  <DropdownMenuItem key={s.id} onClick={() => handleBulkStatus(s.id)}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Prioridade
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkPriority('URGENT')}>
                  Urgente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkPriority('HIGH')}>
                  Alta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkPriority('MEDIUM')}>
                  Média
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkPriority('LOW')}>
                  Baixa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkPriority('NONE')}>
                  Nenhuma
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Excluir
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={sorted.length > 0 && selected.size === sorted.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <SortHeader label="Título" active={sortKey === 'title'} onClick={() => toggleSort('title')}>
                  <SortIcon k="title" />
                </SortHeader>
                <SortHeader label="Status" active={sortKey === 'status'} onClick={() => toggleSort('status')}>
                  <SortIcon k="status" />
                </SortHeader>
                <SortHeader label="Prio." active={sortKey === 'priority'} onClick={() => toggleSort('priority')}>
                  <SortIcon k="priority" />
                </SortHeader>
                <SortHeader label="Responsável" active={sortKey === 'assignee'} onClick={() => toggleSort('assignee')}>
                  <SortIcon k="assignee" />
                </SortHeader>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Labels
                </th>
                <SortHeader label="Prazo" active={sortKey === 'dueDate'} onClick={() => toggleSort('dueDate')}>
                  <SortIcon k="dueDate" />
                </SortHeader>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-muted-foreground">
                    Nenhuma tarefa encontrada
                  </td>
                </tr>
              ) : (
                sorted.map((task) => {
                  const isSelected = selected.has(task.id)
                  const isCompleted = !!task.completedAt
                  return (
                    <tr
                      key={task.id}
                      className={cn(
                        'group border-b border-border/30 transition-colors hover:bg-muted/20',
                        isSelected && 'bg-indigo-500/5',
                        isCompleted && 'opacity-60'
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(task.id)}
                        />
                      </td>
                      <td
                        className="px-3 py-2.5 cursor-pointer"
                        onClick={() => onTaskClick?.(task)}
                      >
                        <span
                          className={cn(
                            'truncate text-foreground',
                            isCompleted && 'line-through text-muted-foreground'
                          )}
                        >
                          {task.title}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {task.status && (
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: task.status.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {task.status.name}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <TaskPriorityIcon priority={task.priority} />
                      </td>
                      <td className="px-3 py-2.5">
                        <TaskAssigneeAvatar user={task.assignee} size="sm" />
                      </td>
                      <td className="px-3 py-2.5">
                        {task.labels && task.labels.length > 0 && (
                          <TaskLabels labels={task.labels} maxVisible={2} />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <TaskDueDate
                          dueDate={task.dueDate}
                          completedAt={task.completedAt}
                          compact
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onTaskClick?.(task)}>
                              Abrir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SortHeader({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <th className="px-3 py-2.5 text-left">
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide transition-colors',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {label}
        {children}
      </button>
    </th>
  )
}
