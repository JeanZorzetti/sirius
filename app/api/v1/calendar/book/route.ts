import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { uuidSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'

/**
 * POST /api/v1/calendar/book
 * Book a meeting on the organization's calendar.
 * Used by Sofia IA MeetingScheduler agent.
 */
export async function POST(request: NextRequest) {
  return withApiMiddleware(request, async (req, context) => {
    try {
      const body = await req.json()
      const { title, description, startTime, endTime, dealId, location } = body

      if (!title || !startTime || !endTime) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'title, startTime, and endTime are required'
          }),
          { status: 400 }
        )
      }

      const start = new Date(startTime)
      const end = new Date(endTime)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format for startTime/endTime'
          }),
          { status: 400 }
        )
      }

      if (start >= end) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'startTime must be before endTime'
          }),
          { status: 400 }
        )
      }

      // Validate dealId if provided
      if (dealId) {
        const dealValidation = uuidSchema.safeParse(dealId)
        if (!dealValidation.success) {
          return NextResponse.json(
            apiResponse(context.requestId, undefined, {
              code: 'VALIDATION_ERROR',
              message: 'Invalid dealId format'
            }),
            { status: 400 }
          )
        }

        const deal = await prisma.deal.findFirst({
          where: { id: dealId, organizationId: context.organizationId }
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
      }

      // Check for time conflicts
      const conflicting = await prisma.calendarEvent.findFirst({
        where: {
          organizationId: context.organizationId,
          startTime: { lt: end },
          endTime: { gt: start }
        }
      })

      if (conflicting) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'CONFLICT',
            message: `Time slot conflicts with existing event: "${conflicting.title}"`
          }),
          { status: 409 }
        )
      }

      // Create calendar event
      const event = await prisma.calendarEvent.create({
        data: {
          title,
          description: description || null,
          startTime: start,
          endTime: end,
          location: location || null,
          dealId: dealId || null,
          organizationId: context.organizationId,
          syncStatus: 'PENDING'
        }
      })

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        eventId: event.id,
        dealId
      }, 'Calendar event booked via API')

      return NextResponse.json(
        apiResponse(context.requestId, {
          id: event.id,
          title: event.title,
          description: event.description,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          location: event.location,
          dealId: event.dealId,
          syncStatus: event.syncStatus
        }),
        { status: 201 }
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error booking calendar event via API')

      return NextResponse.json(
        apiResponse(context.requestId, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to book calendar event'
        }),
        { status: 500 }
      )
    }
  })
}
