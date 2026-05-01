import { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InstagramDashboard } from '@/components/instagram/instagram-dashboard'

export const metadata: Metadata = { title: 'Instagram Bot - Sirius CRM' }
export const dynamic = 'force-dynamic'

export default async function InstagramPage() {
  const session = await getSession()
  if (!session?.user) return <div>Não autorizado.</div>

  const posts = await prisma.instagramPost.findMany({
    orderBy: { scheduledFor: 'desc' },
    take: 50,
  })

  return <InstagramDashboard initialPosts={posts} />
}
