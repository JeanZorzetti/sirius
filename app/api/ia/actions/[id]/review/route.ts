import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/ia/actions/[id]/review
 * Internal session-based route for the /IA feed to approve/reject agent actions.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { decision } = body

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'decision must be APPROVED or REJECTED' }, { status: 400 })
    }

    const action = await prisma.agentAction.findFirst({
      where: { id, organizationId: user.organizationId }
    })

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 })
    }

    if (action.status !== 'NEEDS_APPROVAL' && action.status !== 'PENDING') {
      return NextResponse.json({ error: `Action is already ${action.status}` }, { status: 409 })
    }

    const updated = await prisma.agentAction.update({
      where: { id },
      data: {
        status: decision === 'APPROVED' ? 'SUCCESS' : 'FAILED',
        reviewedBy: user.id,
        reviewedAt: new Date()
      }
    })

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      reviewedAt: updated.reviewedAt?.toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
