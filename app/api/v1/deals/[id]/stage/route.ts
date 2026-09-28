import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { formatDecimal, formatDate } from '@/lib/api-helpers'
import { uuidSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'
import { moverNegocio } from '@/lib/pipeline/mover-negocio'
import { dispatchWebhookAsync, WEBHOOK_EVENTS } from '@/lib/webhooks'

/**
 * PATCH /api/v1/deals/[id]/stage
 * Move deal to a different stage. Tracks whether moved by agent or human.
 * Used by Sofia IA agents for autonomous pipeline management.
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
            message: 'Invalid deal ID format'
          }),
          { status: 400 }
        )
      }

      const body = await req.json()
      const { stageId, movedBy = 'human' } = body

      if (!stageId) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'stageId is required'
          }),
          { status: 400 }
        )
      }

      const stageValidation = uuidSchema.safeParse(stageId)
      if (!stageValidation.success) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'Invalid stageId format'
          }),
          { status: 400 }
        )
      }

      // Verify deal exists
      const existingDeal = await prisma.deal.findFirst({
        where: { id: paramsData.id, organizationId: context.organizationId },
        include: { stage: { select: { id: true, name: true } } }
      })

      if (!existingDeal) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'NOT_FOUND',
            message: 'Deal not found'
          }),
          { status: 404 }
        )
      }

      // Verify target stage exists in same org
      const targetStage = await prisma.pipelineStage.findFirst({
        where: { id: stageId, organizationId: context.organizationId }
      })

      if (!targetStage) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'NOT_FOUND',
            message: 'Target stage not found'
          }),
          { status: 404 }
        )
      }

      // Spec 014: the one door for moves (history with origin/destination, status by stage type, automations)
      const movimento = await moverNegocio({
        organizationId: context.organizationId,
        dealId: paramsData.id,
        paraEtapaId: stageId,
        autor: { userId: existingDeal.userId, tipo: movedBy === 'ai' ? 'IA' : 'API' },
      })
      if (!movimento.ok) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'NOT_FOUND',
            message: "Target stage not found in this deal's pipeline"
          }),
          { status: 404 }
        )
      }

      // isolamento: deal checked above (existingDeal, scoped by organizationId)
      const deal = await prisma.deal.findUniqueOrThrow({
        where: { id: paramsData.id },
        include: {
          stage: { select: { id: true, name: true, order: true } },
          pipeline: { select: { id: true, name: true } },
          contact: { select: { id: true, name: true, email: true, phone: true } },
          user: { select: { id: true, name: true, email: true } }
        }
      })

      // Dispatch webhook
      if (movimento.mudou) {
        dispatchWebhookAsync(context.organizationId, WEBHOOK_EVENTS.DEAL_STAGE_CHANGED, {
          dealId: deal.id,
          previousStageId: existingDeal.stageId,
          previousStageName: existingDeal.stage.name,
          newStageId: stageId,
          newStageName: targetStage.name,
          movedBy
        })
      }

      const formattedDeal = {
        id: deal.id,
        title: deal.title,
        value: formatDecimal(deal.value),
        closeDate: formatDate(deal.closeDate),
        stage: deal.stage,
        pipeline: deal.pipeline,
        contact: deal.contact,
        user: deal.user,
        movedBy,
        previousStage: { id: existingDeal.stageId, name: existingDeal.stage.name },
        createdAt: deal.createdAt.toISOString(),
        updatedAt: deal.updatedAt.toISOString()
      }

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        dealId: deal.id,
        fromStage: existingDeal.stage.name,
        toStage: targetStage.name,
        movedBy
      }, 'Deal stage changed via API')

      return NextResponse.json(
        apiResponse(context.requestId, formattedDeal)
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error changing deal stage via API')

      return NextResponse.json(
        apiResponse(context.requestId, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to change deal stage'
        }),
        { status: 500 }
      )
    }
  })
}
