import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getGoogleCalendarClient,
  logGoogleCalendarActivity
} from '@/lib/integrations/google-calendar-client'
import logger from '@/lib/logger'

/**
 * Sync Google Calendar events for all organizations
 * Cron job: Runs every 4 hours
 *
 * GET /api/cron/sync-google-calendar
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Starting Google Calendar sync cron job')

    // Get all organizations with Google Calendar enabled
    const organizations = await prisma.organization.findMany({
      where: {
        googleCalendarEnabled: true,
        googleCalendarRefreshToken: { not: null }
      },
      select: {
        id: true,
        name: true,
        googleCalendarEmail: true
      }
    })

    logger.info({
      organizationCount: organizations.length
    }, 'Found organizations with Google Calendar enabled')

    let successCount = 0
    let failCount = 0

    // Sync events for each organization
    for (const org of organizations) {
      try {
        await syncOrganizationEvents(org.id)
        successCount++

        logger.info({
          organizationId: org.id,
          organizationName: org.name
        }, 'Google Calendar sync successful')
      } catch (error: any) {
        failCount++

        logger.error({
          error,
          organizationId: org.id,
          organizationName: org.name
        }, 'Error syncing Google Calendar')

        await logGoogleCalendarActivity(
          org.id,
          'cron_sync',
          'FAILED',
          { cronJob: true },
          null,
          error.message
        )
      }
    }

    const result = {
      success: true,
      organizationsProcessed: organizations.length,
      successCount,
      failCount,
      timestamp: new Date().toISOString()
    }

    logger.info(result, 'Google Calendar sync cron job completed')

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error({ error }, 'Error in Google Calendar sync cron job')
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * Sync events for a single organization
 */
async function syncOrganizationEvents(organizationId: string): Promise<void> {
  // Get calendar client
  const client = await getGoogleCalendarClient(organizationId)
  if (!client) {
    throw new Error('Failed to create calendar client')
  }

  // Define time range: next 7 days
  const now = new Date()
  const weekFromNow = new Date(now)
  weekFromNow.setDate(weekFromNow.getDate() + 7)

  // Fetch events from Google Calendar
  const events = await client.listEvents({
    timeMin: now.toISOString(),
    timeMax: weekFromNow.toISOString(),
    maxResults: 100
  })

  logger.info({
    organizationId,
    eventCount: events.length
  }, 'Fetched events from Google Calendar')

  // Process each event
  for (const gcalEvent of events) {
    if (!gcalEvent.id || !gcalEvent.start?.dateTime) {
      continue // Skip all-day events and events without proper dates
    }

    // Check if event already exists in database
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        organizationId,
        googleEventId: gcalEvent.id
      }
    })

    const eventData = {
      title: gcalEvent.summary || 'Evento sem título',
      description: gcalEvent.description || null,
      startTime: new Date(gcalEvent.start.dateTime),
      endTime: gcalEvent.end?.dateTime ? new Date(gcalEvent.end.dateTime) : new Date(gcalEvent.start.dateTime),
      location: gcalEvent.location || null,
      syncStatus: 'SYNCED' as const,
      lastSyncAt: new Date()
    }

    if (existingEvent) {
      // Update existing event
      await prisma.calendarEvent.update({
        where: { id: existingEvent.id },
        data: eventData
      })
    } else {
      // Create new event
      await prisma.calendarEvent.create({
        data: {
          ...eventData,
          organizationId,
          googleEventId: gcalEvent.id
          // Note: dealId is null for events synced from Google Calendar
          // These can be manually linked to deals later
        }
      })

      logger.info({
        organizationId,
        googleEventId: gcalEvent.id,
        title: gcalEvent.summary
      }, 'New Google Calendar event synced')
    }
  }

  // Log successful sync
  await logGoogleCalendarActivity(
    organizationId,
    'cron_sync',
    'SUCCESS',
    { cronJob: true, eventCount: events.length },
    { eventsSynced: events.length }
  )
}
