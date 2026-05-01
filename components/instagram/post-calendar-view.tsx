'use client'
import { useState, useCallback } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, format, addMonths, subMonths, isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from '@hello-pangea/dnd'
import { PostCalendarItem, CalendarPost } from './post-calendar-item'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function PostCalendarView({
  posts: initialPosts,
  onPostClick,
  onDayClick,
}: {
  posts: CalendarPost[]
  onPostClick: (id: string) => void
  onDayClick: (date: Date) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [posts, setPosts] = useState<CalendarPost[]>(initialPosts)
  const [dragging, setDragging] = useState(false)

  // Keep in sync when parent passes new posts (e.g. after refresh)
  // but don't override optimistic updates — only sync on full list change
  const [prevInitial, setPrevInitial] = useState(initialPosts)
  if (initialPosts !== prevInitial) {
    setPrevInitial(initialPosts)
    setPosts(initialPosts)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  function getPostsForDay(day: Date) {
    return posts
      .filter(p => isSameDay(new Date(p.scheduledFor), day))
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
  }

  const handleDragEnd = useCallback(async (result: DropResult) => {
    setDragging(false)
    const { draggableId, destination } = result
    if (!destination) return

    const targetDate = new Date(destination.droppableId)
    const post = posts.find(p => p.id === draggableId)
    if (!post) return

    const originalDate = new Date(post.scheduledFor)
    if (isSameDay(originalDate, targetDate)) return

    // Preserve the original time, only change the date
    const newScheduledFor = new Date(targetDate)
    newScheduledFor.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0)

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === draggableId
        ? { ...p, scheduledFor: newScheduledFor.toISOString() }
        : p
    ))

    try {
      const res = await fetch(`/api/instagram/posts/${draggableId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor: newScheduledFor.toISOString() }),
      })
      if (!res.ok) throw new Error('reschedule failed')
    } catch {
      // Rollback on failure
      setPosts(prev => prev.map(p =>
        p.id === draggableId
          ? { ...p, scheduledFor: post.scheduledFor }
          : p
      ))
    }
  }, [posts])

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={() => setDragging(true)}>
      <div className="flex flex-col gap-3">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setCurrentMonth(new Date())}>
              Hoje
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1.5">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
          {days.map(day => {
            const dayPosts = getPostsForDay(day)
            const visible = dayPosts.slice(0, 3)
            const overflow = dayPosts.length - 3
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const today = isToday(day)
            const droppableId = format(day, 'yyyy-MM-dd')

            return (
              <Droppable droppableId={droppableId} key={droppableId} type="POST">
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    onClick={() => !dragging && isCurrentMonth && onDayClick(day)}
                    className={`bg-card min-h-[90px] p-1.5 flex flex-col gap-0.5 transition-colors
                      ${isCurrentMonth ? 'cursor-pointer' : 'opacity-25 cursor-default'}
                      ${snapshot.isDraggingOver ? 'bg-purple-500/10 ring-1 ring-inset ring-purple-500/40' : isCurrentMonth ? 'hover:bg-muted/20' : ''}
                    `}
                  >
                    <span className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full self-end mb-0.5
                      ${today ? 'bg-purple-500 text-white' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    {visible.map((p, index) => (
                      <Draggable key={p.id} draggableId={p.id} index={index}>
                        {(dragProvided: DraggableProvided, dragSnapshot: DraggableStateSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            style={{
                              ...dragProvided.draggableProps.style,
                              opacity: dragSnapshot.isDragging ? 0.85 : 1,
                            }}
                          >
                            <PostCalendarItem
                              post={p}
                              onClick={onPostClick}
                              isDragging={dragSnapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {overflow > 0 && (
                      <span className="text-[10px] text-muted-foreground px-1 mt-0.5">+{overflow} mais</span>
                    )}
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </div>
    </DragDropContext>
  )
}
