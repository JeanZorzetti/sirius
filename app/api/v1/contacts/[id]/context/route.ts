import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { formatDecimal } from '@/lib/api-helpers'
import { uuidSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'

/**
 * GET /api/v1/contacts/[id]/context
 * Full context for a contact: deals, notes, WhatsApp messages, activities, emails
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
            message: 'Invalid contact ID format'
          }),
          { status: 400 }
        )
      }

      const contact = await prisma.contact.findFirst({
        where: {
          id: paramsData.id,
          organizationId: context.organizationId
        },
        include: {
          deals: {
            include: {
              stage: { select: { id: true, name: true, order: true } },
              pipeline: { select: { id: true, name: true } },
              user: { select: { id: true, name: true, email: true } },
              notes: {
                select: { id: true, content: true, createdAt: true, user: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 20
              },
              activities: {
                select: { id: true, type: true, description: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 20
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          tags: { select: { id: true, name: true, color: true } },
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      })

      if (!contact) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'NOT_FOUND',
            message: 'Contact not found'
          }),
          { status: 404 }
        )
      }

      // Fetch WhatsApp messages for this contact
      let whatsappMessages: any[] = []
      if (contact.id) {
        whatsappMessages = await prismaWa.whatsAppMessage.findMany({
          where: {
            contactId: contact.id
          },
          select: {
            id: true,
            remoteJid: true,
            text: true,
            direction: true,
            mediaType: true,
            sentAt: true
          },
          orderBy: { sentAt: 'desc' },
          take: 50
        })
      }

      const formattedContact = {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        tags: contact.tags,
        assignedTo: contact.assignedTo,
        deals: contact.deals.map(deal => ({
          id: deal.id,
          title: deal.title,
          value: formatDecimal(deal.value),
          stage: deal.stage,
          pipeline: deal.pipeline,
          user: deal.user,
          notes: deal.notes.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })),
          activities: deal.activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
          createdAt: deal.createdAt.toISOString(),
          updatedAt: deal.updatedAt.toISOString()
        })),
        whatsappMessages: whatsappMessages.map(m => ({
          ...m,
          sentAt: m.sentAt.toISOString()
        })),
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString()
      }

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        contactId: contact.id
      }, 'Contact context retrieved via API')

      return NextResponse.json(
        apiResponse(context.requestId, formattedContact)
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error retrieving contact context via API')

      return NextResponse.json(
        apiResponse(context.requestId, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve contact context'
        }),
        { status: 500 }
      )
    }
  })
}
