'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateDealStage } from '@/app/dashboard/actions'
import { EditDealDialog } from '@/components/deals/edit-deal-dialog'

type Deal = {
  id: string
  title: string
  value: any
  stageId: string
}

type Stage = {
  id: string
  name: string
  order: number
  deals: Deal[]
}

type Contact = {
  id: string
  name: string
}

type KanbanBoardProps = {
  stages: Stage[]
  contacts: Contact[]
}

function DealCard({ deal, onClick }: { deal: Deal, onClick?: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium">{deal.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-muted-foreground">
          {deal.value ? `R$ ${Number(deal.value).toFixed(2)}` : 'Sem valor'}
        </div>
      </CardContent>
    </Card>
  )
}

function SortableDealCard({ deal, onClick }: { deal: Deal, onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id, data: { type: 'Deal', deal } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} onClick={onClick} />
    </div>
  )
}

function KanbanColumn({ stage, onDealClick }: { stage: Stage, onDealClick: (deal: Deal) => void }) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
    data: { type: 'Stage', stage }
  })

  return (
    <div ref={setNodeRef} className="w-[300px] flex-none flex flex-col gap-4">
      <div className="flex justify-between items-center rounded-md border bg-muted/40 p-3 shadow-sm select-none">
        <span className="font-semibold">{stage.name}</span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full border">
          {stage.deals.length}
        </span>
      </div>

      <SortableContext
        items={stage.deals.map((deal) => deal.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 min-h-[150px] p-1 rounded-md bg-muted/10 border border-dashed border-transparent hover:border-muted-foreground/20 transition-colors">
          {stage.deals.map((deal) => (
            <SortableDealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal)}
            />
          ))}
          {stage.deals.length === 0 && (
            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground opacity-50 py-4">
              Arraste items aqui
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function KanbanBoard({ stages: initialStages, contacts }: KanbanBoardProps) {
  const [stages, setStages] = useState(initialStages)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)

  // Update local state when editingDeal changes (if needed, or just let revalidation handle it)
  // For now, relies on revalidation updating the 'initialStages' prop, but since this is client state, 
  // 'initialStages' might not trigger re-render if key doesn't change.
  // Ideally we should update local state on successful edit, OR key the component on 'stages'.
  // But let's stick to simple dialog first. If we edit, page revalidates = prop updates? 
  // Next.js client components inside server components update if server re-renders.
  useEffect(() => {
    setStages(initialStages)
  }, [initialStages])


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const deal = stages
      .flatMap((stage) => stage.deals)
      .find((d) => d.id === active.id)
    setActiveDeal(deal || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveDeal(null)
      return
    }

    const dealId = active.id as string
    const overId = over.id as string

    // Find source deal and stage
    const sourceStage = stages.find(s => s.deals.some(d => d.id === dealId))
    const sourceDeal = sourceStage?.deals.find(d => d.id === dealId)

    if (!sourceDeal || !sourceStage) {
      setActiveDeal(null)
      return
    }

    // Determine target stage
    let targetStageId = ''

    // 1. Dropped directly on a Stage column (thanks to useDroppable)
    const stageDirectHit = stages.find(s => s.id === overId)
    if (stageDirectHit) {
      targetStageId = stageDirectHit.id
    } else {
      // 2. Dropped on another Deal (use Sortable context info)
      const targetStage = stages.find(s => s.deals.some(d => d.id === overId))
      if (targetStage) {
        targetStageId = targetStage.id
      }
    }

    if (!targetStageId || targetStageId === sourceStage.id) {
      setActiveDeal(null)
      return
    }

    // Optimistic Update
    setStages((prev) => {
      return prev.map(stage => {
        if (stage.id === sourceStage.id) {
          return { ...stage, deals: stage.deals.filter(d => d.id !== dealId) }
        }
        if (stage.id === targetStageId) {
          return { ...stage, deals: [...stage.deals, { ...sourceDeal, stageId: targetStageId }] }
        }
        return stage
      })
    })

    // Server Update
    const result = await updateDealStage(dealId, targetStageId)
    if (!result.success) {
      console.error("Reverting due to error", result.error)
      setStages(initialStages) // Revert
    }

    setActiveDeal(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            onDealClick={(deal) => setEditingDeal(deal)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="rotate-3 shadow-2xl">
            <DealCard deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>

      <EditDealDialog
        deal={editingDeal}
        open={!!editingDeal}
        onOpenChange={(open) => !open && setEditingDeal(null)}
        stages={stages}
        contacts={contacts}
      />
    </DndContext>
  )
}
