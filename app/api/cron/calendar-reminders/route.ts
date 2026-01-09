import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendCalendarEventNotification } from '@/lib/push-notifications'
import logger from '@/lib/logger'

/**
 * Cron job para enviar lembretes de eventos do calendário
 * Roda a cada hora e envia notificações para eventos que começam nas próximas 24 horas
 *
 * Configuração no vercel.json:
 * {
 *   "path": "/api/cron/calendar-reminders",
 *   "schedule": "0 * * * *"
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token !== process.env.CRON_SECRET) {
      logger.warn('Unauthorized calendar reminders cron attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Starting calendar reminders cron job')

    // Get events starting in the next 24 hours that haven't been reminded yet
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const upcomingEvents = await prisma.calendarEvent.findMany({
      where: {
        startTime: {
          gte: now,
          lte: tomorrow
        },
        syncStatus: 'SYNCED'
      },
      include: {
        deal: {
          include: {
            user: true,
            contact: true
          }
        },
        organization: {
          include: {
            users: {
              select: {
                id: true
              }
            }
          }
        }
      }
    })

    let sent = 0
    let failed = 0

    for (const event of upcomingEvents) {
      try {
        // Determine who to notify
        const userIdsToNotify: string[] = []

        // If event has a deal, notify the deal owner
        if (event.deal && event.deal.user) {
          userIdsToNotify.push(event.deal.user.id)
        } else {
          // Otherwise, notify all users in the organization
          userIdsToNotify.push(...event.organization.users.map(u => u.id))
        }

        // Send notifications
        for (const userId of userIdsToNotify) {
          try {
            await sendCalendarEventNotification(
              userId,
              event.title,
              event.startTime
            )
            sent++
          } catch (error) {
            logger.error({
              error,
              userId,
              eventId: event.id
            }, 'Failed to send calendar reminder notification')
            failed++
          }
        }

        logger.info({
          eventId: event.id,
          title: event.title,
          startTime: event.startTime,
          notifiedUsers: userIdsToNotify.length
        }, 'Calendar reminder sent')

      } catch (error) {
        logger.error({
          error,
          eventId: event.id
        }, 'Error processing calendar event for reminders')
        failed++
      }
    }

    logger.info({
      eventsProcessed: upcomingEvents.length,
      sent,
      failed
    }, 'Calendar reminders cron job completed')

    return NextResponse.json({
      success: true,
      eventsProcessed: upcomingEvents.length,
      notificationsSent: sent,
      notificationsFailed: failed
    })

  } catch (error) {
    logger.error({ error }, 'Error in calendar reminders cron job')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
