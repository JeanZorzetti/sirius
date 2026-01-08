import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { getPaginationParams, getPaginationMeta, paginatedResponse, getSortParams } from '@/lib/api-helpers'
import { validateRequest, createContactSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'

/**
 * GET /api/v1/contacts
 * List all contacts for the authenticated organization
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
        ['createdAt', 'updatedAt', 'name', 'email', 'company']
      )

      // Build where clause
      const where = {
        organizationId: context.organizationId
      }

      // Get total count
      const total = await prisma.contact.count({ where })

      // Get contacts with deal count
      const contacts = await prisma.contact.findMany({
        where,
        include: {
          _count: {
            select: { deals: true }
          }
        },
        orderBy: { [sortBy]: order },
        skip: offset,
        take: limit
      })

      // Format response
      const formattedContacts = contacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        dealsCount: contact._count.deals,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString()
      }))

      const pagination = getPaginationMeta(page, limit, total)

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        count: contacts.length,
        total
      }, 'Contacts listed via API')

      return NextResponse.json(
        paginatedResponse(context.requestId, formattedContacts, pagination)
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error listing contacts via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to list contacts'
          }
        ),
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/v1/contacts
 * Create a new contact
 */
export async function POST(request: NextRequest) {
  return withApiMiddleware(request, async (req, context) => {
    try {
      // Validate request body
      const validation = await validateRequest(req, createContactSchema)

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

      // Check if contact with same email already exists (if email provided)
      if (data.email) {
        const existing = await prisma.contact.findFirst({
          where: {
            organizationId: context.organizationId,
            email: data.email
          }
        })

        if (existing) {
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

      // Create contact
      const contact = await prisma.contact.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company,
          organizationId: context.organizationId
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
      }, 'Contact created via API')

      return NextResponse.json(
        apiResponse(context.requestId, formattedContact),
        { status: 201 }
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error creating contact via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create contact'
          }
        ),
        { status: 500 }
      )
    }
  })
}
