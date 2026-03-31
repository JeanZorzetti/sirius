import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { IAAnalytics } from '@/components/ia/ia-analytics'

export default async function IAAnalyticsPage() {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  if (!user) redirect('/login')

  // Aggregate stats
  const orgId = user.organizationId
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalActions,
    successActions,
    failedActions,
    pendingActions,
    actionsByAgent,
    actionsByDay
  ] = await Promise.all([
    prisma.agentAction.count({ where: { organizationId: orgId } }),
    prisma.agentAction.count({ where: { organizationId: orgId, status: 'SUCCESS' } }),
    prisma.agentAction.count({ where: { organizationId: orgId, status: 'FAILED' } }),
    prisma.agentAction.count({ where: { organizationId: orgId, status: { in: ['PENDING', 'NEEDS_APPROVAL'] } } }),
    prisma.agentAction.groupBy({
      by: ['agentName'],
      where: { organizationId: orgId },
      _count: { id: true },
      _avg: { confidence: true }
    }),
    prisma.agentAction.groupBy({
      by: ['createdAt'],
      where: { organizationId: orgId, createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true }
    })
  ])

  const approvalRate = totalActions > 0
    ? Math.round((successActions / (successActions + failedActions || 1)) * 100)
    : 0

  const agentStats = actionsByAgent.map(a => ({
    name: a.agentName,
    count: a._count.id,
    avgConfidence: Math.round((a._avg.confidence || 0) * 100)
  }))

  return (
    <IAAnalytics
      stats={{
        totalActions,
        successActions,
        failedActions,
        pendingActions,
        approvalRate,
        agentStats
      }}
    />
  )
}
