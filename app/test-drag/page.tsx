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

export default function TestDragPage() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', text: '🔴 Item 1 - Arraste-me' },
    { id: '2', text: '🟢 Item 2 - Arraste-me' },
    { id: '3', text: '🔵 Item 3 - Arraste-me' },
    { id: '4', text: '🟡 Item 4 - Arraste-me' },
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
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">
          🧪 TESTE DE DRAG AND DROP
        </h1>
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 text-zinc-200">
            TESTE BÁSICO - dnd-kit
          </h2>
          <p className="text-zinc-400 mb-6">
            Se conseguir arrastar estes itens, o dnd-kit funciona. Se não
            funcionar, há problema na instalação/configuração global.
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

          <div className="mt-8 p-4 bg-zinc-800 rounded-lg">
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">
              📊 Status:
            </h3>
            <ul className="text-sm text-zinc-400 space-y-1">
              <li>✅ PointerSensor configurado (distance: 8px)</li>
              <li>✅ SortableContext + useSortable</li>
              <li>✅ Listeners no elemento inteiro</li>
              <li>✅ DragOverlay funcionando</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
