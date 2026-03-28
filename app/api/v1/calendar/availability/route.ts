import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

/**
 * GET /api/v1/calendar/availability
 * Get available time slots from Google Calendar for the organization's calendar.
 * Used by Sofia IA MeetingScheduler agent to propose meeting times.
 *
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - durationMinutes: number (default: 60)
 */
export async function GET(request: NextRequest) {
  return withApiMiddleware(request, async (req, context) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      const durationMinutes = parseInt(searchParams.get('durationMinutes') || '60', 10)

      if (!startDate || !endDate) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'startDate and endDate query parameters are required (ISO format)'
          }),
          { status: 400 }
        )
      }

      const start = new Date(startDate)
      const end = new Date(endDate)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format. Use ISO 8601 (e.g., 2026-03-28T00:00:00Z)'
          }),
          { status: 400 }
        )
      }

      // Check if Google Calendar is configured
      const org = await prisma.organization.findUnique({
        where: { id: context.organizationId },
        select: {
          googleCalendarEnabled: true,
          googleCalendarRefreshToken: true,
          googleCalendarEmail: true
        }
      })

      if (!org?.googleCalendarEnabled || !org?.googleCalendarRefreshToken) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'PRECONDITION_FAILED',
            message: 'Google Calendar not configured for this organization'
          }),
          { status: 412 }
        )
      }

      // Fetch existing events in the date range
      const existingEvents = await prisma.calendarEvent.findMany({
        where: {
          organizationId: context.organizationId,
          startTime: { gte: start },
          endTime: { lte: end }
        },
        select: { startTime: true, endTime: true, title: true },
        orderBy: { startTime: 'asc' }
      })

      // Generate available slots (business hours: 9-18, Mon-Fri)
      const slots: { start: string; end: string }[] = []
      const current = new Date(start)
      current.setHours(9, 0, 0, 0)

      while (current < end) {
        const dayOfWeek = current.getDay()

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          current.setDate(current.getDate() + 1)
          current.setHours(9, 0, 0, 0)
          continue
        }

        const slotEnd = new Date(current.getTime() + durationMinutes * 60 * 1000)

        // Only generate slots within business hours (9-18)
        if (slotEnd.getHours() > 18 || (slotEnd.getHours() === 18 && slotEnd.getMinutes() > 0)) {
          current.setDate(current.getDate() + 1)
          current.setHours(9, 0, 0, 0)
          continue
        }

        // Check for conflicts
        const hasConflict = existingEvents.some(event => {
          const eventStart = new Date(event.startTime)
          const eventEnd = new Date(event.endTime)
          return current < eventEnd && slotEnd > eventStart
        })

        if (!hasConflict) {
          slots.push({
            start: current.toISOString(),
            end: slotEnd.toISOString()
          })
        }

        // Advance by 30 minutes
        current.setMinutes(current.getMinutes() + 30)
      }

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        slotsFound: slots.length
      }, 'Calendar availability retrieved via API')

      return NextResponse.json(
        apiResponse(context.requestId, {
          calendarEmail: org.googleCalendarEmail,
          busyEvents: existingEvents.map(e => ({
            title: e.title,
            start: e.startTime.toISOString(),
            end: e.endTime.toISOString()
          })),
          availableSlots: slots,
          timezone: 'America/Sao_Paulo'
        })
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error retrieving calendar availability via API')

      return NextResponse.json(
        apiResponse(context.requestId, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve calendar availability'
        }),
        { status: 500 }
      )
    }
  })
}
