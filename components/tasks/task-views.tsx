'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { List, KanbanSquare, Calendar, Table2, Lock, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskLite, TaskStatusLite } from './task-types'
import { TaskListView } from './task-list-view'
import { TaskKanbanView } from './task-kanban-view'
import { TaskCalendarView } from './task-calendar-view'
import { TaskTableView } from './task-table-view'
import { AnalyticsDashboard } from './analytics/analytics-dashboard'

export type TaskViewMode = 'list' | 'kanban' | 'calendar' | 'table' | 'analytics'

interface TaskViewsProps {
  tasks: TaskLite[]
  statuses: TaskStatusLite[]
  availableViews?: TaskViewMode[]
  lockedViews?: TaskViewMode[]
  defaultView?: TaskViewMode
  projectId?: string
  projectName?: string
  locale?: string
  sortActive?: boolean
  onTaskClick?: (task: TaskLite) => void
  onTaskMove?: (taskId: string, statusId: string, order: number) => Promise<void>
  onToggleComplete?: (task: TaskLite) => Promise<void>
  onAddTask?: (statusId: string) => void
  onDayClick?: (date: Date) => void
  onBulkDelete?: (taskIds: string[]) => Promise<void>
  onBulkStatusChange?: (taskIds: string[], statusId: string) => Promise<void>
  onBulkPriorityChange?: (taskIds: string[], priority: string) => Promise<void>
  onInlineEdit?: (taskId: string, patch: { statusId?: string; priority?: string }) => Promise<void>
}

const VIEW_CONFIG: Record<TaskViewMode, { label: string; icon: typeof List }> = {
  list: { label: 'Lista', icon: List },
  kanban: { label: 'Kanban', icon: KanbanSquare },
  calendar: { label: 'Calendário', icon: Calendar },
  table: { label: 'Tabela', icon: Table2 },
  analytics: { label: 'Analytics', icon: BarChart2 },
}

export function TaskViews({
  tasks,
  statuses,
  availableViews = ['list', 'kanban', 'calendar', 'table'],
  lockedViews = [],
  defaultView = 'list',
  projectId,
  projectName,
  locale = 'pt',
  sortActive = false,
  onTaskClick,
  onTaskMove,
  onToggleComplete,
  onAddTask,
  onDayClick,
  onBulkDelete,
  onBulkStatusChange,
  onBulkPriorityChange,
  onInlineEdit,
}: TaskViewsProps) {
  const [view, setView] = useState<TaskViewMode>(defaultView)

  return (
    <div className="flex flex-col gap-4">
      {/* View Switcher */}
      <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-1 w-fit">
        {availableViews.map((viewMode) => {
          const config = VIEW_CONFIG[viewMode]
          const Icon = config.icon
          const isLocked = lockedViews.includes(viewMode)
          const isActive = view === viewMode

          return (
            <button
              key={viewMode}
              onClick={() => !isLocked && setView(viewMode)}
              disabled={isLocked}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                isActive && 'bg-background text-foreground shadow-sm',
                !isActive && !isLocked && 'text-muted-foreground hover:text-foreground',
                isLocked && 'opacity-50 cursor-not-allowed text-muted-foreground'
              )}
            >
              {isLocked ? <Lock className="h-3 w-3" /> : <Icon className="h-3.5 w-3.5" />}
              <span>{config.label}</span>
            </button>
          )
        })}
      </div>

      {/* Active view */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }}
        >
          {view === 'list' && (
            <TaskListView
              tasks={tasks}
              statuses={statuses}
              projectId={projectId}
              sortActive={sortActive}
              onTaskClick={onTaskClick}
              onToggleComplete={onToggleComplete}
              onAddTask={onAddTask}
              onTaskMove={onTaskMove}
            />
          )}
          {view === 'kanban' && (
            <TaskKanbanView
              tasks={tasks}
              statuses={statuses}
              projectId={projectId}
              onTaskClick={onTaskClick}
              onTaskMove={onTaskMove}
              onAddTask={onAddTask}
            />
          )}
          {view === 'calendar' && (
            <TaskCalendarView
              tasks={tasks}
              statuses={statuses}
              onTaskClick={onTaskClick}
              onDayClick={onDayClick}
            />
          )}
          {view === 'table' && (
            <TaskTableView
              tasks={tasks}
              statuses={statuses}
              onTaskClick={onTaskClick}
              onBulkDelete={onBulkDelete}
              onBulkStatusChange={onBulkStatusChange}
              onBulkPriorityChange={onBulkPriorityChange}
              onInlineEdit={onInlineEdit}
            />
          )}
          {view === 'analytics' && projectId && (
            <AnalyticsDashboard
              projectId={projectId}
              projectName={projectName}
              locale={locale}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
