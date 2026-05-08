'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { TaskLite, TaskStatusLite } from './task-types'
import { TaskViews, type TaskViewMode } from './task-views'
import { CreateTaskDialog } from './create-task-dialog'
import { TaskDetailPanel } from './task-detail-panel'
import { TaskFilters, applyTaskFilters, type TaskFiltersState } from './task-filters'

interface TaskProjectWorkspaceProps {
  projectId: string
  projectName?: string
  locale?: string
  isAdmin?: boolean
  statuses: TaskStatusLite[]
  tasks: TaskLite[]
  entitlements: {
    taskKanban: boolean
    taskCalendar: boolean
    taskTable: boolean
    taskAnalytics: boolean
  }
}

const EMPTY_FILTERS: TaskFiltersState = {
  search: '',
  priorities: [],
  statusIds: [],
  assigneeIds: [],
  labelIds: [],
  dueDateFrom: '',
  dueDateTo: '',
  sortBy: 'none',
  sortDir: 'asc',
}

export function TaskProjectWorkspace({
  projectId,
  projectName,
  locale = 'pt',
  isAdmin = false,
  statuses,
  tasks,
  entitlements,
}: TaskProjectWorkspaceProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [createStatusId, setCreateStatusId] = useState<string | undefined>()
  const [createDueDate, setCreateDueDate] = useState<string | undefined>()
  const [selectedTask, setSelectedTask] = useState<TaskLite | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [filters, setFilters] = useState<TaskFiltersState>(EMPTY_FILTERS)

  const lockedViews: TaskViewMode[] = []
  if (!entitlements.taskKanban) lockedViews.push('kanban')
  if (!entitlements.taskCalendar) lockedViews.push('calendar')
  if (!entitlements.taskTable) lockedViews.push('table')
  if (!entitlements.taskAnalytics) lockedViews.push('analytics')

  const filteredTasks = useMemo(() => applyTaskFilters(tasks, filters), [tasks, filters])
  const sortActive = filters.sortBy !== 'none'

  const handleTaskClick = useCallback((task: TaskLite) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }, [])

  const handleAddTask = useCallback((statusId: string) => {
    setCreateStatusId(statusId)
    setCreateDueDate(undefined)
    setCreateOpen(true)
  }, [])

  const handleDayClick = useCallback(
    (date: Date) => {
      setCreateStatusId(statuses[0]?.id)
      setCreateDueDate(date.toISOString().slice(0, 10))
      setCreateOpen(true)
    },
    [statuses]
  )

  const handleTaskMove = useCallback(
    async (taskId: string, statusId: string, order: number) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId, order }),
      })
      if (!res.ok) {
        toast.error('Erro ao mover tarefa')
        throw new Error('Failed to move task')
      }
      router.refresh()
    },
    [router]
  )

  const handleToggleComplete = useCallback(
    async (task: TaskLite) => {
      const doneStatus = statuses.find((s) => s.type === 'DONE')
      const openStatus = statuses.find((s) => s.type === 'OPEN') || statuses[0]
      const isCompleted = !!task.completedAt
      const targetStatusId = isCompleted ? openStatus.id : doneStatus?.id || task.statusId

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: targetStatusId }),
      })

      if (!res.ok) {
        toast.error('Erro ao atualizar tarefa')
        return
      }

      toast.success(isCompleted ? 'Tarefa reaberta' : 'Tarefa concluída')
      router.refresh()
    },
    [statuses, router]
  )

  const handleBulkDelete = useCallback(
    async (taskIds: string[]) => {
      await Promise.all(
        taskIds.map((id) => fetch(`/api/tasks/${id}`, { method: 'DELETE' }))
      )
      router.refresh()
    },
    [router]
  )

  const handleBulkStatusChange = useCallback(
    async (taskIds: string[], statusId: string) => {
      await Promise.all(
        taskIds.map((id) =>
          fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statusId }),
          })
        )
      )
      router.refresh()
    },
    [router]
  )

  const handleBulkPriorityChange = useCallback(
    async (taskIds: string[], priority: string) => {
      await Promise.all(
        taskIds.map((id) =>
          fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority }),
          })
        )
      )
      router.refresh()
    },
    [router]
  )

  const handleInlineEdit = useCallback(
    async (taskId: string, patch: { statusId?: string; priority?: string }) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        toast.error('Erro ao atualizar')
        throw new Error('Failed to update task')
      }
      router.refresh()
    },
    [router]
  )

  return (
    <div className="space-y-4">
      {/* Toolbar: filters + action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <TaskFilters
          tasks={tasks}
          statuses={statuses}
          value={filters}
          onChange={setFilters}
        />
        <Button
          size="sm"
          onClick={() => {
            setCreateStatusId(statuses[0]?.id)
            setCreateDueDate(undefined)
            setCreateOpen(true)
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Nova tarefa
        </Button>
      </div>

      <TaskViews
        tasks={filteredTasks}
        statuses={statuses}
        availableViews={['list', 'kanban', 'calendar', 'table', 'analytics']}
        lockedViews={lockedViews}
        defaultView="list"
        projectId={projectId}
        projectName={projectName}
        locale={locale}
        sortActive={sortActive}
        onTaskClick={handleTaskClick}
        onTaskMove={handleTaskMove}
        onToggleComplete={handleToggleComplete}
        onAddTask={handleAddTask}
        onDayClick={handleDayClick}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkPriorityChange={handleBulkPriorityChange}
        onInlineEdit={handleInlineEdit}
      />

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        statuses={statuses}
        defaultStatusId={createStatusId}
        defaultDueDate={createDueDate}
        isAdmin={isAdmin}
        onCreated={() => router.refresh()}
      />

      <TaskDetailPanel
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={selectedTask}
        statuses={statuses}
        onUpdated={() => router.refresh()}
        onDeleted={() => router.refresh()}
      />
    </div>
  )
}
