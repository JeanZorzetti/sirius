import { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AgendaClient } from '@/components/agenda/agenda-client'

export const metadata: Metadata = { title: 'Agenda - CRM' }
export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const session = await getSession()
  if (!session?.user?.email) return <div>Não autorizado.</div>

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true, orgRole: true },
  })
  if (!user?.organizationId) return <div>Usuário sem organização.</div>

  const whereBase = {
    organizationId: user.organizationId,
    archived: false,
    status: 'ACTIVE' as const,
    dueDate: { not: null },
    ...(user.orgRole === 'MEMBER' ? { userId: user.id } : {}),
  }

  const [deals, stages, contacts] = await Promise.all([
    prisma.deal.findMany({
      where: whereBase,
      select: {
        id: true,
        title: true,
        value: true,
        dueDate: true,
        stageId: true,
        contactId: true,
        stage: { select: { id: true, name: true } },
        pipeline: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.pipelineStage.findMany({
      where: { pipeline: { organizationId: user.organizationId } },
      select: { id: true, name: true },
    }),
    prisma.contact.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    }),
  ])

  // Serialize Decimals
  const serializedDeals = deals.map(d => ({
    ...d,
    value: d.value ? Number(d.value) : null,
    dueDate: d.dueDate!.toISOString(),
  }))

  return (
    <AgendaClient
      deals={serializedDeals}
      stages={stages}
      contacts={contacts}
    />
  )
}
