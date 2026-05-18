'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
import { updateDealStage, updateDealStatus, markDealWon } from '@/app/[locale]/dashboard/actions'
import { updateStageOrder, deleteStage, updateStage, createStage } from '@/app/[locale]/dashboard/pipeline/actions'
import { reorderDeals } from '@/app/[locale]/dashboard/deals/actions'
import { EditDealDialog } from '@/components/deals/edit-deal-dialog'
import { MessageCircle, GripVertical, MoreHorizontal, Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import { isToday, isTomorrow, isThisWeek, isPast } from 'date-fns'
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type Deal = {
  id: string
  title: string
  value: any
  stageId: string
  status?: string
  contact?: {
    name: string
    phone?: string | null
  } | null
  closeDate?: string | Date | null
  dueDate?: string | Date | null
}

const LOST_COLUMN_ID = '__PERDIDO__'

const LOST_REASONS = [
  'Preço alto',
  'Concorrente escolhido',
  'Sem orçamento',
  'Sem resposta',
  'Fora do escopo',
  'Timing ruim',
  'Produto inadequado',
]

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
  email?: string | null
  company?: string | null
}

type KanbanBoardProps = {
  stages: Stage[]
  contacts: Contact[]
  pipelineId?: string
  currentUserId?: string
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

type DueUrgency = 'overdue' | 'today' | 'tomorrow' | 'this-week' | null

function getDueUrgency(dueDate?: string | Date | null): DueUrgency {
  if (!dueDate) return null
  const d = new Date(dueDate)
  if (isPast(d) && !isToday(d)) return 'overdue'
  if (isToday(d)) return 'today'
  if (isTomorrow(d)) return 'tomorrow'
  if (isThisWeek(d)) return 'this-week'
  return null
}

function DealCard({
  deal,
  provided,
  snapshot,
  onClick,
  onSwipePrev,
  onSwipeNext,
  canSwipePrev,
  canSwipeNext,
}: {
  deal: Deal
  provided: DraggableProvided
  snapshot: DraggableStateSnapshot
  onClick?: () => void
  onSwipePrev?: () => void
  onSwipeNext?: () => void
  canSwipePrev?: boolean
  canSwipeNext?: boolean
}) {
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [markingWon, setMarkingWon] = useState(false)

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!deal.contact?.phone) return
    const phone = deal.contact.phone.replace(/\D/g, '')
    router.push(`/dashboard/chat?phone=${phone}`)
  }

  const handleMarkWon = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (markingWon) return
    setMarkingWon(true)
    await markDealWon(deal.id)
    router.refresh()
    setMarkingWon(false)
  }

  // Remove transition during drag for instant movement (no elastic/lag feeling)
  const style: React.CSSProperties = {
    ...provided.draggableProps.style,
    cursor: snapshot.isDragging ? 'grabbing' : 'grab',
  }

  const urgency = getDueUrgency(deal.dueDate)

  const cardContent = (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onClick}
      style={style}
      data-tour={urgency === 'overdue' ? "overdue-task" : "deal-card"}
      className={cn(
        "group relative flex gap-3 rounded-xl border p-3.5 shadow-sm transition-all duration-300 select-none",
        "bg-card border-border hover:shadow-md hover:border-primary/40",
        "dark:bg-zinc-900/80 dark:backdrop-blur-xl dark:border-white/10 dark:hover:bg-zinc-800/90",
        snapshot.isDragging && "shadow-xl shadow-primary/20 z-[9999] ring-1 ring-primary rotate-2 scale-105",
        urgency === 'overdue'   && "border-destructive border-2 ring-1 ring-destructive/20 bg-destructive/10 dark:bg-destructive/20",
        urgency === 'today'     && "border-l-[3px] border-l-red-500 bg-red-500/5 dark:bg-red-500/10",
        urgency === 'tomorrow'  && "border-l-[3px] border-l-orange-400 bg-orange-400/5 dark:bg-orange-400/10",
        urgency === 'this-week' && "border-l-[3px] border-l-yellow-400 bg-yellow-400/5 dark:bg-yellow-400/10",
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
            <span className="text-sm font-mono font-bold text-primary/90">
              {deal.value ? `R$ ${Number(deal.value).toFixed(2)}` : '-'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 touch-target rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all"
              onClick={handleMarkWon}
              disabled={markingWon}
              title="Registrar venda (Ganho)"
            >
              <Trophy className="h-3.5 w-3.5" />
            </Button>
            {deal.contact?.phone && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 touch-target rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400 transition-colors"
                onClick={handleWhatsApp}
                title={`Conversar com ${deal.contact.name}`}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
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

  // Wrap with SwipeableRow para permitir mover stages com swipe em mobile.
  // SwipeableRow tem CSS que neutraliza seus próprios gestos em lg+ (touch-action
  // padrão em pointer:fine evita interferência com drag-and-drop desktop).
  const hasSwipe = !!(onSwipePrev && canSwipePrev) || !!(onSwipeNext && canSwipeNext)
  if (!hasSwipe) return cardContent

  return (
    <SwipeableRow
      leftAction={
        canSwipePrev && onSwipePrev
          ? {
              icon: <ChevronLeft className="h-5 w-5" />,
              label: tCommon('buttons.back'),
              background: 'bg-orange-500',
              onAction: onSwipePrev,
            }
          : undefined
      }
      rightAction={
        canSwipeNext && onSwipeNext
          ? {
              icon: <ChevronRight className="h-5 w-5" />,
              label: tCommon('buttons.next'),
              background: 'bg-indigo-500',
              onAction: onSwipeNext,
            }
          : undefined
      }
    >
      {cardContent}
    </SwipeableRow>
  )
}

function KanbanColumn({
  stage,
  onDealClick,
  onRename,
  onDelete,
  onSwipeMoveDeal,
  hasPrevStage,
  hasNextStage,
}: {
  stage: Stage
  onDealClick?: (deal: Deal) => void
  onRename?: (id: string, name: string) => void
  onDelete?: (id: string) => void
  onSwipeMoveDeal?: (dealId: string, direction: 'prev' | 'next') => void
  hasPrevStage?: boolean
  hasNextStage?: boolean
}) {
  const totalValue = stage.deals.reduce((acc, deal) => acc + (deal.value ? Number(deal.value) : 0), 0)

  const tCommon = useTranslations('common')
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(stage.name)

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRename?.(stage.id, newName)
    setIsEditing(false)
  }

  return (
    <div className="w-[260px] sm:w-[300px] md:w-80 flex-none flex flex-col h-full">
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
                <Button variant="ghost" size="icon" className="h-8 w-8 touch-target opacity-100 lg:h-6 lg:w-6 lg:opacity-0 lg:group-hover/header:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="w-3 h-3 mr-2" /> {tCommon('buttons.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(stage.id)} className="text-red-500 focus:text-red-500">
                  <Trash2 className="w-3 h-3 mr-2" /> {tCommon('buttons.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="h-1 w-full rounded-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden mt-2">
          <div className="h-full bg-primary/40 w-full" />
        </div>
        <div className="mt-1 text-xs font-mono text-zinc-500">
          Total: <span className="text-primary/80 font-semibold">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Column Body - Droppable Area */}
      <Droppable droppableId={stage.id} type="DEAL">
        {(provided: DroppableProvided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-2xl p-3 border shadow-sm transition-colors",
              "bg-muted/30 border-border/50",
              "dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-white/[0.01] dark:backdrop-blur-md dark:border-white/5 dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]",
              snapshot.isDraggingOver && "border-primary/30 bg-primary/5 dark:bg-primary/10"
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
                      canSwipePrev={hasPrevStage}
                      canSwipeNext={hasNextStage}
                      onSwipePrev={
                        onSwipeMoveDeal && hasPrevStage
                          ? () => onSwipeMoveDeal(deal.id, 'prev')
                          : undefined
                      }
                      onSwipeNext={
                        onSwipeMoveDeal && hasNextStage
                          ? () => onSwipeMoveDeal(deal.id, 'next')
                          : undefined
                      }
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

function LostColumn({
  deals,
  onDealClick,
}: {
  deals: Deal[]
  onDealClick?: (deal: Deal) => void
}) {
  const totalValue = deals.reduce((acc, d) => acc + (d.value ? Number(d.value) : 0), 0)

  return (
    <div className="w-[260px] sm:w-[300px] md:w-80 flex-none flex flex-col h-full">
      <div className="flex flex-col gap-1 px-1 mb-4 select-none">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-500/80">
            Perdido
          </h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-900/30 px-1.5 text-[10px] font-medium text-red-400">
            {deals.length}
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden mt-2">
          <div className="h-full bg-red-400 w-full" />
        </div>
        <div className="mt-1 text-xs font-mono text-zinc-500">
          Total: <span className="text-red-400/80">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <Droppable droppableId={LOST_COLUMN_ID} type="DEAL">
        {(provided: DroppableProvided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-2xl p-3 border shadow-sm transition-colors bg-red-50/50 border-red-100",
              "dark:bg-gradient-to-b dark:from-red-950/20 dark:to-red-950/5 dark:backdrop-blur-md dark:border-red-500/10 dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]",
              snapshot.isDraggingOver && "border-red-500/30 bg-red-500/10"
            )}
          >
            <div className="flex flex-col gap-3 min-h-[150px]">
              {deals.map((deal, index) => (
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
              {deals.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-500/10 p-4 text-center gap-3">
                  <span className="text-xs font-medium text-zinc-600">Nenhum negócio perdido</span>
                  <span className="text-[10px] text-zinc-700">Arraste um card para marcar como perdido</span>
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
  pipelineId,
  currentUserId,
  onOptimisticUpdate,
  onOptimisticDelete,
  onRollback,
  onSuccess
}: KanbanBoardProps) {
  const tCommon = useTranslations('common')
  const tComponents = useTranslations('components')
  const [stages, setStages] = useState(initialStages)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)

  // Lost Reason Modal
  const [pendingLostDealId, setPendingLostDealId] = useState<string | null>(null)
  const [lostReasonInput, setLostReasonInput] = useState('')

  // New Stage Dialog
  const [isNewStageOpen, setIsNewStageOpen] = useState(false)
  const [newStageName, setNewStageName] = useState("")

  // Delete Stage Confirmation
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isDraggingScroll = useRef(false)
  const dragStartX = useRef(0)
  const scrollStartX = useRef(0)

  // Grab-to-scroll horizontal
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const onMouseDown = (e: MouseEvent) => {
      // Only activate on middle-click or when clicking the container background (not cards)
      const target = e.target as HTMLElement
      if (target.closest('[data-rfd-draggable-id]') || target.closest('button') || target.closest('input')) return
      isDraggingScroll.current = true
      dragStartX.current = e.clientX
      scrollStartX.current = el.scrollLeft
      el.style.cursor = 'grabbing'
      el.style.userSelect = 'none'
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingScroll.current) return
      const dx = e.clientX - dragStartX.current
      el.scrollLeft = scrollStartX.current - dx
    }

    const onMouseUp = () => {
      if (!isDraggingScroll.current) return
      isDraggingScroll.current = false
      el.style.cursor = ''
      el.style.userSelect = ''
    }

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  useEffect(() => {
    setStages(initialStages.sort((a, b) => a.order - b.order))
  }, [initialStages])

  // Filter deals based on search, excluding LOST deals from regular columns
  const filteredStages = useMemo(() => {
    const activeStages = stages.map(stage => ({
      ...stage,
      deals: stage.deals.filter(d => d.status !== 'LOST'),
    }))

    const query = searchQuery.toLowerCase()
    const filtered = !searchQuery
      ? activeStages
      : activeStages.map(stage => ({
          ...stage,
          deals: stage.deals.filter(deal =>
            deal.title.toLowerCase().includes(query) ||
            deal.contact?.name?.toLowerCase().includes(query)
          ),
        }))

    // Sort: deals with dueDate ascending first, then deals without dueDate
    return filtered.map(stage => ({
      ...stage,
      deals: [...stage.deals].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }),
    }))
  }, [stages, searchQuery])

  // LOST deals for the fixed "Perdido" column
  const lostDeals = useMemo(() => {
    const allLost = stages.flatMap(s => s.deals.filter(d => d.status === 'LOST'))
    if (!searchQuery) return allLost
    const query = searchQuery.toLowerCase()
    return allLost.filter(d =>
      d.title.toLowerCase().includes(query) ||
      d.contact?.name?.toLowerCase().includes(query)
    )
  }, [stages, searchQuery])

  // Swipe-to-move: permite mover um deal para stage anterior/próximo com swipe em mobile.
  // Reusa a mesma lógica do drag-and-drop desktop (optimistic update + updateDealStage).
  const handleSwipeMove = async (dealId: string, direction: 'prev' | 'next') => {
    const orderedStages = [...stages].sort((a, b) => a.order - b.order)
    const currentStageIdx = orderedStages.findIndex(s => s.deals.some(d => d.id === dealId))
    if (currentStageIdx === -1) return

    const targetIdx = direction === 'prev' ? currentStageIdx - 1 : currentStageIdx + 1
    if (targetIdx < 0 || targetIdx >= orderedStages.length) return

    const targetStage = orderedStages[targetIdx]
    const deal = orderedStages[currentStageIdx].deals.find(d => d.id === dealId)
    if (!deal) return

    // Optimistic update
    setStages(prev => {
      const srcIdx = prev.findIndex(s => s.id === orderedStages[currentStageIdx].id)
      const dstIdx = prev.findIndex(s => s.id === targetStage.id)
      if (srcIdx === -1 || dstIdx === -1) return prev
      return prev.map((s, i) => {
        if (i === srcIdx) return { ...s, deals: s.deals.filter(d => d.id !== dealId) }
        if (i === dstIdx) return { ...s, deals: [{ ...deal, stageId: targetStage.id }, ...s.deals] }
        return s
      })
    })

    await updateDealStage(dealId, targetStage.id)
    onSuccess?.()
  }

  // Handlers for Stage CRUD
  const handleRenameStage = async (id: string, name: string) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, name } : s))
    await updateStage(id, name)
    onSuccess?.()
  }

  const handleDeleteStage = async (id: string) => {
    const result = await deleteStage(id)
    if (result.success) {
      setStages(prev => prev.filter(s => s.id !== id))
      onSuccess?.()
    } else {
      alert(result.error || "Erro ao excluir etapa")
    }
    setDeleteStageId(null)
  }

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStageName) return

    const result = await createStage(newStageName, pipelineId)
    if (result.success) {
      setIsNewStageOpen(false)
      setNewStageName("")
      onSuccess?.()
    } else {
      alert('Erro ao criar etapa')
    }
  }

  const handleLostReasonConfirm = async () => {
    if (!pendingLostDealId) return
    const reason = lostReasonInput.trim()
    const dealId = pendingLostDealId
    setPendingLostDealId(null)
    setLostReasonInput('')
    await updateDealStatus(dealId, 'LOST', reason || undefined)
  }

  const handleLostReasonCancel = () => {
    if (!pendingLostDealId) return
    const revertId = pendingLostDealId
    // Revert the optimistic update
    setStages((prev: Stage[]) => prev.map((s: Stage) => ({
      ...s,
      deals: s.deals.map((d: Deal) => d.id === revertId ? { ...d, status: 'ACTIVE' } : d),
    })))
    setPendingLostDealId(null)
    setLostReasonInput('')
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    const dealId = draggableId

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // --- Drag INTO Perdido: optimistic update + open reason modal ---
    if (destination.droppableId === LOST_COLUMN_ID) {
      setStages(prev => prev.map(s => ({
        ...s,
        deals: s.deals.map(d => d.id === dealId ? { ...d, status: 'LOST' } : d),
      })))
      setLostReasonInput('')
      setPendingLostDealId(dealId)
      return
    }

    // --- Drag OUT OF Perdido to a real stage: restore as ACTIVE ---
    if (source.droppableId === LOST_COLUMN_ID) {
      const destStageIdx = stages.findIndex(s => s.id === destination.droppableId)
      if (destStageIdx === -1) return

      setStages(prev => {
        const srcStageIdx = prev.findIndex(s => s.deals.some(d => d.id === dealId))
        if (srcStageIdx === -1) return prev

        const deal = prev[srcStageIdx].deals.find(d => d.id === dealId)!
        const updatedDeal = { ...deal, status: 'ACTIVE', stageId: destination.droppableId }

        return prev.map((s, i) => {
          if (i === srcStageIdx) {
            return { ...s, deals: s.deals.filter(d => d.id !== dealId) }
          }
          if (i === destStageIdx) {
            const activeDeals = s.deals.filter(d => d.status !== 'LOST')
            const lostDealsInStage = s.deals.filter(d => d.status === 'LOST')
            const newActive = [...activeDeals]
            newActive.splice(destination.index, 0, updatedDeal)
            return { ...s, deals: [...newActive, ...lostDealsInStage] }
          }
          return s
        })
      })

      await Promise.all([
        updateDealStatus(dealId, 'ACTIVE'),
        updateDealStage(dealId, destination.droppableId),
      ])
      return
    }

    // --- Normal stage-to-stage drag ---
    // filteredStages matches exactly what DnD rendered — use it for index resolution
    const filteredSourceStage = filteredStages.find(s => s.id === source.droppableId)
    const filteredDestStage = filteredStages.find(s => s.id === destination.droppableId)

    if (!filteredSourceStage || !filteredDestStage) return

    const sourceDeal = filteredSourceStage.deals[source.index]
    if (!sourceDeal) return

    const sourceStageIndex = stages.findIndex(s => s.id === source.droppableId)
    const destStageIndex = stages.findIndex(s => s.id === destination.droppableId)

    if (sourceStageIndex === -1 || destStageIndex === -1) return

    const sourceStage = stages[sourceStageIndex]
    const destStage = stages[destStageIndex]

    const sourceLostDeals = sourceStage.deals.filter(d => d.status === 'LOST')

    if (source.droppableId === destination.droppableId) {
      const reorderedFiltered = reorder(filteredSourceStage.deals, source.index, destination.index)

      setStages(prev => {
        const newStages = [...prev]
        newStages[sourceStageIndex] = {
          ...sourceStage,
          deals: [...reorderedFiltered, ...sourceLostDeals],
        }
        return newStages
      })

      const reorderedDeals = reorderedFiltered.map((deal, index) => ({ id: deal.id, order: index }))
      await reorderDeals(sourceStage.id, reorderedDeals)
    } else {
      const destLostDeals = destStage.deals.filter(d => d.status === 'LOST')

      const newSourceFiltered = filteredSourceStage.deals.filter(d => d.id !== sourceDeal.id)
      const newDestFiltered = [...filteredDestStage.deals]
      const updatedDeal = { ...sourceDeal, stageId: destStage.id }
      newDestFiltered.splice(destination.index, 0, updatedDeal)

      setStages(prev => {
        const newStages = [...prev]
        newStages[sourceStageIndex] = {
          ...sourceStage,
          deals: [...newSourceFiltered, ...sourceLostDeals],
        }
        newStages[destStageIndex] = {
          ...destStage,
          deals: [...newDestFiltered, ...destLostDeals],
        }
        return newStages
      })

      await updateDealStage(sourceDeal.id, destStage.id)
      const reorderedDeals = newDestFiltered.map((deal, index) => ({ id: deal.id, order: index }))
      await reorderDeals(destStage.id, reorderedDeals)
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full gap-4">
        {/* Pipeline Header / Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filtrar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full sm:w-[200px] bg-white/5 border-white/10"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsNewStageOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {tCommon('buttons.add')}
          </Button>
        </div>

        <div
          ref={scrollContainerRef}
          data-tour="pipeline"
          className="flex h-full gap-3 sm:gap-6 pb-4 px-2 overflow-x-auto snap-x snap-mandatory sm:snap-none cursor-grab active:cursor-grabbing"
        >
          {filteredStages.map((stage, idx) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              onDealClick={(deal) => setEditingDeal(deal)}
              onRename={handleRenameStage}
              onDelete={(id) => setDeleteStageId(id)}
              onSwipeMoveDeal={handleSwipeMove}
              hasPrevStage={idx > 0}
              hasNextStage={idx < filteredStages.length - 1}
            />
          ))}
          <LostColumn
            deals={lostDeals}
            onDealClick={(deal) => setEditingDeal(deal)}
          />
          <div className="w-10 shrink-0" />
        </div>
      </div>

      <EditDealDialog
        deal={editingDeal}
        open={!!editingDeal}
        onOpenChange={(open) => !open && setEditingDeal(null)}
        stages={stages}
        contacts={contacts}
        currentUserId={currentUserId}
        onOptimisticUpdate={onOptimisticUpdate}
        onOptimisticDelete={onOptimisticDelete}
        onRollback={onRollback}
        onSuccess={onSuccess}
      />

      <Dialog open={isNewStageOpen} onOpenChange={setIsNewStageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon('buttons.add')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateStage} className="space-y-4">
            <Input
              placeholder="Nome da etapa (ex: Negociação)"
              value={newStageName}
              onChange={e => setNewStageName(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button type="submit">{tCommon('buttons.create')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteStageId}
        onOpenChange={(open) => !open && setDeleteStageId(null)}
        title={tCommon('buttons.delete')}
        description={tComponents('shared.dialogs.confirmDeleteDesc')}
        confirmLabel={tCommon('buttons.delete')}
        onConfirm={() => deleteStageId && handleDeleteStage(deleteStageId)}
      />

      {/* Lost Reason Modal */}
      <Dialog
        open={!!pendingLostDealId}
        onOpenChange={(open: boolean) => { if (!open) handleLostReasonCancel() }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Por que este negócio foi perdido?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="flex flex-wrap gap-2">
              {LOST_REASONS.map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setLostReasonInput(reason)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm border transition-all duration-200",
                    lostReasonInput === reason
                      ? "bg-destructive/10 text-destructive border-destructive/40 font-medium"
                      : "bg-muted/50 text-muted-foreground border-border/60 hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>

            <Input
              placeholder="Ou descreva outro motivo..."
              value={lostReasonInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLostReasonInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && lostReasonInput.trim() && handleLostReasonConfirm()}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={handleLostReasonCancel}>
              {tCommon('buttons.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleLostReasonConfirm}
              disabled={!lostReasonInput.trim()}
            >
              {tCommon('buttons.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DragDropContext>
  )
}
