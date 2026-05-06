import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getRoleFeatures, type RoleFeatures } from '@/lib/role-permissions'
import type { OrgRole } from '@prisma/client'

export type DashboardUser = {
  id: string
  name: string | null
  email: string
  role: string
  orgRole: OrgRole
  organizationId: string
  organization: {
    tier: string
    trialEndsAt: string | null  // ISO string — safe to serialize via cache
    trialStatus: string | null
  }
  features: RoleFeatures
}

const getDashboardUserUncached = async (email: string): Promise<DashboardUser | null> => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      orgRole: true,
      organizationId: true,
      organization: {
        select: { tier: true, trialEndsAt: true, trialStatus: true }
      }
    }
  })

  if (!user) return null

  const features = await getRoleFeatures(user.organizationId, user.orgRole)

  return {
    ...user,
    organization: {
      ...user.organization,
      trialEndsAt: user.organization.trialEndsAt?.toISOString() ?? null,
    },
    features,
  }
}

// Cached for 5 minutes per user email.
// Call revalidateDashboardUser(email) on any org tier, trial, or role permissions change.
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

// Call this whenever org.tier, trialEndsAt, trialStatus, role, or RolePermissions change
export async function revalidateDashboardUser(email: string) {
  const { updateTag } = await import('next/cache')
  updateTag(`user:${email}`)
  updateTag(`org-trial:${email}`)
}
