import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TicketCard } from '@/components/support/ticket-card'
import { LifeBuoy, Users, Clock, AlertTriangle } from 'lucide-react'
import { TicketStatus } from '@prisma/client'

interface SearchParams {
  status?: string
  priority?: string
  organizationId?: string
  unassigned?: string
  search?: string
  page?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function AdminSupportPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, isRoiLabsStaff: true },
  })
  if (!user?.isRoiLabsStaff) redirect('/dashboard')

  const { status, priority, organizationId, unassigned, search, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1'))
  const limit = 25
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    ...(status && { status: status as TicketStatus }),
    ...(priority && { priority }),
    ...(organizationId && { organizationId }),
    ...(unassigned === 'true' && { assignedStaffId: null }),
    ...(search && {
      OR: [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [tickets, total, stats] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ unreadByStaff: 'desc' }, { priority: 'desc' }, { lastMessageAt: 'desc' }],
      skip,
      take: limit,
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
    Promise.all([
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_USER'] } } }),
      prisma.supportTicket.count({ where: { assignedStaffId: null, status: { not: 'CLOSED' } } }),
      prisma.supportTicket.count({ where: { priority: 'URGENT', status: { not: 'CLOSED' } } }),
    ]),
  ])

  const [openCount, activeCount, unassignedCount, urgentCount] = stats

  const statuses = [
    { value: '', label: 'Todos' },
    { value: 'OPEN', label: 'Aberto' },
    { value: 'IN_PROGRESS', label: 'Em andamento' },
    { value: 'WAITING_USER', label: 'Aguardando usuário' },
    { value: 'RESOLVED', label: 'Resolvido' },
    { value: 'CLOSED', label: 'Fechado' },
  ]

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <LifeBuoy className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Tickets de Suporte</h1>
            <p className="text-sm text-muted-foreground">Gestão central de suporte ao cliente</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: LifeBuoy, label: 'Abertos', value: openCount, color: 'text-blue-600' },
            { icon: Users, label: 'Ativos', value: activeCount, color: 'text-indigo-600' },
            { icon: Clock, label: 'Sem responsável', value: unassignedCount, color: 'text-orange-600' },
            { icon: AlertTriangle, label: 'Urgentes', value: urgentCount, color: 'text-red-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <span className="text-2xl font-bold">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          <div className="flex gap-1 overflow-x-auto">
            {statuses.map((s) => {
              const params = new URLSearchParams({ ...(search && { search }), ...(s.value && { status: s.value }) })
              return (
                <a
                  key={s.value}
                  href={`?${params}`}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    (status || '') === s.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s.label}
                </a>
              )
            })}
          </div>

          <a
            href={unassigned === 'true' ? '?' : '?unassigned=true'}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              unassigned === 'true'
                ? 'bg-orange-500 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Sem responsável ({unassignedCount})
          </a>
        </div>

        {/* Ticket list */}
        {tickets.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <LifeBuoy className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum ticket encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket as never}
                isStaff
                href={`/admin/support/${ticket.id}`}
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
      </div>
    </div>
  )
}
