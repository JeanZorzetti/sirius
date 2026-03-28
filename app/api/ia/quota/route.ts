import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAgaasQuota } from '@/lib/agaas-quota'

/**
 * GET /api/ia/quota
 * Returns the current AgaaS quota status for the user's organization.
 * Used by /IA UI components to show usage badges and gate features.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const quota = await checkAgaasQuota(user.organizationId)

    return NextResponse.json(quota)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
