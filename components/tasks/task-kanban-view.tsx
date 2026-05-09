'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Plus, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskLite, TaskStatusLite } from './task-types'
import { TaskCard } from './task-card'
import { Button } from '@/components/ui/button'
import { InlineEditTitle } from './inline-edit-title'
import { toast } from 'sonner'

interface TaskKanbanViewProps {
  tasks: TaskLite[]
  statuses: TaskStatusLite[]
  projectId?: string
  onTaskClick?: (task: TaskLite) => void
  onTaskMove?: (taskId: string, statusId: string, order: number) => Promise<void>
  onAddTask?: (statusId: string) => void
}

export function TaskKanbanView({
  tasks: initialTasks,
  statuses,
  projectId,
  onTaskClick,
  onTaskMove,
  onAddTask,
}: TaskKanbanViewProps) {
  const router = useRouter()
  const tCommon = useTranslations('common')
  const t = useTranslations('components.tasks')
  const [tasks, setTasks] = useState(initialTasks)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const isSaving = useRef(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getTasksByStatus = useCallback(
    (currentTasks: TaskLite[]) =>
      statuses.reduce<Record<string, TaskLite[]>>((acc, status) => {
        acc[status.id] = currentTasks
          .filter((t) => t.statusId === status.id)
          .sort((a, b) => a.order - b.order)
        return acc
      }, {}),
    [statuses]
  )

  const handleDragStart = useCallback((start: { draggableId: string }) => {
    setDraggingId(start.draggableId)
  }, [])

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      setDraggingId(null)

      const { destination, source, draggableId } = result
      if (!destination) return
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) return

      if (isSaving.current) return
      isSaving.current = true

      const targetStatusId = destination.droppableId

      // Compute new order value
      const targetGroup = tasks
        .filter((t) => t.statusId === targetStatusId && t.id !== draggableId)
        .sort((a, b) => a.order - b.order)

      let newOrder: number
      if (targetGroup.length === 0) {
        newOrder = 0
      } else if (destination.index === 0) {
        newOrder = targetGroup[0].order - 1
      } else if (destination.index >= targetGroup.length) {
        newOrder = targetGroup[targetGroup.length - 1].order + 1
      } else {
        const before = targetGroup[destination.index - 1].order
        const after = targetGroup[destination.index].order
        newOrder = (before + after) / 2
      }

      // Optimistic update
      const next = tasks.map((t) =>
        t.id === draggableId ? { ...t, statusId: targetStatusId, order: newOrder } : t
      )
      setTasks(next)

      try {
        await onTaskMove?.(draggableId, targetStatusId, newOrder)
      } catch {
        toast.error(tCommon('toasts.failed'))
        setTasks(initialTasks)
      } finally {
        isSaving.current = false
      }
    },
    [tasks, initialTasks, onTaskMove]
  )

  const tasksByStatus = getTasksByStatus(tasks)

  if (!isMounted) return null

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {statuses.map((status) => {
          const columnTasks = tasksByStatus[status.id] || []
          return (
            <div
              key={status.id}
              className="flex w-72 flex-shrink-0 flex-col rounded-xl border border-border/50 bg-muted/20 max-h-[calc(100vh-260px)]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border/40">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  {projectId ? (
                    <InlineEditTitle
                      value={status.name}
                      onSave={async (name) => {
                        const res = await fetch(
                          `/api/task-projects/${projectId}/statuses/${status.id}`,
                          {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name }),
                          }
                        )
                        if (!res.ok) throw new Error('fail')
                        router.refresh()
                      }}
                      className="text-xs font-semibold uppercase tracking-wider text-foreground"
                    />
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground truncate">
                      {status.name}
                    </span>
                  )}
                  <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0">
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddTask?.(status.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Cards */}
              <Droppable droppableId={status.id} type="KANBAN_CARD">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors duration-150',
                      snapshot.isDraggingOver && 'bg-primary/5'
                    )}
                    style={{ minHeight: 80 }}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            style={{
                              ...dragProvided.draggableProps.style,
                              // Prevent transform jitter — use direct style
                            }}
                            className={cn(
                              'rounded-xl transition-shadow duration-150',
                              dragSnapshot.isDragging && 'shadow-xl ring-2 ring-primary/20 rotate-[0.8deg]'
                            )}
                          >
                            {/* Drag handle + card in a wrapper */}
                            <div className="group relative">
                              {/* Grip handle — only shows on hover */}
                              <div
                                {...dragProvided.dragHandleProps}
                                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <TaskCard
                                task={task}
                                onClick={() => !dragSnapshot.isDragging && onTaskClick?.(task)}
                                isDragging={dragSnapshot.isDragging}
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                      <button
                        onClick={() => onAddTask?.(status.id)}
                        className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-border/40 py-5 text-xs text-muted-foreground/60 hover:border-border hover:text-muted-foreground transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        {t('addTask')}
                      </button>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
