import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CompleteProfileForm } from './complete-profile-form'

export const metadata: Metadata = {
  title: 'Complete seu cadastro - Sirius CRM',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function CompleteProfilePage() {
  const session = await getSession()

  if (!session?.user?.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      phone: true,
      jobTitle: true,
      organizationId: true,
      organization: {
        select: {
          name: true,
          description: true,
          segment: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/login')
  }

  // If profile is already complete, go to dashboard
  const orgHasRealName = user.organization.name !== user.name && user.organization.name !== user.name?.split('@')[0]
  if (user.phone && user.jobTitle && user.organization.segment && orgHasRealName) {
    redirect('/dashboard')
  }

  return (
    <CompleteProfileForm
      userId={user.id}
      userName={user.name || ''}
      organizationId={user.organizationId}
      currentOrgName={user.organization.name}
    />
  )
}
