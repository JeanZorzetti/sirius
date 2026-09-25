'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createPortal } from 'react-dom'
import type { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { ChevronLeft, ChevronRight, MessageCircle, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import { cn } from '@/lib/utils'
import { markDealWon } from '@/app/[locale]/dashboard/actions'
import { dinheiro, fatoDeTempo, pedeAcao, temValor } from '@/lib/pipeline/hoje'
import type { ContactDisplayMode, Deal } from './types'

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

  // The one time fact, in words (spec 009): the old colour-only due-date borders reached 9.5% of real deals
  const agora = new Date()
  const fato = fatoDeTempo(deal, agora)
  const acao = pedeAcao(deal, agora)
  const contato = deal.contact
    ? contactDisplayMode === 'company'
      ? deal.contact.company || deal.contact.name
      : deal.contact.name
    : 'sem contato'

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
      data-tour={fato.tipo === 'retorno' ? "overdue-task" : "deal-card"}
      data-testid="deal-card"
      data-deal-id={deal.id}
      className={cn(
        "group relative rounded-[var(--radius)] border border-border bg-card px-3 py-2.5 select-none transition-colors",
        "hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        // "pede ação" carries a shape (the left bar) besides the words; never colour alone
        acao && "shadow-[inset_2px_0_0_var(--hoje-acento,var(--ring))]",
        fato.tipo === 'ganho' && "shadow-[inset_3px_0_0_var(--hoje-acento,var(--ring))]",
        snapshot.isDragging && "z-[9999] shadow-lg ring-1 ring-ring",
      )}
    >
      {/* priority when the column is narrow: title, the time fact (the screen's question), then contact and value */}
      <p className="truncate pr-7 text-[13px] font-semibold leading-snug text-foreground group-hover:pr-14 group-focus-within:pr-14" title={deal.title}>
        {deal.title}
      </p>
      <p className={cn('hoje-mono mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px] tabular-nums', acao ? 'font-medium text-foreground' : 'text-muted-foreground')}>
        {fato.frase}
        {deal.exemplo && (
          <span className="rounded-sm border border-border px-1 font-normal text-muted-foreground">exemplo</span>
        )}
      </p>
      <p className="mt-0.5 flex justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{contato}</span>
        <span className={cn('hoje-mono shrink-0 text-[11px] tabular-nums', temValor(deal) && 'font-medium text-foreground')}>
          {temValor(deal) ? dinheiro(deal.value as number) : 'sem valor'}
        </span>
      </p>

      <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5">
        {fato.tipo !== 'ganho' && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 touch-target text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            onClick={handleMarkWon}
            disabled={markingWon}
            title="Registrar venda (Ganho)"
            aria-label="Registrar venda (Ganho)"
          >
            <Trophy className="h-3.5 w-3.5" />
          </Button>
        )}
        {deal.contact?.phone && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 touch-target text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={handleWhatsApp}
            title={`Conversar com ${deal.contact.name}`}
            aria-label={`Conversar com ${deal.contact.name}`}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
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
              background: 'bg-muted-foreground',
              onAction: onSwipePrev,
            }
          : undefined
      }
      rightAction={
        canSwipeNext && onSwipeNext
          ? {
              icon: <ChevronRight className="h-5 w-5" />,
              label: tCommon('buttons.next'),
              background: 'bg-foreground',
              onAction: onSwipeNext,
            }
          : undefined
      }
    >
      {cardContent}
    </SwipeableRow>
  )
}
