import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { executeAgentAction } from '@/lib/agaas-executor'
import logger from '@/lib/logger'

/**
 * PATCH /api/ia/actions/[id]/review
 * Internal session-based route for the /IA feed to approve/reject agent actions.
 * When APPROVED, executes the agent action (LLM call + CRM operation).
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

    if (decision === 'REJECTED') {
      const updated = await prisma.agentAction.update({
        where: { id },
        data: {
          status: 'FAILED',
          reviewedBy: user.id,
          reviewedAt: new Date(),
        },
      })
      return NextResponse.json({
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        reviewedAt: updated.reviewedAt?.toISOString(),
      })
    }

    // APPROVED — mark as executing, then run the agent
    await prisma.agentAction.update({
      where: { id },
      data: { status: 'PENDING', reviewedBy: user.id, reviewedAt: new Date() },
    })

    try {
      const result = await executeAgentAction({
        id: action.id,
        organizationId: action.organizationId,
        agentName: action.agentName,
        actionType: action.actionType,
        entityType: action.entityType,
        entityId: action.entityId,
        reasoning: action.reasoning,
        confidence: action.confidence,
        input: action.input,
        userId: user.id,
      })

      const updated = await prisma.agentAction.update({
        where: { id },
        data: {
          status: result.success ? 'SUCCESS' : 'FAILED',
          output: result.output,
        },
      })

      logger.info({ actionId: id, agentName: action.agentName, success: result.success }, '[AgaaS:Review] Action executed')

      return NextResponse.json({
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        reviewedAt: updated.reviewedAt?.toISOString(),
      })
    } catch (execError: any) {
      // Execution failed — mark as FAILED with error details
      const updated = await prisma.agentAction.update({
        where: { id },
        data: {
          status: 'FAILED',
          output: { error: execError.message },
        },
      })

      logger.error({ actionId: id, error: execError.message }, '[AgaaS:Review] Action execution failed')

      return NextResponse.json({
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        reviewedAt: updated.reviewedAt?.toISOString(),
      })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
