import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { uuidSchema } from '@/lib/api-validators'
import { executeAgentAction } from '@/lib/agaas-executor'
import logger from '@/lib/logger'

/**
 * PATCH /api/v1/agents/actions/[id]/review
 * Approve or reject a pending agent action.
 * Used by the /IA interface for human-in-the-loop supervision.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(request, async (req, context) => {
    const paramsData = await params
    try {
      const idValidation = uuidSchema.safeParse(paramsData.id)
      if (!idValidation.success) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'Invalid action ID format'
          }),
          { status: 400 }
        )
      }

      const body = await req.json()
      const { decision, reviewedBy } = body

      if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'decision is required and must be "APPROVED" or "REJECTED"'
          }),
          { status: 400 }
        )
      }

      // Find the action
      const action = await prisma.agentAction.findFirst({
        where: {
          id: paramsData.id,
          organizationId: context.organizationId
        }
      })

      if (!action) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'NOT_FOUND',
            message: 'Agent action not found'
          }),
          { status: 404 }
        )
      }

      if (action.status !== 'NEEDS_APPROVAL' && action.status !== 'PENDING') {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'CONFLICT',
            message: `Action is already ${action.status}. Only PENDING or NEEDS_APPROVAL actions can be reviewed.`
          }),
          { status: 409 }
        )
      }

      if (decision === 'REJECTED') {
        const updated = await prisma.agentAction.update({
          where: { id: paramsData.id },
          data: { status: 'FAILED', reviewedBy: reviewedBy || null, reviewedAt: new Date() },
        })
        return NextResponse.json(
          apiResponse(context.requestId, {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            reviewedAt: updated.reviewedAt?.toISOString() || null,
          })
        )
      }

      // APPROVED — execute the agent action
      await prisma.agentAction.update({
        where: { id: paramsData.id },
        data: { status: 'PENDING', reviewedBy: reviewedBy || null, reviewedAt: new Date() },
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
          userId: reviewedBy || '',
        })

        const updated = await prisma.agentAction.update({
          where: { id: paramsData.id },
          data: { status: result.success ? 'SUCCESS' : 'FAILED', output: result.output },
        })

        logger.info({ actionId: updated.id, decision, success: result.success }, 'Agent action executed via API')

        return NextResponse.json(
          apiResponse(context.requestId, {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            reviewedAt: updated.reviewedAt?.toISOString() || null,
          })
        )
      } catch (execError: any) {
        const updated = await prisma.agentAction.update({
          where: { id: paramsData.id },
          data: { status: 'FAILED', output: { error: execError.message } },
        })

        return NextResponse.json(
          apiResponse(context.requestId, {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            reviewedAt: updated.reviewedAt?.toISOString() || null,
          })
        )
      }
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error reviewing agent action via API')

      return NextResponse.json(
        apiResponse(context.requestId, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to review agent action'
        }),
        { status: 500 }
      )
    }
  })
}
