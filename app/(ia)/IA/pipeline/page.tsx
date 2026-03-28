import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { IAPipeline } from '@/components/ia/ia-pipeline'

export default async function IAPipelinePage() {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  if (!user) redirect('/login')

  // Fetch pipelines with stages and deals
  const pipelines = await prisma.pipeline.findMany({
    where: { organizationId: user.organizationId },
    include: {
      stages: {
        orderBy: { order: 'asc' },
        include: {
          deals: {
            where: { archived: false, status: 'ACTIVE' },
            include: {
              contact: { select: { id: true, name: true, company: true } },
              user: { select: { id: true, name: true } }
            },
            orderBy: { order: 'asc' }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  // Fetch recent agent actions for these deals
  const dealIds = pipelines.flatMap(p =>
    p.stages.flatMap(s => s.deals.map(d => d.id))
  )

  const agentActions = await prisma.agentAction.findMany({
    where: {
      organizationId: user.organizationId,
      entityType: 'Deal',
      entityId: { in: dealIds }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Map of dealId -> latest action
  const actionsByDeal: Record<string, typeof agentActions[0]> = {}
  for (const action of agentActions) {
    if (!actionsByDeal[action.entityId]) {
      actionsByDeal[action.entityId] = action
    }
  }

  const serializedPipelines = pipelines.map(p => ({
    id: p.id,
    name: p.name,
    stages: p.stages.map(s => ({
      id: s.id,
      name: s.name,
      order: s.order,
      deals: s.deals.map(d => ({
        id: d.id,
        title: d.title,
        value: d.value ? Number(d.value) : null,
        contact: d.contact,
        user: d.user,
        createdAt: d.createdAt.toISOString(),
        agentAction: actionsByDeal[d.id] ? {
          agentName: actionsByDeal[d.id].agentName,
          actionType: actionsByDeal[d.id].actionType,
          confidence: actionsByDeal[d.id].confidence,
          status: actionsByDeal[d.id].status,
          reasoning: actionsByDeal[d.id].reasoning,
          createdAt: actionsByDeal[d.id].createdAt.toISOString()
        } : null
      }))
    }))
  }))

  return <IAPipeline pipelines={serializedPipelines} />
}
