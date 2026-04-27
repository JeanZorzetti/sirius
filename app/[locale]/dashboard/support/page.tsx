import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TicketCard } from '@/components/support/ticket-card'
import { NewTicketDialog } from '@/components/support/new-ticket-dialog'
import { TicketStatus } from '@prisma/client'
import { LifeBuoy, MessageSquare } from 'lucide-react'

interface SearchParams {
  status?: string
  priority?: string
  category?: string
  page?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function SupportPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true },
  })
  if (!user) redirect('/login')

  const { status, priority, category, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1'))
  const limit = 20
  const skip = (page - 1) * limit

  const where = {
    organizationId: user.organizationId,
    ...(status && { status: status as TicketStatus }),
    ...(priority && { priority: priority as never }),
    ...(category && { category: category as never }),
  }

  const [tickets, total, unreadCount] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ unreadByUser: 'desc' }, { lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.count({ where: { organizationId: user.organizationId, unreadByUser: true } }),
  ])

  const statuses: { value: string; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'OPEN', label: 'Aberto' },
    { value: 'IN_PROGRESS', label: 'Em andamento' },
    { value: 'WAITING_USER', label: 'Aguardando resposta' },
    { value: 'RESOLVED', label: 'Resolvido' },
    { value: 'CLOSED', label: 'Fechado' },
  ]

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
            <LifeBuoy className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Suporte</h1>
            <p className="text-sm text-muted-foreground">
              {total > 0 ? `${total} ticket${total !== 1 ? 's' : ''}` : 'Nenhum ticket ainda'}
              {unreadCount > 0 && ` · ${unreadCount} não lido${unreadCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <NewTicketDialog />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
        {statuses.map((s) => (
          <a
            key={s.value}
            href={s.value ? `?status=${s.value}` : '?'}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              (status || '') === s.value
                ? 'bg-indigo-600 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium text-muted-foreground mb-1">Nenhum ticket encontrado</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Abra um ticket para falar com nossa equipe de suporte.
          </p>
          <div className="flex flex-col items-center gap-3">
            <NewTicketDialog />
            <a
              href="https://wa.me/5562998015884?text=Olá! Preciso de ajuda com o Sirius CRM."
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              🟢 Urgente? Fale pelo WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket as never}
              href={`/dashboard/support/${ticket.id}`}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && (
            <a href={`?${new URLSearchParams({ ...(status && { status }), page: String(page - 1) })}`}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">
              Anterior
            </a>
          )}
          <span className="px-4 py-2 text-sm text-muted-foreground">
            {page} de {Math.ceil(total / limit)}
          </span>
          {page < Math.ceil(total / limit) && (
            <a href={`?${new URLSearchParams({ ...(status && { status }), page: String(page + 1) })}`}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">
              Próximo
            </a>
          )}
        </div>
      )}

      {/* WhatsApp CTA footer */}
      <div className="mt-8 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
        <p className="text-sm text-green-800 dark:text-green-300">
          <strong>Problema urgente?</strong> Além dos tickets, você pode nos chamar diretamente pelo WhatsApp para questões críticas.
        </p>
        <a
          href="https://wa.me/5562998015884?text=Olá! Tenho um problema urgente com o Sirius CRM."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-sm text-green-700 dark:text-green-400 font-medium hover:underline"
        >
          Abrir WhatsApp →
        </a>
      </div>
    </div>
  )
}
