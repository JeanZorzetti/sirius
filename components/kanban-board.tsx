'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableProvided,
  DroppableProvided,
  DraggableStateSnapshot
} from '@hello-pangea/dnd'
import { Card, CardContent } from '@/components/ui/card'
import { updateDealStage } from '@/app/dashboard/actions'
import { updateStageOrder, deleteStage, updateStage, createStage } from '@/app/dashboard/pipeline/actions'
import { reorderDeals } from '@/app/dashboard/deals/actions'
import { EditDealDialog } from '@/components/deals/edit-deal-dialog'
import { MessageCircle, GripVertical, MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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

// Reorder helper
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

function DealCard({
  deal,
  provided,
  snapshot,
  onClick
}: {
  deal: Deal
  provided: DraggableProvided
  snapshot: DraggableStateSnapshot
  onClick?: () => void
}) {
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!deal.contact?.phone) return
    const phone = deal.contact.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }

  // Remove transition during drag for instant movement (no elastic/lag feeling)
  const style: React.CSSProperties = {
    ...provided.draggableProps.style,
    cursor: snapshot.isDragging ? 'grabbing' : 'grab',
  }

  // Check if deal is overdue
  const isOverdue = deal.dueDate && new Date(deal.dueDate) < new Date()

  const cardContent = (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onClick}
      style={style}
      data-tour={isOverdue ? "overdue-task" : "deal-card"}
      className={cn(
        "group relative flex gap-3 rounded-xl border p-4 shadow-sm select-none",
        "bg-card border-border hover:border-indigo-500/30",
        "dark:bg-[#121217] dark:border-white/5",
        snapshot.isDragging && "shadow-2xl shadow-indigo-500/40 z-[9999] ring-2 ring-indigo-500 rotate-2 scale-105",
        isOverdue && "border-red-500 border-2 bg-red-50 dark:bg-red-950/20"
      )}
    >
      {/* Drag Handle */}
      <div className="shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-5 w-5 text-zinc-400 hover:text-indigo-500 transition-colors pointer-events-none" />
      </div>

      {/* Card Content */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-foreground line-clamp-2 leading-relaxed dark:text-zinc-200">
            {deal.title}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
              Valor
            </span>
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
            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
              {deal.contact.name}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // PORTAL SOLUTION: Render card directly in body when dragging
  // This escapes the backdrop-blur stacking context that breaks positioning
  if (snapshot.isDragging && typeof document !== 'undefined') {
    return createPortal(cardContent, document.body)
  }

  return cardContent
}

function KanbanColumn({
  stage,
  onDealClick,
  onRename,
  onDelete
}: {
  stage: Stage
  onDealClick?: (deal: Deal) => void
  onRename?: (id: string, name: string) => void
  onDelete?: (id: string) => void
}) {
  const totalValue = stage.deals.reduce((acc, deal) => acc + (deal.value ? Number(deal.value) : 0), 0)

  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(stage.name)

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRename?.(stage.id, newName)
    setIsEditing(false)
  }

  return (
    <div className="w-70 sm:w-80 flex-none flex flex-col h-full">
      {/* Column Header */}
      <div className="flex flex-col gap-1 px-1 mb-4 select-none">
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

      {/* Column Body - Droppable Area */}
      <Droppable droppableId={stage.id} type="DEAL">
        {(provided: DroppableProvided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-xl p-3 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
              snapshot.isDraggingOver && "border-indigo-500/30 bg-indigo-500/5"
            )}
          >
            <div className="flex flex-col gap-3 min-h-[150px]">
              {stage.deals.map((deal, index) => (
                <Draggable key={deal.id} draggableId={deal.id} index={index}>
                  {(provided, snapshot) => (
                    <DealCard
                      deal={deal}
                      provided={provided}
                      snapshot={snapshot}
                      onClick={() => onDealClick?.(deal)}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {stage.deals.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/5 bg-white/[0.01] p-4 text-center gap-3 transition-colors hover:bg-white/[0.02]">
                  <div className="rounded-full bg-zinc-900/50 p-3 ring-1 ring-white/10">
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
          </div>
        )}
      </Droppable>
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
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)

  // New Stage Dialog
  const [isNewStageOpen, setIsNewStageOpen] = useState(false)
  const [newStageName, setNewStageName] = useState("")

  // Filters
  const [searchQuery, setSearchQuery] = useState("")

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setStages(initialStages.sort((a, b) => a.order - b.order))
  }, [initialStages])

  // Filter deals based on search
  const filteredStages = useMemo(() => {
    if (!searchQuery) {
      return stages
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
      onSuccess?.()
    } else {
      alert('Erro ao criar etapa')
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // Dropped outside
    if (!destination) return

    // No movement
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const sourceStageIndex = stages.findIndex(s => s.id === source.droppableId)
    const destStageIndex = stages.findIndex(s => s.id === destination.droppableId)

    if (sourceStageIndex === -1 || destStageIndex === -1) return

    const sourceStage = stages[sourceStageIndex]
    const destStage = stages[destStageIndex]

    // Same column reorder
    if (source.droppableId === destination.droppableId) {
      const newDeals = reorder(sourceStage.deals, source.index, destination.index)

      setStages(prev => {
        const newStages = [...prev]
        newStages[sourceStageIndex] = {
          ...sourceStage,
          deals: newDeals
        }
        return newStages
      })

      // Persist to backend
      const reorderedDeals = newDeals.map((deal, index) => ({ id: deal.id, order: index }))
      await reorderDeals(sourceStage.id, reorderedDeals)

    } else {
      // Moving to different column
      const sourceDeal = sourceStage.deals[source.index]

      // Remove from source
      const newSourceDeals = [...sourceStage.deals]
      newSourceDeals.splice(source.index, 1)

      // Add to destination
      const newDestDeals = [...destStage.deals]
      const updatedDeal = { ...sourceDeal, stageId: destStage.id }
      newDestDeals.splice(destination.index, 0, updatedDeal)

      setStages(prev => {
        const newStages = [...prev]
        newStages[sourceStageIndex] = {
          ...sourceStage,
          deals: newSourceDeals
        }
        newStages[destStageIndex] = {
          ...destStage,
          deals: newDestDeals
        }
        return newStages
      })

      // Persist to backend
      // 1. Update deal's stage
      await updateDealStage(sourceDeal.id, destStage.id)

      // 2. Update order in destination stage
      const reorderedDeals = newDestDeals.map((deal, index) => ({ id: deal.id, order: index }))
      await reorderDeals(destStage.id, reorderedDeals)
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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
          data-tour="pipeline"
          className="flex h-full gap-6 pb-4 px-2 overflow-x-auto"
        >
          {filteredStages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              onDealClick={(deal) => setEditingDeal(deal)}
              onRename={handleRenameStage}
              onDelete={handleDeleteStage}
            />
          ))}
          <div className="w-10 shrink-0" />
        </div>
      </div>

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
    </DragDropContext>
  )
}
