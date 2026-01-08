import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { formatDecimal } from '@/lib/api-helpers'
import { validateRequest, updateContactSchema, uuidSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'

/**
 * GET /api/v1/contacts/[id]
 * Get a specific contact by ID
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
              message: 'Invalid contact ID format'
            }
          ),
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
            select: {
              id: true,
              title: true,
              value: true,
              stage: {
                select: {
                  id: true,
                  name: true
                }
              },
              pipeline: {
                select: {
                  id: true,
                  name: true
                }
              },
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!contact) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'NOT_FOUND',
              message: 'Contact not found'
            }
          ),
          { status: 404 }
        )
      }

      // Format response
      const formattedContact = {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        deals: contact.deals.map(deal => ({
          id: deal.id,
          title: deal.title,
          value: formatDecimal(deal.value),
          stage: deal.stage,
          pipeline: deal.pipeline,
          createdAt: deal.createdAt.toISOString()
        })),
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString()
      }

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        contactId: contact.id
      }, 'Contact retrieved via API')

      return NextResponse.json(
        apiResponse(context.requestId, formattedContact)
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error retrieving contact via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve contact'
          }
        ),
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH /api/v1/contacts/[id]
 * Update a specific contact
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
              message: 'Invalid contact ID format'
            }
          ),
          { status: 400 }
        )
      }

      // Validate request body
      const validation = await validateRequest(req, updateContactSchema)

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

      // Verify contact exists and belongs to organization
      const existingContact = await prisma.contact.findFirst({
        where: {
          id: paramsData.id,
          organizationId: context.organizationId
        }
      })

      if (!existingContact) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'NOT_FOUND',
              message: 'Contact not found'
            }
          ),
          { status: 404 }
        )
      }

      // Check for email conflicts if email is being changed
      if (data.email && data.email !== existingContact.email) {
        const emailConflict = await prisma.contact.findFirst({
          where: {
            organizationId: context.organizationId,
            email: data.email,
            id: { not: paramsData.id }
          }
        })

        if (emailConflict) {
          return NextResponse.json(
            apiResponse(
              context.requestId,
              undefined,
              {
                code: 'CONFLICT',
                message: 'A contact with this email already exists in your organization'
              }
            ),
            { status: 409 }
          )
        }
      }

      // Update contact
      const contact = await prisma.contact.update({
        where: { id: paramsData.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.company !== undefined && { company: data.company })
        }
      })

      // Format response
      const formattedContact = {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString()
      }

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        contactId: contact.id
      }, 'Contact updated via API')

      return NextResponse.json(
        apiResponse(context.requestId, formattedContact)
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error updating contact via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update contact'
          }
        ),
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/v1/contacts/[id]
 * Delete a specific contact
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
              message: 'Invalid contact ID format'
            }
          ),
          { status: 400 }
        )
      }

      // Verify contact exists and belongs to organization
      const contact = await prisma.contact.findFirst({
        where: {
          id: paramsData.id,
          organizationId: context.organizationId
        },
        include: {
          _count: {
            select: { deals: true }
          }
        }
      })

      if (!contact) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'NOT_FOUND',
              message: 'Contact not found'
            }
          ),
          { status: 404 }
        )
      }

      // Check if contact has deals
      if (contact._count.deals > 0) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'CONFLICT',
              message: `Cannot delete contact with ${contact._count.deals} associated deal(s). Remove the contact from deals first.`
            }
          ),
          { status: 409 }
        )
      }

      // Delete contact
      await prisma.contact.delete({
        where: { id: paramsData.id }
      })

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        contactId: paramsData.id
      }, 'Contact deleted via API')

      return NextResponse.json(
        apiResponse(context.requestId, { deleted: true }),
        { status: 200 }
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error deleting contact via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete contact'
          }
        ),
        { status: 500 }
      )
    }
  })
}
