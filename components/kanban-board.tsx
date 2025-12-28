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
import { Card, CardContent } from '@/components/ui/card'
import { updateDealStage } from '@/app/dashboard/actions'
import { EditDealDialog } from '@/components/deals/edit-deal-dialog'
import { MessageCircle, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Deal = {
  id: string
  title: string
  value: any
  stageId: string
  contact?: {
    name: string
    phone?: string | null
  } | null
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
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (!deal.contact?.phone) return
    const phone = deal.contact.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition-all duration-300 cursor-grab active:cursor-grabbing",
        "bg-card border-border hover:border-indigo-500/30",
        "hover:-translate-y-1 hover:shadow-[0_8px_20px_-8px_rgba(99,102,241,0.2)] dark:bg-[#121217] dark:border-white/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-foreground line-clamp-2 leading-relaxed dark:text-zinc-200">
          {deal.title}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Valor</span>
          <span className="text-sm font-mono font-bold text-indigo-400">
            {deal.value ? `R$ ${Number(deal.value).toFixed(2)}` : '-'}
          </span>
        </div>

        {deal.contact?.phone && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400 transition-colors"
            onClick={handleWhatsApp}
            title={`Conversar com ${deal.contact.name}`}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        )}
      </div>

      {deal.contact && (
        <div className="pt-3 border-t border-border/50 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-700" />
          <div className="text-xs text-muted-foreground truncate max-w-[150px]">{deal.contact.name}</div>
        </div>
      )}
    </div>
  )
}

function SortableDealCard({ deal, onClick }: { deal: Deal, onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id, data: { type: 'Deal', deal } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, // Dim when dragging original
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

  const totalValue = stage.deals.reduce((acc, deal) => acc + (deal.value ? Number(deal.value) : 0), 0)

  return (
    <div ref={setNodeRef} className="w-[320px] flex-none flex flex-col h-full">
      {/* Column Header */}
      <div className="flex flex-col gap-1 px-1 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
            {stage.name}
          </h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 px-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
            {stage.deals.length}
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-zinc-900 overflow-hidden mt-2">
          <div className="h-full bg-indigo-500/20 w-full" />
        </div>
        <div className="mt-1 text-xs font-mono text-zinc-500">
          Total: <span className="text-indigo-400/80">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Column Body (Glass) */}
      <div className="flex-1 rounded-2xl bg-white/[0.02] p-3 border border-white/5">
        <SortableContext
          items={stage.deals.map((deal) => deal.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3 min-h-[150px]">
            {stage.deals.map((deal) => (
              <SortableDealCard
                key={deal.id}
                deal={deal}
                onClick={() => onDealClick(deal)}
              />
            ))}
            {stage.deals.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/5 bg-white/[0.01] p-4 text-center gap-3 transition-colors hover:bg-white/[0.02]">
                <div className="rounded-full bg-zinc-900/50 p-3 ring-1 ring-white/10">
                  <div className="w-5 h-5 opacity-20 bg-zinc-400 mask-icon" /> {/* Placeholder for icon if needed, or just pure CSS shapes */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-zinc-600 opacity-50">
                    <path d="M19 11V9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M5 11C5 11 5 14.5455 5 16C5 19.866 8.13401 23 12 23C15.866 23 19 19.866 19 16C19 14.5455 19 11 19 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M12 11V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-zinc-500">Vazio</span>
                  <span className="text-[10px] text-zinc-600">Arraste um card para cá</span>
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

export function KanbanBoard({ stages: initialStages, contacts }: KanbanBoardProps) {
  const [stages, setStages] = useState(initialStages)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)

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
      <div className="flex h-full gap-6 overflow-x-auto pb-4 px-2 snap-x">
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
          <div className="rotate-2 scale-105 shadow-2xl shadow-indigo-500/20 cursor-grabbing">
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
