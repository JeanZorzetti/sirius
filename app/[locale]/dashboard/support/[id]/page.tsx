import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TicketChat } from '@/components/support/ticket-chat'
import { TicketStatusBadge } from '@/components/support/ticket-status-badge'
import { TicketPriorityBadge } from '@/components/support/ticket-priority-badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle } from 'lucide-react'
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

export default async function TicketDetailPage({ params }: Props) {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true, isRoiLabsStaff: true },
  })
  if (!user) redirect('/login')

  const { id } = await params

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
      assignedStaff: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true, email: true, isRoiLabsStaff: true } },
          attachments: true,
        },
      },
    },
  })

  if (!ticket) notFound()

  if (!user.isRoiLabsStaff && ticket.organizationId !== user.organizationId) {
    redirect('/dashboard/support')
  }

  // Mark as read
  if (ticket.unreadByUser) {
    prisma.supportTicket.update({ where: { id }, data: { unreadByUser: false } }).catch(() => {})
  }

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <Link href="/dashboard/support" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Suporte
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
              <span className="text-xs text-muted-foreground">
                Aberto em {format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>

          {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
            <form action={async () => {
              'use server'
              const session = await getSession()
              if (!session?.user?.email) return
              await prisma.supportTicket.update({
                where: { id },
                data: { status: 'CLOSED', closedAt: new Date() },
              })
              redirect('/dashboard/support')
            }}>
              <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50">
                <CheckCircle className="h-3.5 w-3.5" />
                Marcar resolvido
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0 border border-border rounded-xl overflow-hidden bg-background">
        <TicketChat
          ticketId={ticket.id}
          initialMessages={ticket.messages as never}
          currentUserId={user.id}
          isStaff={user.isRoiLabsStaff}
          ticketStatus={ticket.status}
        />
      </div>
    </div>
  )
}
