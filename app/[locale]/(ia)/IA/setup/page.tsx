import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { IAOnboardingWizard } from '@/components/ia/ia-onboarding-wizard'

export default async function IASetupPage() {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      organizationId: true,
      organization: {
        select: { name: true, iaConfig: true },
      },
    },
  })
  if (!user) redirect('/login')

  const iaConfig = (user.organization.iaConfig || {}) as Record<string, unknown>

  // If already completed, skip wizard
  if (iaConfig.setupCompleted) {
    redirect('/IA')
  }

  const enabledAgents = (iaConfig.enabledAgents || {}) as Record<string, boolean>
  const threshold = typeof iaConfig.confidenceThreshold === 'number' ? iaConfig.confidenceThreshold : 75

  return (
    <IAOnboardingWizard
      orgName={user.organization.name}
      initialEnabledAgents={enabledAgents}
      initialThreshold={threshold}
    />
  )
}
