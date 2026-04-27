import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle, Circle } from 'lucide-react'
import { TicketStatusBadge } from './ticket-status-badge'
import { TicketPriorityBadge } from './ticket-priority-badge'
import type { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client'

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  BUG: 'Bug',
  QUESTION: 'Dúvida',
  FEATURE_REQUEST: 'Sugestão',
  BILLING: 'Financeiro',
  ONBOARDING: 'Onboarding',
  OTHER: 'Outro',
}

interface TicketCardProps {
  ticket: {
    id: string
    subject: string
    status: TicketStatus
    priority: TicketPriority
    category: TicketCategory
    createdAt: Date | string
    lastMessageAt: Date | string | null
    unreadByUser: boolean
    unreadByStaff: boolean
    createdByUser?: { name?: string | null; email: string }
    organization?: { name: string }
    _count?: { messages: number }
  }
  isStaff?: boolean
  href: string
}

export function TicketCard({ ticket, isStaff, href }: TicketCardProps) {
  const isUnread = isStaff ? ticket.unreadByStaff : ticket.unreadByUser
  const timeAgo = ticket.lastMessageAt
    ? formatDistanceToNow(new Date(ticket.lastMessageAt), { addSuffix: true, locale: ptBR })
    : formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: ptBR })

  return (
    <Link
      href={href}
      className="block p-4 rounded-xl border border-border/60 bg-card hover:bg-accent/30 transition-colors group"
    >
      <div className="flex items-start gap-3">
        {isUnread && (
          <Circle className="h-2 w-2 mt-1.5 flex-shrink-0 fill-indigo-500 text-indigo-500" />
        )}
        {!isUnread && <div className="w-2 flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-sm font-medium truncate ${isUnread ? 'text-foreground font-semibold' : 'text-foreground/80'}`}>
              {ticket.subject}
            </span>
          </div>

          {isStaff && ticket.organization && (
            <p className="text-xs text-muted-foreground mb-1">{ticket.organization.name}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap mt-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {CATEGORY_LABELS[ticket.category]}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {ticket._count && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageCircle className="h-3 w-3" />
              <span>{ticket._count.messages}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
