import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { getPaginationParams, getPaginationMeta, paginatedResponse, getSortParams, getFilters, formatDecimal, formatDate } from '@/lib/api-helpers'
import { validateRequest, createDealSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'
import { sendNewDealNotification } from '@/lib/push-notifications'
import { executeDealAutomations } from '@/lib/automations/engine'
import { canCreateDeal } from '@/lib/plan-limits'

/**
 * GET /api/v1/deals
 * List all deals for the authenticated organization
 */
export async function GET(request: NextRequest) {
  return withApiMiddleware(request, async (req, context) => {
    try {
      // Parse pagination
      const { page, limit, offset } = getPaginationParams(req)

      // Parse sorting
      const { sortBy, order } = getSortParams(
        req,
        'createdAt',
        ['createdAt', 'updatedAt', 'title', 'value']
      )

      // Parse filters
      const filters = getFilters(req, ['stageId', 'pipelineId', 'contactId', 'userId'])

      // Build where clause
      const where: any = {
        organizationId: context.organizationId
      }

      if (filters.stageId) where.stageId = filters.stageId
      if (filters.pipelineId) where.pipelineId = filters.pipelineId
      if (filters.contactId) where.contactId = filters.contactId
      if (filters.userId) where.userId = filters.userId

      // Get total count
      const total = await prisma.deal.count({ where })

      // Get deals with relations
      const deals = await prisma.deal.findMany({
        where,
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
        },
        orderBy: { [sortBy]: order },
        skip: offset,
        take: limit
      })

      // Format response
      const formattedDeals = deals.map(deal => ({
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
      }))

      const pagination = getPaginationMeta(page, limit, total)

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        count: deals.length,
        total
      }, 'Deals listed via API')

      return NextResponse.json(
        paginatedResponse(context.requestId, formattedDeals, pagination)
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error listing deals via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to list deals'
          }
        ),
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/v1/deals
 * Create a new deal
 */
export async function POST(request: NextRequest) {
  return withApiMiddleware(request, async (req, context) => {
    try {
      // Validate request body
      const validation = await validateRequest(req, createDealSchema)

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

      // Check plan limits / trial read-only
      const limitCheck = await canCreateDeal(context.organizationId)
      if (!limitCheck.allowed) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: limitCheck.reason === 'TRIAL_EXPIRED' ? 'TRIAL_EXPIRED' : 'PLAN_LIMIT_REACHED',
            message: limitCheck.reason === 'TRIAL_EXPIRED'
              ? 'Seu período de trial expirou. Faça upgrade para continuar.'
              : `Limite de negócios atingido. Faça upgrade para continuar.`,
          }),
          { status: 403 }
        )
      }

      // Verify stage exists and belongs to organization
      const stage = await prisma.pipelineStage.findFirst({
        where: {
          id: data.stageId,
          organizationId: context.organizationId
        },
        include: {
          pipeline: true
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

      // If pipelineId provided, verify it matches stage's pipeline
      if (data.pipelineId && data.pipelineId !== stage.pipelineId) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'VALIDATION_ERROR',
              message: 'Stage does not belong to the specified pipeline'
            }
          ),
          { status: 400 }
        )
      }

      // If contactId provided, verify it exists and belongs to organization
      if (data.contactId) {
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

      // Get a user from the organization to assign the deal
      const user = await prisma.user.findFirst({
        where: { organizationId: context.organizationId }
      })

      if (!user) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'INTERNAL_ERROR',
              message: 'No user found in organization'
            }
          ),
          { status: 500 }
        )
      }

      // Create deal
      const deal = await prisma.deal.create({
        data: {
          title: data.title,
          value: data.value,
          stageId: data.stageId,
          pipelineId: stage.pipelineId,
          contactId: data.contactId,
          closeDate: data.closeDate ? new Date(data.closeDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          userId: user.id,
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
          }
        }
      })

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
      }, 'Deal created via API')

      // Send push notification to the assigned user
      sendNewDealNotification(
        deal.userId,
        deal.title,
        deal.value ? deal.value.toNumber() : undefined
      ).catch(error => {
        logger.error({ error, dealId: deal.id }, 'Failed to send new deal notification')
      })

      // Fire-and-forget: trigger DEAL_CREATED automations
      executeDealAutomations(deal.id, 'DEAL_CREATED', {
        organizationId: deal.organizationId,
        value: deal.value ? parseFloat(deal.value.toString()) : 0,
        stageId: deal.stageId,
        pipelineId: deal.pipelineId,
        title: deal.title,
        userId: deal.userId
      }).catch(() => {})

      return NextResponse.json(
        apiResponse(context.requestId, formattedDeal),
        { status: 201 }
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error creating deal via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create deal'
          }
        ),
        { status: 500 }
      )
    }
  })
}
