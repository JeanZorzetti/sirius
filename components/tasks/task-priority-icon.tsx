'use client'

import { cn } from '@/lib/utils'
import { Flag } from 'lucide-react'
import type { TaskPriority } from '@prisma/client'
import { PRIORITY_CONFIG } from './task-types'

interface TaskPriorityIconProps {
  priority: TaskPriority
  className?: string
  showLabel?: boolean
}

export function TaskPriorityIcon({ priority, className, showLabel = false }: TaskPriorityIconProps) {
  const config = PRIORITY_CONFIG[priority]

  if (priority === 'NONE') {
    return showLabel ? (
      <span className="text-xs text-muted-foreground">Sem prioridade</span>
    ) : null
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Flag className={cn('h-3.5 w-3.5 fill-current', config.color)} />
      {showLabel && <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>}
    </div>
  )
}
