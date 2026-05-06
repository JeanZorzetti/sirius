import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export type DashboardUser = {
  id: string
  name: string | null
  email: string
  role: string
  organizationId: string
  organization: {
    tier: string
    trialEndsAt: string | null  // ISO string — safe to serialize via cache
    trialStatus: string | null
  }
}

const getDashboardUserUncached = async (email: string): Promise<DashboardUser | null> => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      organization: {
        select: { tier: true, trialEndsAt: true, trialStatus: true }
      }
    }
  })

  if (!user) return null

  return {
    ...user,
    organization: {
      ...user.organization,
      trialEndsAt: user.organization.trialEndsAt?.toISOString() ?? null,
    }
  }
}

// Cached for 5 minutes per user email.
// Call revalidateDashboardUser(email) on any org tier or trial change.
export function getDashboardUser(email: string) {
  return unstable_cache(
    () => getDashboardUserUncached(email),
    ['dashboard-user', email],
    {
      tags: [`user:${email}`, `org-trial:${email}`],
      revalidate: 300,
    }
  )()
}

// Call this whenever org.tier, trialEndsAt, or trialStatus changes for a user
export async function revalidateDashboardUser(email: string) {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(`user:${email}`)
  revalidateTag(`org-trial:${email}`)
}
