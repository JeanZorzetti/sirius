'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { TaskLite, TaskStatusLite } from './task-types'

interface TaskCalendarViewProps {
  tasks: TaskLite[]
  statuses: TaskStatusLite[]
  onTaskClick?: (task: TaskLite) => void
  onDayClick?: (date: Date) => void
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function priorityColor(priority: string): string {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-500'
    case 'HIGH':
      return 'bg-orange-500'
    case 'MEDIUM':
      return 'bg-amber-500'
    case 'LOW':
      return 'bg-sky-500'
    default:
      return 'bg-zinc-400'
  }
}

export function TaskCalendarView({ tasks, onTaskClick, onDayClick }: TaskCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const today = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }, [])

  // Build calendar grid: 6 rows x 7 cols = 42 days
  const grid = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDay = firstDay.getDay() // 0 = Sunday

    const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> = []

    // Previous month fill
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ date: d, isCurrentMonth: false, isToday: false })
    }

    // Current month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
      })
    }

    // Next month fill (complete 6 rows = 42 cells)
    while (days.length < 42) {
      const last = days[days.length - 1].date
      const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)
      days.push({ date: d, isCurrentMonth: false, isToday: false })
    }

    return days
  }, [currentMonth, today])

  // Group tasks by date (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskLite[]>()
    for (const t of tasks) {
      if (!t.dueDate) continue
      const d = new Date(t.dueDate)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const existing = map.get(key) || []
      existing.push(t)
      map.set(key, existing)
    }
    return map
  }, [tasks])

  const getTasksForDay = (date: Date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    return tasksByDate.get(key) || []
  }

  const goPrev = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const goNext = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const goToday = () => {
    const now = new Date()
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={goToday} className="h-7 px-2 text-xs">
            Hoje
          </Button>
          <Button variant="ghost" size="sm" onClick={goPrev} className="h-7 w-7 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goNext} className="h-7 w-7 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-border/50 bg-muted/20">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {grid.map((cell, i) => {
          const dayTasks = getTasksForDay(cell.date)
          const visible = dayTasks.slice(0, 3)
          const hidden = Math.max(0, dayTasks.length - 3)

          return (
            <div
              key={i}
              onClick={() => onDayClick?.(cell.date)}
              className={cn(
                'group relative min-h-[100px] cursor-pointer border-b border-r border-border/30 p-1.5 transition-colors hover:bg-muted/20',
                !cell.isCurrentMonth && 'bg-muted/10',
                (i + 1) % 7 === 0 && 'border-r-0',
                i >= 35 && 'border-b-0'
              )}
            >
              <div
                className={cn(
                  'mb-1 inline-flex h-6 w-6 items-center justify-center text-xs font-medium',
                  cell.isToday &&
                    'rounded-full bg-indigo-500 text-white',
                  !cell.isToday && cell.isCurrentMonth && 'text-foreground',
                  !cell.isToday && !cell.isCurrentMonth && 'text-muted-foreground/40'
                )}
              >
                {cell.date.getDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {visible.map((task) => (
                  <button
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onTaskClick?.(task)
                    }}
                    className={cn(
                      'group/task flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[10px] hover:bg-muted/40',
                      task.completedAt && 'opacity-50 line-through'
                    )}
                  >
                    <span
                      className={cn('h-1.5 w-1.5 shrink-0 rounded-full', priorityColor(task.priority))}
                    />
                    <span className="truncate text-foreground">{task.title}</span>
                  </button>
                ))}
                {hidden > 0 && (
                  <span className="px-1.5 text-[10px] text-muted-foreground">
                    +{hidden} mais
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
