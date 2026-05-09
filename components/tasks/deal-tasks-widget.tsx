'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, CheckSquare, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import type { TaskLite } from './task-types'
import { TaskPriorityIcon } from './task-priority-icon'
import { TaskDueDate } from './task-due-date'
import { TaskAssigneeAvatar } from './task-assignee-avatar'

interface EntityTasksWidgetProps {
  dealId?: string
  contactId?: string
  title?: string
}

/**
 * Shared widget used in Deal and Contact detail pages.
 * Shows all tasks linked to this entity.
 */
export function EntityTasksWidget({ dealId, contactId, title = 'Tarefas' }: EntityTasksWidgetProps) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.tasks')
  const [tasks, setTasks] = useState<TaskLite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [dealId, contactId])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dealId) params.set('dealId', dealId)
      if (contactId) params.set('contactId', contactId)
      const res = await fetch(`/api/tasks?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (task: TaskLite) => {
    // Fetch statuses from project to find the DONE status
    try {
      const statusesRes = await fetch(`/api/task-projects/${task.projectId}/statuses`)
      if (!statusesRes.ok) throw new Error('fail')
      const statuses = await statusesRes.json()
      const doneStatus = statuses.find((s: any) => s.type === 'DONE')
      const openStatus = statuses.find((s: any) => s.type === 'OPEN') || statuses[0]
      const isCompleted = !!task.completedAt
      const targetId = isCompleted ? openStatus?.id : doneStatus?.id
      if (!targetId) return

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: targetId }),
      })
      if (!res.ok) throw new Error('fail')
      toast.success(tCommon('toasts.updated'))
      loadTasks()
    } catch {
      toast.error(tCommon('toasts.failed'))
    }
  }

  const openTasks = tasks.filter((t) => !t.completedAt)
  const completedTasks = tasks.filter((t) => !!t.completedAt)

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {openTasks.length}
          </span>
        </div>
        <Link
          href="/dashboard/tasks"
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 transition-colors"
        >
          Ver todas <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">{tCommon('buttons.loading')}</div>
      ) : tasks.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-xs text-muted-foreground">{t('noTasks')}</p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {openTasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={handleToggleComplete} />
          ))}
          {completedTasks.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer px-4 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground">
                {completedTasks.length} concluída(s)
              </summary>
              <div className="divide-y divide-border/30 border-t border-border/30">
                {completedTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={handleToggleComplete} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

function TaskRow({
  task,
  onToggle,
}: {
  task: TaskLite
  onToggle: (task: TaskLite) => void
}) {
  const isCompleted = !!task.completedAt
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/20 transition-colors',
        isCompleted && 'opacity-60'
      )}
    >
      <Checkbox checked={isCompleted} onCheckedChange={() => onToggle(task)} />
      <TaskPriorityIcon priority={task.priority} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            'truncate text-xs text-foreground',
            isCompleted && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </span>
        {task.project && (
          <span className="truncate text-[10px] text-muted-foreground">
            {task.project.name}
          </span>
        )}
      </div>
      <TaskDueDate dueDate={task.dueDate} completedAt={task.completedAt} compact />
      <TaskAssigneeAvatar user={task.assignee} size="sm" />
    </div>
  )
}
