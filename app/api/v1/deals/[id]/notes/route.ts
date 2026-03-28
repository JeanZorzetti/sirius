import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { uuidSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'
import { dispatchWebhookAsync, WEBHOOK_EVENTS } from '@/lib/webhooks'

/**
 * POST /api/v1/deals/[id]/notes
 * Create a note on a deal. Used by Sofia IA agents to register analyses and observations.
 */
export async function POST(
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
      const { content, authorName } = body

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'content is required and must be a non-empty string'
          }),
          { status: 400 }
        )
      }

      // Verify deal exists
      const deal = await prisma.deal.findFirst({
        where: { id: paramsData.id, organizationId: context.organizationId }
      })

      if (!deal) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'NOT_FOUND',
            message: 'Deal not found'
          }),
          { status: 404 }
        )
      }

      // Create note — use deal's userId as author (agent acts on behalf of assigned user)
      const note = await prisma.note.create({
        data: {
          content: authorName ? `[${authorName}] ${content}` : content,
          dealId: deal.id,
          userId: deal.userId
        },
        include: {
          user: { select: { id: true, name: true } }
        }
      })

      // Dispatch webhook
      dispatchWebhookAsync(context.organizationId, WEBHOOK_EVENTS.DEAL_NOTE_ADDED, {
        dealId: deal.id,
        noteId: note.id,
        authorName: authorName || note.user?.name
      })

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        dealId: deal.id,
        noteId: note.id
      }, 'Deal note created via API')

      return NextResponse.json(
        apiResponse(context.requestId, {
          id: note.id,
          content: note.content,
          user: note.user,
          dealId: note.dealId,
          createdAt: note.createdAt.toISOString()
        }),
        { status: 201 }
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error creating deal note via API')

      return NextResponse.json(
        apiResponse(context.requestId, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create deal note'
        }),
        { status: 500 }
      )
    }
  })
}
