import { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InstagramDashboard } from '@/components/instagram/instagram-dashboard'

export const metadata: Metadata = { title: 'Instagram Bot - Sirius CRM' }
export const dynamic = 'force-dynamic'

export default async function InstagramPage() {
  const session = await getSession()
  if (!session?.user) return <div>Não autorizado.</div>

  const organizationId = session.user.organizationId
  const raw = await prisma.instagramPost.findMany({
    where: { organizationId },
    orderBy: { scheduledFor: 'desc' },
    take: 100,
    include: {
      _count: { select: { comments: true } },
    },
  })

  const posts = raw.map(p => ({
    ...p,
    scheduledFor: p.scheduledFor.toISOString(),
    postedAt: p.postedAt?.toISOString() ?? null,
    approvedAt: p.approvedAt?.toISOString() ?? null,
    recurrenceEndDate: p.recurrenceEndDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return <InstagramDashboard initialPosts={posts} />
}
