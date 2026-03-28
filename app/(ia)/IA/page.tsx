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
    ...a,
    input: a.input as any,
    output: a.output as any,
    createdAt: a.createdAt.toISOString(),
    reviewedAt: a.reviewedAt?.toISOString() || null
  }))

  return (
    <IAFeed
      actions={serializedActions}
      stats={{ today: todayCount, pending: pendingCount, success: successCount }}
      organizationId={user.organizationId}
    />
  )
}
