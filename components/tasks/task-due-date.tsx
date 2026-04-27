'use client'

import { cn, formatDateBR } from '@/lib/utils'
import { Calendar, Clock } from 'lucide-react'

interface TaskDueDateProps {
  dueDate: Date | string | null
  completedAt?: Date | string | null
  className?: string
  compact?: boolean
}

export function TaskDueDate({ dueDate, completedAt, className, compact = false }: TaskDueDateProps) {
  if (!dueDate) return null

  const TZ = 'America/Sao_Paulo'
  // Parse both dates in BRT to avoid UTC off-by-one
  const nowBR = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }))
  const dueBR = new Date(new Date(dueDate).toLocaleString('en-US', { timeZone: TZ }))
  const today = new Date(nowBR.getFullYear(), nowBR.getMonth(), nowBR.getDate())
  const dateOnly = new Date(dueBR.getFullYear(), dueBR.getMonth(), dueBR.getDate())
  const diffDays = Math.floor((dateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const isCompleted = !!completedAt
  const isOverdue = !isCompleted && diffDays < 0
  const isToday = diffDays === 0
  const isTomorrow = diffDays === 1
  const isSoon = diffDays >= 0 && diffDays <= 3

  let label: string
  if (isToday) label = 'Hoje'
  else if (isTomorrow) label = 'Amanhã'
  else if (diffDays === -1) label = 'Ontem'
  else if (diffDays > 0 && diffDays < 7) label = `${diffDays}d`
  else label = formatDateBR(dueDate, { day: '2-digit', month: 'short' })

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors',
        isCompleted && 'text-zinc-400 line-through',
        !isCompleted && isOverdue && 'bg-red-500/10 text-red-600 dark:text-red-400',
        !isCompleted && isToday && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        !isCompleted && isTomorrow && 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        !isCompleted && !isOverdue && !isToday && !isTomorrow && isSoon && 'text-zinc-600 dark:text-zinc-400',
        !isCompleted && diffDays > 3 && 'text-zinc-500',
        className
      )}
    >
      {compact ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
      <span>{label}</span>
    </div>
  )
}
