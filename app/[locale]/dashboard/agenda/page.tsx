import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AgendaClient } from '@/components/agenda/agenda-client'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'Agenda - CRM' }
export const dynamic = 'force-dynamic'

export default async function AgendaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })
  const session = await getSession()
  if (!session?.user?.email) return <div>{t('errors.unauthorized')}</div>

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true, orgRole: true },
  })
  if (!user?.organizationId) return <div>{t('errors.userNoOrg')}</div>

  const isMember = user.orgRole === 'MEMBER'

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { googleCalendarEnabled: true, googleCalendarEmail: true },
  })

  const [deals, stages, contacts, tasks] = await Promise.all([
    prisma.deal.findMany({
      where: {
        organizationId: user.organizationId,
        archived: false,
        status: 'ACTIVE' as const,
        dueDate: { not: null },
        ...(isMember ? { userId: user.id } : {}),
      },
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
    prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        archived: false,
        completedAt: null,
        dueDate: { not: null },
        ...(isMember ? { assigneeId: user.id } : {}),
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: { select: { id: true, name: true, color: true } },
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    }),
  ])

  const serializedDeals = deals.map(d => ({
    ...d,
    value: d.value ? Number(d.value) : null,
    dueDate: d.dueDate!.toISOString(),
  }))

  const serializedTasks = tasks.map(t => ({
    ...t,
    dueDate: t.dueDate!.toISOString(),
  }))

  return (
    <AgendaClient
      deals={serializedDeals}
      stages={stages}
      contacts={contacts}
      tasks={serializedTasks}
      googleCalendarEnabled={org?.googleCalendarEnabled ?? false}
      googleCalendarEmail={org?.googleCalendarEmail ?? null}
    />
  )
}
