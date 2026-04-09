'use client'

import { useState, useCallback } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { ChevronDown, ChevronRight, Plus, MessageSquare, ListChecks, Link2, GripVertical } from 'lucide-react'
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
  onTaskMove?: (taskId: string, statusId: string, order: number) => Promise<void>
}

export function TaskListView({
  tasks,
  statuses,
  onTaskClick,
  onToggleComplete,
  onAddTask,
  onTaskMove,
}: TaskListViewProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [optimisticTasks, setOptimisticTasks] = useState<TaskLite[] | null>(null)

  const toggleCollapse = useCallback((statusId: string) => {
    setCollapsed((prev) => ({ ...prev, [statusId]: !prev[statusId] }))
  }, [])

  const workingTasks = optimisticTasks || tasks

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result
      if (!destination) return
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return
      }

      const targetStatusId = destination.droppableId
      const targetGroup = workingTasks
        .filter((t) => t.statusId === targetStatusId && t.id !== draggableId)
        .sort((a, b) => a.order - b.order)

      // Compute new order based on position in target group
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
      const next = workingTasks.map((t) =>
        t.id === draggableId ? { ...t, statusId: targetStatusId, order: newOrder } : t
      )
      setOptimisticTasks(next)

      try {
        await onTaskMove?.(draggableId, targetStatusId, newOrder)
        setOptimisticTasks(null)
      } catch {
        // Rollback
        setOptimisticTasks(null)
      }
    },
    [workingTasks, onTaskMove]
  )

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-2">
        {statuses.map((status) => {
          const groupTasks = workingTasks
            .filter((t) => t.statusId === status.id)
            .sort((a, b) => a.order - b.order)
          const isCollapsed = collapsed[status.id]

          return (
            <div
              key={status.id}
              className="rounded-xl border border-border/50 bg-card overflow-hidden"
            >
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
                <Droppable droppableId={status.id} type="TASK">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'divide-y divide-border/30 border-t border-border/30 transition-colors',
                        snapshot.isDraggingOver && 'bg-indigo-500/5'
                      )}
                    >
                      {groupTasks.length === 0 && !snapshot.isDraggingOver ? (
                        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                          Nenhuma tarefa neste status
                        </div>
                      ) : (
                        groupTasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                className={cn(
                                  snap.isDragging && 'bg-background shadow-lg ring-1 ring-indigo-500/30'
                                )}
                              >
                                <TaskRow
                                  task={task}
                                  dragHandleProps={prov.dragHandleProps}
                                  onClick={() => onTaskClick?.(task)}
                                  onToggleComplete={onToggleComplete}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}

interface TaskRowProps {
  task: TaskLite
  dragHandleProps?: any
  onClick?: () => void
  onToggleComplete?: (task: TaskLite) => Promise<void>
}

function TaskRow({ task, dragHandleProps, onClick, onToggleComplete }: TaskRowProps) {
  const isCompleted = !!task.completedAt

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors',
        isCompleted && 'opacity-60'
      )}
    >
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggleComplete?.(task)}
        />
      </div>

      <TaskPriorityIcon priority={task.priority} />

      <button
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
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
      </button>

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
