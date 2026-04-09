'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskLite, TaskStatusLite } from './task-types'
import { TaskCard } from './task-card'
import { Button } from '@/components/ui/button'

interface TaskKanbanViewProps {
  tasks: TaskLite[]
  statuses: TaskStatusLite[]
  onTaskClick?: (task: TaskLite) => void
  onTaskMove?: (taskId: string, statusId: string, order: number) => Promise<void>
  onAddTask?: (statusId: string) => void
}

export function TaskKanbanView({
  tasks: initialTasks,
  statuses,
  onTaskClick,
  onTaskMove,
  onAddTask,
}: TaskKanbanViewProps) {
  const [tasks, setTasks] = useState(initialTasks)

  const tasksByStatus = statuses.reduce<Record<string, TaskLite[]>>((acc, status) => {
    acc[status.id] = tasks
      .filter((t) => t.statusId === status.id)
      .sort((a, b) => a.order - b.order)
    return acc
  }, {})

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

      // Optimistic update
      const task = tasks.find((t) => t.id === draggableId)
      if (!task) return

      const newTasks = tasks.filter((t) => t.id !== draggableId)
      const updatedTask = {
        ...task,
        statusId: destination.droppableId,
        order: destination.index,
      }
      newTasks.push(updatedTask)
      setTasks(newTasks)

      try {
        await onTaskMove?.(draggableId, destination.droppableId, destination.index)
      } catch (err) {
        // Rollback
        setTasks(initialTasks)
      }
    },
    [tasks, onTaskMove, initialTasks]
  )

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 relative">
        {/* Mobile scroll fade indicator */}
        <div className="pointer-events-none fixed right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent sm:hidden" />
        {statuses.map((status) => {
          const columnTasks = tasksByStatus[status.id] || []
          return (
            <div
              key={status.id}
              className="flex w-80 flex-shrink-0 flex-col rounded-xl border border-border/50 bg-muted/30"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between gap-2 border-b border-border/50 p-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    {status.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onAddTask?.(status.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Droppable area */}
              <Droppable droppableId={status.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex flex-1 flex-col gap-2 p-3 transition-colors min-h-[200px]',
                      snapshot.isDraggingOver && 'bg-indigo-500/5'
                    )}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <motion.div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03, duration: 0.2 }}
                          >
                            <TaskCard
                              task={task}
                              onClick={() => onTaskClick?.(task)}
                              isDragging={dragSnapshot.isDragging}
                            />
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                      <button
                        onClick={() => onAddTask?.(status.id)}
                        className="flex items-center justify-center rounded-lg border border-dashed border-border/50 py-6 text-xs text-muted-foreground hover:border-border hover:text-foreground transition-colors"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Adicionar tarefa
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
