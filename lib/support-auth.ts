import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type SupportUserContext = {
  userId: string
  email: string
  organizationId: string
  isRoiLabsStaff: boolean
}

/** Returns authenticated user context or 401/404 Response. */
export async function getSupportUser(): Promise<SupportUserContext | NextResponse> {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, organizationId: true, isRoiLabsStaff: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return {
    userId: user.id,
    email: user.email,
    organizationId: user.organizationId,
    isRoiLabsStaff: user.isRoiLabsStaff,
  }
}

/** Ensures user is ROI Labs staff. Returns 403 if not. */
export async function requireStaff(): Promise<SupportUserContext | NextResponse> {
  const ctx = await getSupportUser()
  if (ctx instanceof NextResponse) return ctx

  if (!ctx.isRoiLabsStaff) {
    return NextResponse.json({ error: 'Forbidden: staff only' }, { status: 403 })
  }

  return ctx
}

/**
 * Checks if a user can access a ticket:
 * - Staff can access all tickets
 * - Clients can only access tickets from their own organization
 */
export function canAccessTicket(
  ctx: SupportUserContext,
  ticketOrganizationId: string
): boolean {
  if (ctx.isRoiLabsStaff) return true
  return ctx.organizationId === ticketOrganizationId
}
