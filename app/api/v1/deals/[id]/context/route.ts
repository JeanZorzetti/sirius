import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { formatDecimal, formatDate } from '@/lib/api-helpers'
import { uuidSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'

/**
 * GET /api/v1/deals/[id]/context
 * Full context for a deal: pipeline, contact, notes, stage history, activities, WhatsApp
 * Used by Sofia IA agents for autonomous operation
 */
export async function GET(
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

      const deal = await prisma.deal.findFirst({
        where: {
          id: paramsData.id,
          organizationId: context.organizationId
        },
        include: {
          stage: { select: { id: true, name: true, order: true } },
          pipeline: {
            include: {
              stages: {
                select: { id: true, name: true, order: true },
                orderBy: { order: 'asc' }
              }
            }
          },
          contact: {
            select: {
              id: true, name: true, email: true, phone: true, company: true
            }
          },
          user: { select: { id: true, name: true, email: true } },
          notes: {
            select: {
              id: true, content: true, createdAt: true,
              user: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
          },
          activities: {
            select: {
              id: true, type: true, description: true, createdAt: true,
              user: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
          },
          product: { select: { id: true, name: true, price: true } },
          calendarEvents: {
            select: { id: true, title: true, startTime: true, endTime: true },
            orderBy: { startTime: 'desc' },
            take: 10
          }
        }
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

      // Fetch WhatsApp messages linked to this deal or its contact
      let whatsappMessages: any[] = []
      const whatsappWhere: any = { OR: [] }
      if (deal.id) whatsappWhere.OR.push({ dealId: deal.id })
      if (deal.contact?.id) whatsappWhere.OR.push({ contactId: deal.contact.id })

      if (whatsappWhere.OR.length > 0) {
        whatsappMessages = await prismaWa.whatsAppMessage.findMany({
          where: whatsappWhere,
          select: {
            id: true, remoteJid: true, text: true,
            direction: true, mediaType: true, sentAt: true
          },
          orderBy: { sentAt: 'desc' },
          take: 50
        })
      }

      // Fetch agent actions related to this deal
      const agentActions = await prisma.agentAction.findMany({
        where: {
          organizationId: context.organizationId,
          entityType: 'Deal',
          entityId: deal.id
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })

      const formattedDeal = {
        id: deal.id,
        title: deal.title,
        value: formatDecimal(deal.value),
        closeDate: formatDate(deal.closeDate),
        dueDate: formatDate(deal.dueDate),
        order: deal.order,
        stage: deal.stage,
        pipeline: {
          id: deal.pipeline.id,
          name: deal.pipeline.name,
          stages: deal.pipeline.stages
        },
        contact: deal.contact,
        user: deal.user,
        product: deal.product,
        notes: deal.notes.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })),
        activities: deal.activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
        calendarEvents: deal.calendarEvents.map(e => ({
          ...e,
          startTime: e.startTime.toISOString(),
          endTime: e.endTime.toISOString()
        })),
        whatsappMessages: whatsappMessages.map(m => ({ ...m, sentAt: m.sentAt.toISOString() })),
        agentActions: agentActions.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
        createdAt: deal.createdAt.toISOString(),
        updatedAt: deal.updatedAt.toISOString()
      }

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        dealId: deal.id
      }, 'Deal context retrieved via API')

      return NextResponse.json(
        apiResponse(context.requestId, formattedDeal)
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error retrieving deal context via API')

      return NextResponse.json(
        apiResponse(context.requestId, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve deal context'
        }),
        { status: 500 }
      )
    }
  })
}
