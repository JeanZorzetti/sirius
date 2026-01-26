'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Item = {
  id: string
  text: string
}

function SortableItem({ item }: { item: Item }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 bg-white dark:bg-zinc-800 rounded-lg border-2 border-indigo-500 mb-2 cursor-grab active:cursor-grabbing hover:border-indigo-600"
    >
      <p className="text-lg font-semibold">{item.text}</p>
    </div>
  )
}

export default function TestKanbanPage() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', text: '🔴 TESTE DENTRO DO DASHBOARD LAYOUT' },
    { id: '2', text: '🟢 Se funcionar: layout não é o problema' },
    { id: '3', text: '🔵 Se NÃO funcionar: layout está bloqueando' },
    { id: '4', text: '🟡 Arraste-me para testar!' },
  ])

  const [activeItem, setActiveItem] = useState<Item | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: any) => {
    const item = items.find((i) => i.id === event.active.id)
    setActiveItem(item || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }

    setActiveItem(null)
  }

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
        <h1 className="text-2xl font-bold mb-4 text-white">
          🧪 TESTE: Drag dentro do Dashboard Layout
        </h1>
        <p className="text-zinc-400 mb-6">
          Este teste está DENTRO do layout do dashboard (com overflow-y-auto).
          Compare com /test-drag que está FORA do layout.
        </p>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item) => (
                <SortableItem key={item.id} item={item} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeItem ? (
              <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border-2 border-indigo-600 shadow-2xl cursor-grabbing">
                <p className="text-lg font-semibold">{activeItem.text}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="mt-6 p-4 bg-zinc-800 rounded-lg">
          <h3 className="text-sm font-semibold text-zinc-300 mb-2">
            📊 Comparação:
          </h3>
          <ul className="text-sm text-zinc-400 space-y-1">
            <li>✅ /test-drag - Fora do layout (sem overflow)</li>
            <li>❓ /dashboard/test-kanban - DENTRO do layout (COM overflow-y-auto)</li>
            <li>❓ /dashboard - Kanban real (COM overflow-y-auto)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
