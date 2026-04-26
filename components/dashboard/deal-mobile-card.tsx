'use client'
import { ChevronRight, Calendar, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DealContact {
  name: string
  company?: string | null
}

interface Deal {
  id: string
  title: string
  value?: number | null
  closeDate?: string | null
  dueDate?: string | null
  contact?: DealContact | null
}

interface DealMobileCardProps {
  deal: Deal
  onClick: (dealId: string) => void
  className?: string
}

function formatValue(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
  return `R$ ${v.toLocaleString('pt-BR')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return `${Math.abs(diffDays)}d atrás`
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Amanhã'
  return `${diffDays}d`
}

export function DealMobileCard({ deal, onClick, className }: DealMobileCardProps) {
  const dateLabel = deal.closeDate
    ? formatDate(deal.closeDate)
    : deal.dueDate
    ? formatDate(deal.dueDate)
    : null

  const initials = deal.contact?.name
    ? deal.contact.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?'

  return (
    <button
      onClick={() => onClick(deal.id)}
      className={cn(
        'list-item-card w-full text-left',
        className,
      )}
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
        <span className="text-xs font-semibold">{initials}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium leading-tight">{deal.title}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-mobile-meta">
          {deal.contact && (
            <span className="truncate max-w-[120px]">{deal.contact.company ?? deal.contact.name}</span>
          )}
          {dateLabel && (
            <>
              {deal.contact && <span className="text-muted-foreground/40">·</span>}
              <span className="flex items-center gap-0.5 shrink-0">
                <Calendar className="h-3 w-3" />
                {dateLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Value + chevron */}
      <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
        {deal.value != null && deal.value > 0 && (
          <span className="text-[13px] font-semibold text-foreground/80">
            {formatValue(deal.value)}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
      </div>
    </button>
  )
}
