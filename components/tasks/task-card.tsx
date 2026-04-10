'use client'

import { cn } from '@/lib/utils'
import { MessageSquare, ListChecks, GitBranch, Link2 } from 'lucide-react'
import type { TaskLite } from './task-types'
import { PRIORITY_CONFIG } from './task-types'
import { TaskAssigneeAvatar } from './task-assignee-avatar'
import { TaskDueDate } from './task-due-date'
import { TaskLabels } from './task-labels'

interface TaskCardProps {
  task: TaskLite
  onClick?: () => void
  isDragging?: boolean
  className?: string
}

export function TaskCard({ task, onClick, isDragging, className }: TaskCardProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority]
  const hasMeta =
    (task._count?.comments ?? 0) > 0 ||
    (task._count?.checklists ?? 0) > 0 ||
    (task._count?.subtasks ?? 0) > 0 ||
    task.dealId ||
    task.contactId

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative rounded-xl border border-border/50 bg-card p-3 text-left',
        'transition-all duration-150 ease-out',
        'hover:border-border hover:shadow-sm cursor-pointer',
        isDragging && 'opacity-90',
        className
      )}
    >
      {/* Priority stripe */}
      {task.priority !== 'NONE' && (
        <div
          className={cn(
            'absolute left-0 top-3 bottom-3 w-0.5 rounded-full',
            task.priority === 'URGENT' && 'bg-red-500',
            task.priority === 'HIGH' && 'bg-orange-500',
            task.priority === 'MEDIUM' && 'bg-amber-500',
            task.priority === 'LOW' && 'bg-sky-500'
          )}
        />
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="mb-2 pl-1">
          <TaskLabels labels={task.labels} maxVisible={3} />
        </div>
      )}

      {/* Title */}
      <h4 className={cn(
        'text-sm font-medium leading-snug text-foreground pl-1',
        task.completedAt && 'line-through text-muted-foreground'
      )}>
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p className="mt-1 pl-1 text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta row */}
      {hasMeta && (
        <div className="mt-2.5 flex items-center gap-3 pl-1 text-[11px] text-muted-foreground">
          {(task._count?.subtasks ?? 0) > 0 && (
            <div className="flex items-center gap-0.5">
              <GitBranch className="h-3 w-3" />
              <span>{task._count!.subtasks}</span>
            </div>
          )}
          {(task._count?.checklists ?? 0) > 0 && (
            <div className="flex items-center gap-0.5">
              <ListChecks className="h-3 w-3" />
              <span>{task._count!.checklists}</span>
            </div>
          )}
          {(task._count?.comments ?? 0) > 0 && (
            <div className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              <span>{task._count!.comments}</span>
            </div>
          )}
          {(task.dealId || task.contactId) && (
            <Link2 className="h-3 w-3" />
          )}
        </div>
      )}

      {/* Footer: due date + assignee */}
      <div className="mt-3 flex items-center justify-between pl-1">
        <TaskDueDate dueDate={task.dueDate} completedAt={task.completedAt} compact />
        <TaskAssigneeAvatar user={task.assignee} size="sm" />
      </div>
    </div>
  )
}
