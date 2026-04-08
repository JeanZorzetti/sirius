'use client'

import { cn } from '@/lib/utils'
import type { TaskLabelLite } from './task-types'

interface TaskLabelsProps {
  labels: TaskLabelLite[]
  maxVisible?: number
  className?: string
}

export function TaskLabels({ labels, maxVisible = 3, className }: TaskLabelsProps) {
  if (!labels?.length) return null

  const visible = labels.slice(0, maxVisible)
  const hidden = labels.length - maxVisible

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visible.map((label) => (
        <span
          key={label.id}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: `${label.color}20`,
            color: label.color,
          }}
        >
          {label.name}
        </span>
      ))}
      {hidden > 0 && (
        <span className="text-[10px] text-muted-foreground">+{hidden}</span>
      )}
    </div>
  )
}
