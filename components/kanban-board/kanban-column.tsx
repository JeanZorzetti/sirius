'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Draggable, Droppable, type DroppableProvided } from '@hello-pangea/dnd'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DealCard } from './deal-card'
import { LOST_COLUMN_ID, type ContactDisplayMode, type Deal, type Stage } from './types'

export function KanbanColumn({
  stage,
  onDealClick,
  onRename,
  onDelete,
  onSwipeMoveDeal,
  hasPrevStage,
  hasNextStage,
  contactDisplayMode,
}: {
  stage: Stage
  onDealClick?: (deal: Deal) => void
  onRename?: (id: string, name: string) => void
  onDelete?: (id: string) => void
  onSwipeMoveDeal?: (dealId: string, direction: 'prev' | 'next') => void
  hasPrevStage?: boolean
  hasNextStage?: boolean
  contactDisplayMode?: ContactDisplayMode
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
                      contactDisplayMode={contactDisplayMode}
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

export function LostColumn({
  deals,
  onDealClick,
  contactDisplayMode,
}: {
  deals: Deal[]
  onDealClick?: (deal: Deal) => void
  contactDisplayMode?: ContactDisplayMode
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
                      contactDisplayMode={contactDisplayMode}
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
