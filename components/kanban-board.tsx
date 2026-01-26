'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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
  DragOverEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { updateDealStage } from '@/app/dashboard/actions'
import { updateStageOrder, deleteStage, updateStage, createStage } from '@/app/dashboard/pipeline/actions'
import { reorderDeals } from '@/app/dashboard/deals/actions'
import { EditDealDialog } from '@/components/deals/edit-deal-dialog'
import { MessageCircle, GripVertical, MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDragScroll } from '@/hooks/useDragScroll'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"

type Deal = {
  id: string
  title: string
  value: any
  stageId: string
  contact?: {
    name: string
    phone?: string | null
  } | null
  closeDate?: string | Date | null
  dueDate?: string | Date | null
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
  phone?: string | null
}

type KanbanBoardProps = {
  stages: Stage[]
  contacts: Contact[]
  onOptimisticUpdate?: (dealId: string, updates: any) => void
  onOptimisticDelete?: (dealId: string) => void
  onRollback?: (tempId: string) => void
  onSuccess?: () => void
}

function DealCard({
  deal,
  onClick,
  dragHandleRef,
  dragHandleListeners,
  dragHandleAttributes
}: {
  deal: Deal
  onClick?: () => void
  dragHandleRef?: any
  dragHandleListeners?: any
  dragHandleAttributes?: any
}) {
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (!deal.contact?.phone) return
    const phone = deal.contact.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }

  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-xl border p-4 shadow-sm select-none",
        "bg-card border-border hover:border-indigo-500/30",
        "dark:bg-[#121217] dark:border-white/5"
      )}
    >
      {/* Drag Handle - 6 pontinhos */}
      <div
        ref={dragHandleRef}
        {...dragHandleListeners}
        {...dragHandleAttributes}
        data-drag-handle="true"
        className="flex-shrink-0 flex items-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none select-none"
        title="Arrastar card"
      >
        <GripVertical className="h-5 w-5 text-zinc-400 hover:text-indigo-500 transition-colors pointer-events-none" />
      </div>

      {/* Card Content */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-sm font-medium text-foreground line-clamp-2 leading-relaxed dark:text-zinc-200"
            draggable={false}
          >
            {deal.title}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold" draggable={false}>
              Valor
            </span>
            <span className="text-sm font-mono font-bold text-indigo-400" draggable={false}>
              {deal.value ? `R$ ${Number(deal.value).toFixed(2)}` : '-'}
            </span>
          </div>

          {deal.contact?.phone && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400 transition-colors pointer-events-auto"
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
            <div className="text-xs text-muted-foreground truncate max-w-[150px]" draggable={false}>
              {deal.contact.name}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SortableDealCard({ deal, onClick }: { deal: Deal, onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: 'Deal', deal }
  })

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
      className="cursor-grab active:cursor-grabbing"
      onClick={onClick}
    >
      <DealCard
        deal={deal}
        dragHandleRef={undefined}
        dragHandleListeners={undefined}
        dragHandleAttributes={undefined}
      />
    </div>
  )
}

function KanbanColumn({ stage, onDealClick, isOverlay, onRename, onDelete }: {
  stage: Stage,
  onDealClick?: (deal: Deal) => void,
  isOverlay?: boolean,
  onRename?: (id: string, name: string) => void,
  onDelete?: (id: string) => void
}) {
  // TESTE: DESATIVAR useSortable do column para testar se nested sortable é o problema
  // const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
  //   id: stage.id,
  //   data: { type: 'Stage', stage }
  // })

  // const style = {
  //   transform: CSS.Transform.toString(transform),
  //   transition,
  //   opacity: isDragging ? 0.5 : 1,
  // }

  const style = {}

  const totalValue = stage.deals.reduce((acc, deal) => acc + (deal.value ? Number(deal.value) : 0), 0)

  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(stage.name)

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRename?.(stage.id, newName)
    setIsEditing(false)
  }

  return (
    <div
      // ref={setNodeRef}
      style={style}
      className={cn("w-70 sm:w-80 flex-none flex flex-col h-full", isOverlay && "rotate-2 scale-105 opacity-90")}
    >
      {/* Column Header */}
      <div
        className="flex flex-col gap-1 px-1 mb-4 select-none"
        // {...attributes}
        // {...listeners} // Drag handle is the whole header area
      >
        <div className="flex items-center justify-between group/header">
          {isEditing ? (
            <form onSubmit={handleRenameSubmit} className="flex-1 mr-2">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
                onBlur={() => setIsEditing(false)}
                className="h-7 text-xs"
              />
            </form>
          ) : (
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 cursor-text" onDoubleClick={() => setIsEditing(true)}>
              {stage.name}
            </h3>
          )}

          <div className="flex items-center gap-2">
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 px-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
              {stage.deals.length}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/header:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="w-3 h-3 mr-2" /> Renomear
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(stage.id)} className="text-red-500 focus:text-red-500">
                  <Trash2 className="w-3 h-3 mr-2" /> Excluir Coluna
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="h-1 w-full rounded-full bg-zinc-900 overflow-hidden mt-2">
          <div className="h-full bg-indigo-500/20 w-full" />
        </div>
        <div className="mt-1 text-xs font-mono text-zinc-500">
          Total: <span className="text-indigo-400/80">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Column Body (Glassmorphism Enhanced) */}
      <div className="flex-1 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-xl p-3 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <SortableContext
          items={stage.deals.map((deal) => deal.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3 min-h-[150px]">
            {stage.deals.map((deal) => (
              <SortableDealCard
                key={deal.id}
                deal={deal}
                onClick={() => onDealClick?.(deal)}
              />
            ))}
            {stage.deals.length === 0 && !isOverlay && (
              <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/5 bg-white/[0.01] p-4 text-center gap-3 transition-colors hover:bg-white/[0.02]">
                <div className="rounded-full bg-zinc-900/50 p-3 ring-1 ring-white/10">
                  <div className="w-5 h-5 opacity-20 bg-zinc-400 mask-icon" />
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

export function KanbanBoard({
  stages: initialStages,
  contacts,
  onOptimisticUpdate,
  onOptimisticDelete,
  onRollback,
  onSuccess
}: KanbanBoardProps) {
  const [stages, setStages] = useState(initialStages)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [activeStage, setActiveStage] = useState<Stage | null>(null) // For Column Drag
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)

  // New Stage Dialog
  const [isNewStageOpen, setIsNewStageOpen] = useState(false)
  const [newStageName, setNewStageName] = useState("")

  // Filters
  const [searchQuery, setSearchQuery] = useState("")

  // Drag to scroll functionality - TEMPORARIAMENTE DESATIVADO PARA TESTE
  // const scrollContainerRef = useDragScroll<HTMLDivElement>()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Sort local input stages carefully if needed, but assuming server sends ordered
    setStages(initialStages.sort((a, b) => a.order - b.order))
  }, [initialStages])

  // Filter deals based on search - CRITICAL: Use useMemo to maintain object references for dnd-kit
  const filteredStages = useMemo(() => {
    if (!searchQuery) {
      return stages // NO filter: return original stages to maintain references
    }

    const query = searchQuery.toLowerCase()
    return stages.map(stage => ({
      ...stage,
      deals: stage.deals.filter(deal =>
        deal.title.toLowerCase().includes(query) ||
        deal.contact?.name.toLowerCase().includes(query)
      )
    }))
  }, [stages, searchQuery])

  // Handlers for Stage CRUD
  const handleRenameStage = async (id: string, name: string) => {
    // Optimistic
    setStages(prev => prev.map(s => s.id === id ? { ...s, name } : s))
    await updateStage(id, name)
    onSuccess?.()
  }

  const handleDeleteStage = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta etapa?")) return
    const result = await deleteStage(id)
    if (result.success) {
      setStages(prev => prev.filter(s => s.id !== id))
      onSuccess?.()
    } else {
      alert(result.error || "Erro ao excluir etapa")
    }
  }

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStageName) return

    const result = await createStage(newStageName)
    if (result.success) {
      setIsNewStageOpen(false)
      setNewStageName("")
      // Trigger router.refresh() via callback para recarregar props do servidor
      onSuccess?.()
    } else {
      alert('Erro ao criar etapa')
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Pixels to move before drag starts
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const type = active.data.current?.type

    // Add dragging class to body to prevent text selection globally
    // TEMPORARIAMENTE DESATIVADO PARA TESTE
    // document.body.classList.add('dragging')

    // TESTE: Comentar Stage dragging
    // if (type === 'Stage') {
    //   const stage = stages.find(s => s.id === active.id)
    //   setActiveStage(stage || null)
    //   return
    // }

    if (type === 'Deal') {
      const deal = stages
        .flatMap((stage) => stage.deals)
        .find((d) => d.id === active.id)
      // Create a shallow copy to preserve the original stageId
      setActiveDeal(deal ? { ...deal } : null)
      return
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    const isActiveDeal = active.data.current?.type === 'Deal'
    const isOverDeal = over.data.current?.type === 'Deal'
    const isOverStage = over.data.current?.type === 'Stage'

    // Dealing with Deal Dragging over other Columns/Deals for sorting previews
    if (!isActiveDeal) return

    // Find the containers
    const activeStage = stages.find(s => s.deals.some(d => d.id === activeId))

    let overStage: Stage | undefined
    if (isOverDeal) {
      overStage = stages.find(s => s.deals.some(d => d.id === overId))
    } else if (isOverStage) {
      overStage = stages.find(s => s.id === overId)
    }

    if (!activeStage || !overStage || activeStage === overStage) {
      return
      // Intra-column reordering handled by SortableContext automatically? 
      // Actually DndKit Sortable requires mutating the items array for visual updates during drag
      // if we want smooth sorting... 
      // But implementing full optimistic sorting logic inside dragOver is complex.
      // Let's rely on standard logic for now and see.
    }

    // If moving between columns, we need to move the item in `stages` state specifically for the visual
    // This is "Portal" logic using immutable patterns to prevent state mutation side-effects
    setStages((prev) => {
      const activeIndex = activeStage.deals.findIndex(d => d.id === activeId)
      const overIndex = isOverDeal ? overStage!.deals.findIndex(d => d.id === overId) : overStage!.deals.length

      const newStages = [...prev]
      const sourceStageIndex = newStages.findIndex(s => s.id === activeStage.id)
      const targetStageIndex = newStages.findIndex(s => s.id === overStage!.id)

      // Clone the source and target stage objects and their deals arrays
      const sourceStage = { ...newStages[sourceStageIndex], deals: [...newStages[sourceStageIndex].deals] }
      const targetStage = { ...newStages[targetStageIndex], deals: [...newStages[targetStageIndex].deals] }

      // Remove deal from source and clone it with updated stageId
      const [movedDeal] = sourceStage.deals.splice(activeIndex, 1)
      const updatedDeal = { ...movedDeal, stageId: overStage!.id }

      // Insert into target
      targetStage.deals.splice(overIndex, 0, updatedDeal)

      // Update stages array with cloned stages
      newStages[sourceStageIndex] = sourceStage
      newStages[targetStageIndex] = targetStage

      return newStages
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    // Remove dragging class from body
    // TEMPORARIAMENTE DESATIVADO PARA TESTE
    // document.body.classList.remove('dragging')

    if (!over) {
      setActiveDeal(null)
      setActiveStage(null)
      return
    }

    const activeId = active.id
    const overId = over.id
    const type = active.data.current?.type

    // --- COLUMN REORDERING --- TESTE: DESATIVADO
    // if (type === 'Stage') {
    //   if (activeId === overId) {
    //     setActiveDeal(null)
    //     setActiveStage(null)
    //     return
    //   }

    //   const oldIndex = stages.findIndex(s => s.id === activeId)
    //   const newIndex = stages.findIndex(s => s.id === overId)

    //   const newStages = arrayMove(stages, oldIndex, newIndex)
    //   setStages(newStages) // Optimistic

    //   // Prepare for server
    //   const reorderedStages = newStages.map((s, index) => ({
    //     id: s.id,
    //     order: index
    //   }))
    //   await updateStageOrder(reorderedStages)

    //   setActiveDeal(null)
    //   setActiveStage(null)
    //   return
    // }

    // --- DEAL REORDERING ---
    // Use activeDeal's original stageId (from before drag started) to detect cross-column moves
    const originalStageId = activeDeal?.stageId
    const overStage = stages.find(s => s.deals.some(d => d.id === overId)) || stages.find(s => s.id === overId)

    if (!originalStageId || !overStage) {
      setActiveDeal(null)
      setActiveStage(null)
      return
    }

    // Check if it's a cross-column move or intra-column reorder
    const isSameColumn = originalStageId === overStage.id

    if (isSameColumn) {
      // Intra-column reordering
      const stageIndex = stages.findIndex(s => s.id === overStage.id)
      const oldDealIndex = stages[stageIndex].deals.findIndex(d => d.id === activeId)
      const newDealIndex = stages[stageIndex].deals.findIndex(d => d.id === overId)

      if (oldDealIndex === newDealIndex) {
        setActiveDeal(null)
        setActiveStage(null)
        return // No change
      }

      // Update state optimistically
      setStages(prev => {
        const newStages = [...prev]
        newStages[stageIndex] = {
          ...newStages[stageIndex],
          deals: arrayMove(newStages[stageIndex].deals, oldDealIndex, newDealIndex)
        }
        return newStages
      })

      // Persist to database
      const reorderedDeals = arrayMove(
        stages[stageIndex].deals,
        oldDealIndex,
        newDealIndex
      ).map((deal, index) => ({
        id: deal.id,
        order: index
      }))

      await reorderDeals(overStage.id, reorderedDeals)
    } else {
      // Cross-column move - update the stage
      // The visual update was already done in handleDragOver
      const finalStage = stages.find(s => s.deals.some(d => d.id === activeId))
      if (finalStage) {
        await updateDealStage(activeId as string, finalStage.id)

        // Also update the order within the new column
        const finalStageIndex = stages.findIndex(s => s.id === finalStage.id)
        const reorderedDeals = stages[finalStageIndex].deals.map((deal, index) => ({
          id: deal.id,
          order: index
        }))
        await reorderDeals(finalStage.id, reorderedDeals)
      }
    }

    // Clear active items at the very end
    setActiveDeal(null)
    setActiveStage(null)

    // Ensure dragging class is removed (safety check)
    // TEMPORARIAMENTE DESATIVADO PARA TESTE
    // document.body.classList.remove('dragging')
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full gap-4">
        {/* Pipeline Header / Toolbar */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filtrar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-[200px] bg-white/5 border-white/10"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsNewStageOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Etapa
          </Button>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex h-full gap-6 overflow-x-auto pb-4 px-2 snap-x scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
        >
          {/* TESTE: Comentar SortableContext das stages para isolar nested sortable problem */}
          {/* <SortableContext items={stages.map(s => s.id)} strategy={horizontalListSortingStrategy}> */}
            {filteredStages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                onDealClick={(deal) => setEditingDeal(deal)}
                onRename={handleRenameStage}
                onDelete={handleDeleteStage}
              />
            ))}
          {/* </SortableContext> */}
          <div className="w-10 shrink-0" /> {/* Padding end */}
        </div>
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="rotate-2 scale-105 shadow-2xl shadow-indigo-500/20 cursor-grabbing w-[300px]">
            <DealCard deal={activeDeal} />
          </div>
        ) : activeStage ? (
          <div className="h-full opacity-80">
            <KanbanColumn
              stage={activeStage}
              isOverlay
              onDealClick={() => { }}
            />
          </div>
        ) : null}
      </DragOverlay>

      <EditDealDialog
        deal={editingDeal}
        open={!!editingDeal}
        onOpenChange={(open) => !open && setEditingDeal(null)}
        stages={stages}
        contacts={contacts}
        onOptimisticUpdate={onOptimisticUpdate}
        onOptimisticDelete={onOptimisticDelete}
        onRollback={onRollback}
        onSuccess={onSuccess}
      />

      <Dialog open={isNewStageOpen} onOpenChange={setIsNewStageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Etapa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateStage} className="space-y-4">
            <Input
              placeholder="Nome da etapa (ex: Negociação)"
              value={newStageName}
              onChange={e => setNewStageName(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button type="submit">Criar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DndContext>
  )
}
