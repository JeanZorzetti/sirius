'use client'

import { useState, useCallback } from 'react'
import { ChevronDown, ChevronRight, Plus, MessageSquare, ListChecks, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskLite, TaskStatusLite } from './task-types'
import { TaskPriorityIcon } from './task-priority-icon'
import { TaskAssigneeAvatar } from './task-assignee-avatar'
import { TaskDueDate } from './task-due-date'
import { TaskLabels } from './task-labels'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface TaskListViewProps {
  tasks: TaskLite[]
  statuses: TaskStatusLite[]
  onTaskClick?: (task: TaskLite) => void
  onToggleComplete?: (task: TaskLite) => Promise<void>
  onAddTask?: (statusId: string) => void
}

export function TaskListView({
  tasks,
  statuses,
  onTaskClick,
  onToggleComplete,
  onAddTask,
}: TaskListViewProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleCollapse = useCallback((statusId: string) => {
    setCollapsed((prev) => ({ ...prev, [statusId]: !prev[statusId] }))
  }, [])

  return (
    <div className="flex flex-col gap-2">
      {statuses.map((status) => {
        const groupTasks = tasks
          .filter((t) => t.statusId === status.id)
          .sort((a, b) => a.order - b.order)
        const isCollapsed = collapsed[status.id]

        return (
          <div key={status.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
            {/* Group Header */}
            <button
              onClick={() => toggleCollapse(status.id)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  {status.name}
                </h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {groupTasks.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddTask?.(status.id)
                }}
              >
                <Plus className="mr-1 h-3 w-3" />
                Adicionar
              </Button>
            </button>

            {/* Task Rows */}
            {!isCollapsed && (
              <div className="divide-y divide-border/30 border-t border-border/30">
                {groupTasks.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                    Nenhuma tarefa neste status
                  </div>
                ) : (
                  groupTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick?.(task)}
                      onToggleComplete={onToggleComplete}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface TaskRowProps {
  task: TaskLite
  onClick?: () => void
  onToggleComplete?: (task: TaskLite) => Promise<void>
}

function TaskRow({ task, onClick, onToggleComplete }: TaskRowProps) {
  const isCompleted = !!task.completedAt

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer',
        isCompleted && 'opacity-60'
      )}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggleComplete?.(task)}
        />
      </div>

      <TaskPriorityIcon priority={task.priority} />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={cn(
            'truncate text-sm text-foreground',
            isCompleted && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </span>

        {(task.dealId || task.contactId) && (
          <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
      </div>

      {/* Meta icons */}
      <div className="hidden items-center gap-3 text-[11px] text-muted-foreground md:flex">
        {(task._count?.subtasks ?? 0) > 0 && (
          <span className="flex items-center gap-0.5">
            <ListChecks className="h-3 w-3" />
            {task._count!.subtasks}
          </span>
        )}
        {(task._count?.comments ?? 0) > 0 && (
          <span className="flex items-center gap-0.5">
            <MessageSquare className="h-3 w-3" />
            {task._count!.comments}
          </span>
        )}
      </div>

      {task.labels && task.labels.length > 0 && (
        <div className="hidden md:block">
          <TaskLabels labels={task.labels} maxVisible={2} />
        </div>
      )}

      <TaskDueDate dueDate={task.dueDate} completedAt={task.completedAt} compact />
      <TaskAssigneeAvatar user={task.assignee} size="sm" />
    </div>
  )
}
