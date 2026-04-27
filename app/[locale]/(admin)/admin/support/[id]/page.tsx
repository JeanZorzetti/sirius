import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TicketChat } from '@/components/support/ticket-chat'
import { TicketStatusBadge } from '@/components/support/ticket-status-badge'
import { TicketPriorityBadge } from '@/components/support/ticket-priority-badge'
import { ArrowLeft, Building2, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CATEGORY_LABELS: Record<string, string> = {
  BUG: 'Bug',
  QUESTION: 'Dúvida',
  FEATURE_REQUEST: 'Sugestão',
  BILLING: 'Financeiro',
  ONBOARDING: 'Onboarding',
  OTHER: 'Outro',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminTicketDetailPage({ params }: Props) {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')

  const staffUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, isRoiLabsStaff: true },
  })
  if (!staffUser?.isRoiLabsStaff) redirect('/dashboard')

  const { id } = await params

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
      assignedStaff: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true, tier: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true, email: true, isRoiLabsStaff: true } },
          attachments: true,
        },
      },
    },
  })

  if (!ticket) notFound()

  // Mark as read by staff
  if (ticket.unreadByStaff) {
    prisma.supportTicket.update({ where: { id }, data: { unreadByStaff: false } }).catch(() => {})
  }

  const slaHours = ticket.firstResponseAt
    ? Math.round(
        (new Date(ticket.firstResponseAt).getTime() - new Date(ticket.createdAt).getTime()) /
          (1000 * 60 * 60) * 10
      ) / 10
    : null

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-3rem)]">
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <Link href="/admin/support" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Tickets
          </Link>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold">{ticket.subject}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <TicketStatusBadge status={ticket.status} />
                <TicketPriorityBadge priority={ticket.priority} />
                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                  {CATEGORY_LABELS[ticket.category] || ticket.category}
                </span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              #{id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Chat */}
          <div className="flex-1 min-w-0 border border-border rounded-xl overflow-hidden bg-background">
            <TicketChat
              ticketId={ticket.id}
              initialMessages={ticket.messages as never}
              currentUserId={staffUser.id}
              isStaff={true}
              ticketStatus={ticket.status}
            />
          </div>

          {/* Sidebar info */}
          <div className="w-64 flex-shrink-0 space-y-4">
            {/* Organization */}
            <div className="border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Organização</span>
              </div>
              <p className="text-sm font-semibold">{ticket.organization.name}</p>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded mt-1 inline-block">
                {ticket.organization.tier}
              </span>
            </div>

            {/* Client */}
            <div className="border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Cliente</span>
              </div>
              <p className="text-sm font-semibold">{ticket.createdByUser.name || '—'}</p>
              <p className="text-xs text-muted-foreground">{ticket.createdByUser.email}</p>
            </div>

            {/* Dates / SLA */}
            <div className="border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Datas</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-muted-foreground">Aberto:</span>
                  <br />
                  <span>{format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
                {slaHours !== null && (
                  <div>
                    <span className="text-muted-foreground">1ª resposta:</span>
                    <br />
                    <span className={slaHours > 24 ? 'text-red-600' : 'text-green-600'}>
                      {slaHours}h
                    </span>
                  </div>
                )}
                {ticket.resolvedAt && (
                  <div>
                    <span className="text-muted-foreground">Resolvido:</span>
                    <br />
                    <span>{format(new Date(ticket.resolvedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned */}
            <div className="border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Responsável</span>
              </div>
              {ticket.assignedStaff ? (
                <div>
                  <p className="text-sm font-semibold">{ticket.assignedStaff.name || ticket.assignedStaff.email}</p>
                  <form action={async () => {
                    'use server'
                    await fetch(`/api/admin/support/tickets/${id}/assign`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ staffId: null }),
                    })
                  }}>
                    <button type="submit" className="text-xs text-muted-foreground hover:text-destructive mt-1">
                      Remover →
                    </button>
                  </form>
                </div>
              ) : (
                <form action={async () => {
                  'use server'
                  const session = await getSession()
                  if (!session?.user?.email) return
                  const me = await prisma.user.findUnique({
                    where: { email: session.user.email },
                    select: { id: true },
                  })
                  if (!me) return
                  await prisma.supportTicket.update({
                    where: { id },
                    data: { assignedStaffId: me.id },
                  })
                }}>
                  <button
                    type="submit"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Atribuir a mim →
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
