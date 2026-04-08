'use client'

import { cn } from '@/lib/utils'
import type { TaskStatusLite } from './task-types'

interface TaskStatusBadgeProps {
  status: TaskStatusLite
  className?: string
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        'border border-border/50',
        className
      )}
      style={{
        backgroundColor: `${status.color}15`,
        color: status.color,
        borderColor: `${status.color}40`,
      }}
    >
      <div
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: status.color }}
      />
      {status.name}
    </div>
  )
}
