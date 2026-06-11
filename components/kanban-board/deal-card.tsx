'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createPortal } from 'react-dom'
import type { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { ChevronLeft, ChevronRight, GripVertical, MessageCircle, Trophy } from 'lucide-react'
import { isToday, isTomorrow, isThisWeek, isPast } from 'date-fns'
import { Button } from '@/components/ui/button'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import { cn } from '@/lib/utils'
import { markDealWon } from '@/app/[locale]/dashboard/actions'
import type { ContactDisplayMode, Deal } from './types'

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

export function DealCard({
  deal,
  provided,
  snapshot,
  onClick,
  onSwipePrev,
  onSwipeNext,
  canSwipePrev,
  canSwipeNext,
  contactDisplayMode,
}: {
  deal: Deal
  provided: DraggableProvided
  snapshot: DraggableStateSnapshot
  onClick?: () => void
  onSwipePrev?: () => void
  onSwipeNext?: () => void
  canSwipePrev?: boolean
  canSwipeNext?: boolean
  contactDisplayMode?: ContactDisplayMode
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
      // provided.innerRef is @hello-pangea/dnd's callback ref render-prop API,
      // not a ref object read — the react-hooks/refs rule misfires here
      // eslint-disable-next-line react-hooks/refs
      ref={provided.innerRef}
      // eslint-disable-next-line react-hooks/refs
      {...provided.draggableProps}
      // eslint-disable-next-line react-hooks/refs
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
              {contactDisplayMode === 'company'
                ? (deal.contact.company || deal.contact.name)
                : deal.contact.name}
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
