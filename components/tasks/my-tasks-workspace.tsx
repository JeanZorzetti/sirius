'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import type { TaskLite } from './task-types'
import { TaskPriorityIcon } from './task-priority-icon'
import { TaskDueDate } from './task-due-date'
import { TaskLabels } from './task-labels'
import { TaskDetailPanel } from './task-detail-panel'

interface MyTasksWorkspaceProps {
  tasks: TaskLite[]
}

type TabKey = 'all' | 'today' | 'overdue' | 'completed'

export function MyTasksWorkspace({ tasks }: MyTasksWorkspaceProps) {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('all')
  const [selectedTask, setSelectedTask] = useState<TaskLite | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filtered = useMemo(() => {
    const now = new Date()
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    switch (tab) {
      case 'today':
        return tasks.filter(
          (t) =>
            !t.completedAt &&
            t.dueDate &&
            new Date(t.dueDate) >= now &&
            new Date(t.dueDate) <= endOfToday
        )
      case 'overdue':
        return tasks.filter(
          (t) => !t.completedAt && t.dueDate && new Date(t.dueDate) < now
        )
      case 'completed':
        return tasks.filter((t) => !!t.completedAt)
      case 'all':
      default:
        return tasks.filter((t) => !t.completedAt)
    }
  }, [tasks, tab])

  // Group by project
  const grouped = useMemo(() => {
    const map = new Map<string, { project: { id: string; name: string; color: string }; tasks: TaskLite[] }>()
    for (const t of filtered) {
      const pid = t.project?.id || 'unknown'
      const existing = map.get(pid)
      if (existing) {
        existing.tasks.push(t)
      } else {
        map.set(pid, {
          project: t.project || { id: 'unknown', name: 'Sem projeto', color: '#64748b' },
          tasks: [t],
        })
      }
    }
    return Array.from(map.values())
  }, [filtered])

  const handleToggleComplete = useCallback(
    async (task: TaskLite) => {
      // We need to know which status is DONE — fetch project statuses to find it, or just unset completedAt
      // For MyTasks, we don't have project statuses loaded, so we use a simpler endpoint behavior
      // by sending nothing and letting the API handle it. Actually, PATCH doesn't support toggling completedAt
      // without a statusId. We need to fetch statuses.
      const statusesRes = await fetch(
        `/api/task-projects/${task.projectId}/statuses`
      )
      if (!statusesRes.ok) {
        toast.error('Erro ao atualizar')
        return
      }
      const statuses = await statusesRes.json()
      const doneStatus = statuses.find((s: any) => s.type === 'DONE')
      const openStatus = statuses.find((s: any) => s.type === 'OPEN') || statuses[0]
      const isCompleted = !!task.completedAt
      const targetId = isCompleted ? openStatus?.id : doneStatus?.id

      if (!targetId) {
        toast.error('Status não encontrado')
        return
      }

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: targetId }),
      })

      if (!res.ok) {
        toast.error('Erro ao atualizar')
        return
      }

      toast.success(isCompleted ? 'Tarefa reaberta' : 'Tarefa concluída')
      router.refresh()
    },
    [router]
  )

  const tabs: { key: TabKey; label: string; count: number }[] = useMemo(() => {
    const now = new Date()
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    return [
      { key: 'all', label: 'Todas abertas', count: tasks.filter((t) => !t.completedAt).length },
      {
        key: 'today',
        label: 'Hoje',
        count: tasks.filter(
          (t) =>
            !t.completedAt &&
            t.dueDate &&
            new Date(t.dueDate) >= now &&
            new Date(t.dueDate) <= endOfToday
        ).length,
      },
      {
        key: 'overdue',
        label: 'Atrasadas',
        count: tasks.filter(
          (t) => !t.completedAt && t.dueDate && new Date(t.dueDate) < now
        ).length,
      },
      { key: 'completed', label: 'Concluídas', count: tasks.filter((t) => !!t.completedAt).length },
    ]
  }, [tasks])

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 border-b border-border/50">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="flex items-center gap-1.5">
              {t.label}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                {t.count}
              </span>
            </span>
            {tab === t.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-500" />
            )}
          </button>
        ))}
      </div>

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/50 bg-muted/20 py-16">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Nada por aqui</p>
            <p className="text-xs text-muted-foreground">
              Você não tem tarefas nesta aba.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ project, tasks: groupTasks }) => (
            <div
              key={project.id}
              className="overflow-hidden rounded-xl border border-border/50 bg-card"
            >
              <div className="flex items-center justify-between border-b border-border/30 bg-muted/20 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    {project.name}
                  </h3>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {groupTasks.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-border/30">
                {groupTasks.map((task) => {
                  const isCompleted = !!task.completedAt
                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task)
                        setDetailOpen(true)
                      }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer',
                        isCompleted && 'opacity-60'
                      )}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => handleToggleComplete(task)}
                        />
                      </div>
                      <TaskPriorityIcon priority={task.priority} />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span
                          className={cn(
                            'truncate text-sm text-foreground',
                            isCompleted && 'line-through text-muted-foreground'
                          )}
                        >
                          {task.title}
                        </span>
                        {task.status && (
                          <span className="text-[10px] text-muted-foreground">
                            {task.status.name}
                          </span>
                        )}
                      </div>
                      {task.labels && task.labels.length > 0 && (
                        <div className="hidden md:block">
                          <TaskLabels labels={task.labels} maxVisible={2} />
                        </div>
                      )}
                      <TaskDueDate
                        dueDate={task.dueDate}
                        completedAt={task.completedAt}
                        compact
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskDetailPanel
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={selectedTask}
        statuses={[]}
        onUpdated={() => router.refresh()}
        onDeleted={() => router.refresh()}
      />
    </div>
  )
}
