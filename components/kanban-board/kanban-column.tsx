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
import { dinheiroCompacto, resumirEtapa } from '@/lib/pipeline/hoje'
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
  const tCommon = useTranslations('common')
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(stage.name)

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRename?.(stage.id, newName)
    setIsEditing(false)
  }

  return (
    <div data-testid="kanban-column" className="flex h-full w-[260px] flex-none flex-col sm:w-[240px] lg:w-auto lg:min-w-[176px] lg:flex-1 lg:basis-0">
      {/* Column Header (spec 009): count, the filled values' sum and how many have one, how many ask for action */}
      <div className="mb-2 flex select-none flex-col px-1">
        <div className="flex items-center justify-between gap-2 group/header">
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
            <h3 className="truncate text-[13px] font-semibold text-foreground cursor-text" onDoubleClick={() => setIsEditing(true)}>
              {stage.name}
            </h3>
          )}

          <div className="flex items-center gap-1">
            <span className="text-xl font-extrabold leading-none tabular-nums">{stage.deals.length}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Opções da etapa ${stage.name}`} className="h-8 w-8 touch-target opacity-100 lg:h-6 lg:w-6 lg:opacity-0 lg:group-hover/header:opacity-100 focus-visible:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="w-3 h-3 mr-2" /> {tCommon('buttons.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(stage.id)} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-3 h-3 mr-2" /> {tCommon('buttons.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <ResumoDaEtapa deals={stage.deals} />
      </div>

      {/* Column Body - Droppable Area */}
      <Droppable droppableId={stage.id} type="DEAL">
        {(provided: DroppableProvided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-[var(--radius)] border border-border bg-muted p-1.5 transition-colors",
              stage.deals.length === 0 && "border-dashed bg-transparent",
              snapshot.isDraggingOver && "border-ring bg-muted"
            )}
          >
            <div className="flex flex-col gap-1.5 min-h-[150px]">
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
                <p className="hoje-mono px-2 py-4 text-center text-xs text-muted-foreground">Nenhum negócio nesta etapa</p>
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
  return (
    <div data-testid="kanban-column" className="flex h-full w-[260px] flex-none flex-col sm:w-[240px] lg:w-auto lg:min-w-[176px] lg:flex-1 lg:basis-0">
      <div className="mb-2 flex select-none flex-col px-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-muted-foreground">Perdido</h3>
          <span className="text-xl font-extrabold leading-none tabular-nums text-muted-foreground">{deals.length}</span>
        </div>
        <ResumoDaEtapa deals={deals} perdidos />
      </div>

      <Droppable droppableId={LOST_COLUMN_ID} type="DEAL">
        {(provided: DroppableProvided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-[var(--radius)] border border-dashed border-border p-1.5 transition-colors",
              snapshot.isDraggingOver && "border-ring bg-muted"
            )}
          >
            <div className="flex flex-col gap-1.5 min-h-[150px]">
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
                <p className="hoje-mono px-2 py-4 text-center text-xs text-muted-foreground">
                  Nenhum negócio perdido. Arraste um cartão para cá para marcar como perdido.
                </p>
              )}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  )
}

/** "R$ 16,8 mil / valor em 2 de 9 / 5 pedem ação" — never R$ 0,00 for values nobody filled (80.5% of real deals). */
function ResumoDaEtapa({ deals, perdidos = false }: { deals: Deal[]; perdidos?: boolean }) {
  const r = resumirEtapa(deals, new Date())
  return (
    <div className="hoje-mono mt-1 text-[11px] leading-snug text-muted-foreground tabular-nums">
      {/* an empty stage says so in its body (the drop area); the header keeps its height */}
      <p className={r.comValor ? 'font-medium text-foreground' : ''}>
        {r.n === 0 ? ' ' : r.comValor ? dinheiroCompacto(r.soma) : 'sem valor'}
      </p>
      <p>{r.comValor > 0 ? `valor em ${r.comValor} de ${r.n}` : ' '}</p>
      {!perdidos && (
        <p>{r.pedemAcao > 0 ? `${r.pedemAcao} ${r.pedemAcao === 1 ? 'pede' : 'pedem'} ação` : ' '}</p>
      )}
    </div>
  )
}
