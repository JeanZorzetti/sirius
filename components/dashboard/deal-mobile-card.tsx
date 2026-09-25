'use client'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dinheiro, fatoDeTempo, pedeAcao, temValor, type NegocioComTempo } from '@/lib/pipeline/hoje'

interface DealMobileCardProps {
  deal: NegocioComTempo & {
    id: string
    title: string
    exemplo?: boolean
    contact?: { name: string; company?: string | null } | null
  }
  onClick?: (dealId: string) => void
  className?: string
}

export function DealMobileCard({ deal, onClick, className }: DealMobileCardProps) {
  // The same time fact as the board's card (spec 009)
  const agora = new Date()
  const fato = fatoDeTempo(deal, agora)
  const acao = pedeAcao(deal, agora)
  const initials = deal.contact?.name
    ? deal.contact.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?'

  return (
    <button
      onClick={onClick ? () => onClick(deal.id) : undefined}
      className={cn('list-item-card w-full text-left', acao && 'shadow-[inset_2px_0_0_var(--hoje-acento,var(--ring))]', className)}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground" aria-hidden="true">
        <span className="text-xs font-semibold">{initials}</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium leading-tight">{deal.title}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-mobile-meta">
          <span className="truncate">{deal.contact ? (deal.contact.company ?? deal.contact.name) : 'sem contato'}</span>
          <span aria-hidden="true">·</span>
          <span className={cn('hoje-mono shrink-0 tabular-nums', temValor(deal) && 'font-medium text-foreground')}>
            {temValor(deal) ? dinheiro(deal.value as number) : 'sem valor'}
          </span>
        </p>
        <p className={cn('hoje-mono mt-0.5 flex items-center gap-1.5 text-[11.5px] tabular-nums', acao ? 'font-medium text-foreground' : 'text-muted-foreground')}>
          {fato.frase}
          {deal.exemplo && <span className="rounded-sm border border-border px-1 font-normal text-muted-foreground">exemplo</span>}
        </p>
      </div>

      <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
    </button>
  )
}
