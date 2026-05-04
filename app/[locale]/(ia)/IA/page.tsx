import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { IAFeed } from '@/components/ia/ia-feed'

export default async function IAHomePage() {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  if (!user) redirect('/login')

  try {
    // Fetch recent agent actions
    const actions = await prisma.agentAction.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Summary stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayCount, pendingCount, successCount] = await Promise.all([
      prisma.agentAction.count({
        where: { organizationId: user.organizationId, createdAt: { gte: today } }
      }),
      prisma.agentAction.count({
        where: { organizationId: user.organizationId, status: { in: ['NEEDS_APPROVAL', 'PENDING'] } }
      }),
      prisma.agentAction.count({
        where: { organizationId: user.organizationId, status: 'SUCCESS', createdAt: { gte: today } }
      })
    ])

    const serializedActions = actions.map(a => ({
      id: a.id,
      agentName: a.agentName,
      actionType: a.actionType,
      entityType: a.entityType,
      entityId: a.entityId,
      reasoning: a.reasoning,
      confidence: a.confidence,
      status: a.status,
      input: a.input as Record<string, unknown> | null,
      output: a.output as Record<string, unknown> | null,
      createdAt: a.createdAt.toISOString(),
      reviewedAt: a.reviewedAt?.toISOString() || null,
      reviewedBy: a.reviewedBy || null
    }))

    // Count enabled agents from iaConfig
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { iaConfig: true },
    })
    const iaConfig = (org?.iaConfig || {}) as Record<string, unknown>
    const enabledAgents = (iaConfig.enabledAgents || {}) as Record<string, boolean>
    const enabledAgentCount = Object.values(enabledAgents).filter(Boolean).length

    return (
      <IAFeed
        actions={serializedActions}
        stats={{ today: todayCount, pending: pendingCount, success: successCount }}
        organizationId={user.organizationId}
        enabledAgentCount={enabledAgentCount}
      />
    )
  } catch (error) {
    console.error('[IA Page] Error loading data:', error)
    throw error
  }
}
