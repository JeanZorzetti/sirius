/**
 * API Route: /api/entitlements
 *
 * Retorna os entitlements completos da organização atual.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrganizationEntitlements } from '@/lib/feature-gates'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entitlements = await getOrganizationEntitlements(
      session.user.organizationId
    )

    return NextResponse.json(entitlements)
  } catch (error) {
    console.error('Error fetching entitlements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
