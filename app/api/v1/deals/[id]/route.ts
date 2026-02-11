import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { formatDecimal, formatDate } from '@/lib/api-helpers'
import { validateRequest, updateDealSchema, uuidSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'
import { sendDealWonNotification } from '@/lib/push-notifications'
import { executeDealAutomations } from '@/lib/automations/engine'

/**
 * GET /api/v1/deals/[id]
 * Get a specific deal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(request, async (req, context) => {
    const paramsData = await params
    try {
      // Validate ID format
      const idValidation = uuidSchema.safeParse(paramsData.id)
      if (!idValidation.success) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'VALIDATION_ERROR',
              message: 'Invalid deal ID format'
            }
          ),
          { status: 400 }
        )
      }

      const deal = await prisma.deal.findFirst({
        where: {
          id: paramsData.id,
          organizationId: context.organizationId
        },
        include: {
          stage: {
            select: {
              id: true,
              name: true,
              order: true
            }
          },
          pipeline: {
            select: {
              id: true,
              name: true
            }
          },
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          notes: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          activities: {
            select: {
              id: true,
              type: true,
              description: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        }
      })

      if (!deal) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'NOT_FOUND',
              message: 'Deal not found'
            }
          ),
          { status: 404 }
        )
      }

      // Format response
      const formattedDeal = {
        id: deal.id,
        title: deal.title,
        value: formatDecimal(deal.value),
        closeDate: formatDate(deal.closeDate),
        dueDate: formatDate(deal.dueDate),
        order: deal.order,
        stage: deal.stage,
        pipeline: deal.pipeline,
        contact: deal.contact,
        user: deal.user,
        notes: deal.notes.map(note => ({
          ...note,
          createdAt: note.createdAt.toISOString()
        })),
        activities: deal.activities.map(activity => ({
          ...activity,
          createdAt: activity.createdAt.toISOString()
        })),
        createdAt: deal.createdAt.toISOString(),
        updatedAt: deal.updatedAt.toISOString()
      }

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        dealId: deal.id
      }, 'Deal retrieved via API')

      return NextResponse.json(
        apiResponse(context.requestId, formattedDeal)
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error retrieving deal via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve deal'
          }
        ),
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH /api/v1/deals/[id]
 * Update a specific deal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(request, async (req, context) => {
    const paramsData = await params
    try {
      // Validate ID format
      const idValidation = uuidSchema.safeParse(paramsData.id)
      if (!idValidation.success) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'VALIDATION_ERROR',
              message: 'Invalid deal ID format'
            }
          ),
          { status: 400 }
        )
      }

      // Validate request body
      const validation = await validateRequest(req, updateDealSchema)

      if (!validation.success) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: validation.errors
            }
          ),
          { status: 400 }
        )
      }

      const data = validation.data

      // Verify deal exists and belongs to organization
      const existingDeal = await prisma.deal.findFirst({
        where: {
          id: paramsData.id,
          organizationId: context.organizationId
        }
      })

      if (!existingDeal) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'NOT_FOUND',
              message: 'Deal not found'
            }
          ),
          { status: 404 }
        )
      }

      // If stageId provided, verify it exists and belongs to organization
      if (data.stageId) {
        const stage = await prisma.pipelineStage.findFirst({
          where: {
            id: data.stageId,
            organizationId: context.organizationId
          }
        })

        if (!stage) {
          return NextResponse.json(
            apiResponse(
              context.requestId,
              undefined,
              {
                code: 'NOT_FOUND',
                message: 'Stage not found or does not belong to your organization'
              }
            ),
            { status: 404 }
          )
        }
      }

      // If contactId provided, verify it exists and belongs to organization
      if (data.contactId !== undefined && data.contactId !== null) {
        const contact = await prisma.contact.findFirst({
          where: {
            id: data.contactId,
            organizationId: context.organizationId
          }
        })

        if (!contact) {
          return NextResponse.json(
            apiResponse(
              context.requestId,
              undefined,
              {
                code: 'NOT_FOUND',
                message: 'Contact not found or does not belong to your organization'
              }
            ),
            { status: 404 }
          )
        }
      }

      // Update deal
      const deal = await prisma.deal.update({
        where: { id: paramsData.id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.value !== undefined && { value: data.value }),
          ...(data.stageId && { stageId: data.stageId }),
          ...(data.contactId !== undefined && { contactId: data.contactId }),
          ...(data.closeDate !== undefined && {
            closeDate: data.closeDate ? new Date(data.closeDate) : null
          }),
          ...(data.dueDate !== undefined && {
            dueDate: data.dueDate ? new Date(data.dueDate) : null
          })
        },
        include: {
          stage: {
            select: {
              id: true,
              name: true,
              order: true
            }
          },
          pipeline: {
            select: {
              id: true,
              name: true
            }
          },
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Check if stage changed to a "won" stage and send notification
      if (data.stageId && data.stageId !== existingDeal.stageId) {
        const stageName = deal.stage.name.toLowerCase()
        if (stageName.includes('ganho') || stageName.includes('won') || stageName.includes('fechado')) {
          // Send notification to entire organization
          sendDealWonNotification(
            context.organizationId,
            deal.title,
            deal.value ? deal.value.toNumber() : undefined
          ).catch(error => {
            logger.error({ error, dealId: deal.id }, 'Failed to send deal won notification')
          })
        }
      }

      // Fire-and-forget automation triggers
      const automationContext = {
        organizationId: deal.organizationId,
        value: deal.value ? parseFloat(deal.value.toString()) : 0,
        stageId: deal.stageId,
        pipelineId: deal.pipelineId,
        title: deal.title,
        userId: deal.userId
      }

      // DEAL_MOVED: stageId changed
      if (data.stageId && data.stageId !== existingDeal.stageId) {
        executeDealAutomations(deal.id, 'DEAL_MOVED', automationContext).catch(() => {})

        // Check if the new stage name indicates a WON deal
        const stageName = deal.stage.name.toLowerCase()
        if (stageName.includes('ganho') || stageName.includes('won') || stageName.includes('fechado')) {
          executeDealAutomations(deal.id, 'DEAL_WON', automationContext).catch(() => {})
        }
        // Check if the new stage name indicates a LOST deal
        if (stageName.includes('perdido') || stageName.includes('lost') || stageName.includes('cancelado')) {
          executeDealAutomations(deal.id, 'DEAL_LOST', automationContext).catch(() => {})
        }
      }

      // Format response
      const formattedDeal = {
        id: deal.id,
        title: deal.title,
        value: formatDecimal(deal.value),
        closeDate: formatDate(deal.closeDate),
        dueDate: formatDate(deal.dueDate),
        order: deal.order,
        stage: deal.stage,
        pipeline: deal.pipeline,
        contact: deal.contact,
        user: deal.user,
        createdAt: deal.createdAt.toISOString(),
        updatedAt: deal.updatedAt.toISOString()
      }

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        dealId: deal.id
      }, 'Deal updated via API')

      return NextResponse.json(
        apiResponse(context.requestId, formattedDeal)
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error updating deal via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update deal'
          }
        ),
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/v1/deals/[id]
 * Delete a specific deal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(request, async (req, context) => {
    const paramsData = await params
    try {
      // Validate ID format
      const idValidation = uuidSchema.safeParse(paramsData.id)
      if (!idValidation.success) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'VALIDATION_ERROR',
              message: 'Invalid deal ID format'
            }
          ),
          { status: 400 }
        )
      }

      // Verify deal exists and belongs to organization
      const deal = await prisma.deal.findFirst({
        where: {
          id: paramsData.id,
          organizationId: context.organizationId
        }
      })

      if (!deal) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'NOT_FOUND',
              message: 'Deal not found'
            }
          ),
          { status: 404 }
        )
      }

      // Delete deal (cascade deletes notes and activities)
      await prisma.deal.delete({
        where: { id: paramsData.id }
      })

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        dealId: paramsData.id
      }, 'Deal deleted via API')

      return NextResponse.json(
        apiResponse(context.requestId, { deleted: true }),
        { status: 200 }
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error deleting deal via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete deal'
          }
        ),
        { status: 500 }
      )
    }
  })
}
