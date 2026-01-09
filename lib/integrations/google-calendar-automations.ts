/**
 * Google Calendar Automations Library
 *
 * Automated calendar event creation:
 * - Create event when deal is won
 * - Create follow-up reminders
 * - Sync meetings to create deals
 */

import { prisma } from '@/lib/prisma'
import {
  getGoogleCalendarClient,
  logGoogleCalendarActivity
} from './google-calendar-client'
import logger from '@/lib/logger'

/**
 * Create calendar event when a deal is won
 */
export async function createDealWonEvent(
  organizationId: string,
  dealId: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    // Get calendar client
    const client = await getGoogleCalendarClient(organizationId)
    if (!client) {
      return {
        success: false,
        error: 'Google Calendar não está configurado para esta organização'
      }
    }

    // Get deal with contact info
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        contact: true,
        pipeline: true,
        stage: true,
        user: true
      }
    })

    if (!deal || !deal.contact) {
      return {
        success: false,
        error: 'Deal ou contato não encontrado'
      }
    }

    // Calculate event time (next business day at 10 AM)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)

    const eventEnd = new Date(tomorrow)
    eventEnd.setHours(11, 0, 0, 0) // 1-hour meeting

    // Create calendar event
    const event = await client.createEvent({
      summary: `🎉 Deal Fechado: ${deal.title}`,
      description: `Deal ganho com ${deal.contact.name}!\n\n` +
        `Pipeline: ${deal.pipeline.name}\n` +
        `Stage: ${deal.stage.name}\n` +
        `Valor: ${deal.value ? `R$ ${deal.value.toNumber().toLocaleString('pt-BR')}` : 'N/A'}\n\n` +
        `Responsável: ${deal.user.name}\n` +
        `Contato: ${deal.contact.name} (${deal.contact.email || deal.contact.phone || 'N/A'})`,
      location: deal.contact.company || undefined,
      start: {
        dateTime: tomorrow.toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: eventEnd.toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      attendees: deal.contact.email
        ? [
            {
              email: deal.contact.email,
              displayName: deal.contact.name
            }
          ]
        : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 } // 30 minutes before
        ]
      }
    })

    // Save event to database
    await prisma.calendarEvent.create({
      data: {
        organizationId,
        dealId,
        googleEventId: event.id,
        title: `Deal Fechado: ${deal.title}`,
        description: `Reunião de fechamento com ${deal.contact.name}`,
        startTime: tomorrow,
        endTime: eventEnd,
        syncStatus: 'SYNCED',
        lastSyncAt: new Date()
      }
    })

    // Log activity
    await logGoogleCalendarActivity(
      organizationId,
      'create_deal_won_event',
      'SUCCESS',
      { dealId, dealTitle: deal.title },
      { googleEventId: event.id, eventLink: event.htmlLink }
    )

    logger.info({
      organizationId,
      dealId,
      googleEventId: event.id
    }, 'Google Calendar event created for won deal')

    return { success: true, eventId: event.id }
  } catch (error: any) {
    logger.error({
      error,
      organizationId,
      dealId
    }, 'Error creating Google Calendar event for won deal')

    await logGoogleCalendarActivity(
      organizationId,
      'create_deal_won_event',
      'FAILED',
      { dealId },
      null,
      error.message
    )

    return {
      success: false,
      error: error.message || 'Erro ao criar evento no Google Calendar'
    }
  }
}

/**
 * Create follow-up reminder event
 */
export async function createFollowUpReminder(
  organizationId: string,
  dealId: string,
  reminderDate: Date,
  notes?: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    // Get calendar client
    const client = await getGoogleCalendarClient(organizationId)
    if (!client) {
      return {
        success: false,
        error: 'Google Calendar não está configurado'
      }
    }

    // Get deal info
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        contact: true,
        user: true
      }
    })

    if (!deal || !deal.contact) {
      return { success: false, error: 'Deal ou contato não encontrado' }
    }

    // Set reminder time
    const reminderStart = new Date(reminderDate)
    reminderStart.setHours(9, 0, 0, 0) // 9 AM

    const reminderEnd = new Date(reminderStart)
    reminderEnd.setMinutes(30) // 30-minute reminder

    // Create calendar event
    const event = await client.createEvent({
      summary: `📞 Follow-up: ${deal.title}`,
      description: `Lembrete de follow-up com ${deal.contact.name}\n\n` +
        `${notes || 'Acompanhamento de negociação'}\n\n` +
        `Contato: ${deal.contact.name}\n` +
        `Email: ${deal.contact.email || 'N/A'}\n` +
        `Telefone: ${deal.contact.phone || 'N/A'}`,
      start: {
        dateTime: reminderStart.toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: reminderEnd.toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      attendees: deal.contact.email
        ? [{ email: deal.contact.email, displayName: deal.contact.name }]
        : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 60 }
        ]
      }
    })

    // Save to database
    await prisma.calendarEvent.create({
      data: {
        organizationId,
        dealId,
        googleEventId: event.id,
        title: `Follow-up: ${deal.title}`,
        description: notes || 'Lembrete de follow-up',
        startTime: reminderStart,
        endTime: reminderEnd,
        syncStatus: 'SYNCED',
        lastSyncAt: new Date()
      }
    })

    // Log activity
    await logGoogleCalendarActivity(
      organizationId,
      'create_follow_up_reminder',
      'SUCCESS',
      { dealId, reminderDate },
      { googleEventId: event.id }
    )

    logger.info({
      organizationId,
      dealId,
      googleEventId: event.id,
      reminderDate
    }, 'Follow-up reminder created in Google Calendar')

    return { success: true, eventId: event.id }
  } catch (error: any) {
    logger.error({
      error,
      organizationId,
      dealId
    }, 'Error creating follow-up reminder')

    await logGoogleCalendarActivity(
      organizationId,
      'create_follow_up_reminder',
      'FAILED',
      { dealId, reminderDate },
      null,
      error.message
    )

    return {
      success: false,
      error: error.message || 'Erro ao criar lembrete'
    }
  }
}

/**
 * Get all calendar events for a deal
 */
export async function getDealCalendarEvents(dealId: string) {
  return prisma.calendarEvent.findMany({
    where: { dealId },
    orderBy: { startTime: 'asc' }
  })
}

/**
 * Get upcoming calendar events for an organization
 */
export async function getUpcomingCalendarEvents(
  organizationId: string,
  limit: number = 10
) {
  const now = new Date()

  return prisma.calendarEvent.findMany({
    where: {
      organizationId,
      startTime: {
        gte: now
      },
      syncStatus: 'SYNCED'
    },
    orderBy: { startTime: 'asc' },
    take: limit,
    include: {
      deal: {
        include: {
          contact: true
        }
      }
    }
  })
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent(
  organizationId: string,
  googleEventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await getGoogleCalendarClient(organizationId)
    if (!client) {
      return { success: false, error: 'Google Calendar não configurado' }
    }

    // Delete from Google Calendar
    await client.deleteEvent(googleEventId)

    // Delete from database (soft delete by removing googleEventId)
    await prisma.calendarEvent.updateMany({
      where: { organizationId, googleEventId },
      data: {
        syncStatus: 'FAILED', // Mark as failed since it's deleted
        lastSyncAt: new Date()
      }
    })

    logger.info({ organizationId, googleEventId }, 'Calendar event deleted')

    return { success: true }
  } catch (error: any) {
    logger.error({ error, organizationId, googleEventId }, 'Error deleting calendar event')
    return { success: false, error: error.message }
  }
}
