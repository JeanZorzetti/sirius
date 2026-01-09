/**
 * Google Calendar Integration Client
 *
 * Provides methods to interact with Google Calendar API:
 * - OAuth 2.0 authentication
 * - Create, update, delete calendar events
 * - List events
 * - Sync events bidirectionally
 */

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'
import logger from '@/lib/logger'

// OAuth 2.0 configuration
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
]

interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime: string // ISO 8601 format
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export class GoogleCalendarClient {
  private oauth2Client: OAuth2Client
  private calendar: any

  constructor(refreshToken: string) {
    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI
    )

    // Set refresh token
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken
    })

    // Initialize Calendar API
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  /**
   * Create a new calendar event
   */
  async createEvent(event: CalendarEvent): Promise<{ id: string; htmlLink: string }> {
    try {
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      })

      logger.info({
        eventId: response.data.id,
        summary: event.summary
      }, 'Google Calendar event created')

      return {
        id: response.data.id!,
        htmlLink: response.data.htmlLink!
      }
    } catch (error: any) {
      logger.error({
        error,
        event
      }, 'Error creating Google Calendar event')
      throw new Error(`Failed to create calendar event: ${error.message}`)
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    try {
      await this.calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: event
      })

      logger.info({ eventId }, 'Google Calendar event updated')
    } catch (error: any) {
      logger.error({
        error,
        eventId,
        event
      }, 'Error updating Google Calendar event')
      throw new Error(`Failed to update calendar event: ${error.message}`)
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId
      })

      logger.info({ eventId }, 'Google Calendar event deleted')
    } catch (error: any) {
      logger.error({
        error,
        eventId
      }, 'Error deleting Google Calendar event')
      throw new Error(`Failed to delete calendar event: ${error.message}`)
    }
  }

  /**
   * List calendar events
   */
  async listEvents(params: {
    timeMin?: string // ISO 8601
    timeMax?: string // ISO 8601
    maxResults?: number
    q?: string // Search query
  } = {}): Promise<Array<any>> {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: params.timeMin || new Date().toISOString(),
        timeMax: params.timeMax,
        maxResults: params.maxResults || 100,
        singleEvents: true,
        orderBy: 'startTime',
        q: params.q
      })

      return response.data.items || []
    } catch (error: any) {
      logger.error({
        error,
        params
      }, 'Error listing Google Calendar events')
      throw new Error(`Failed to list calendar events: ${error.message}`)
    }
  }

  /**
   * Get user's primary calendar info
   */
  async getCalendarInfo(): Promise<{ email: string; summary: string }> {
    try {
      const response = await this.calendar.calendars.get({
        calendarId: 'primary'
      })

      return {
        email: response.data.id!,
        summary: response.data.summary!
      }
    } catch (error: any) {
      logger.error({ error }, 'Error getting calendar info')
      throw new Error(`Failed to get calendar info: ${error.message}`)
    }
  }

  /**
   * Test connection to Google Calendar
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getCalendarInfo()
      return { success: true }
    } catch (error: any) {
      logger.error({ error }, 'Google Calendar connection test failed')
      return {
        success: false,
        error: error.message || 'Failed to connect to Google Calendar'
      }
    }
  }
}

/**
 * Get Google Calendar client for an organization
 */
export async function getGoogleCalendarClient(
  organizationId: string
): Promise<GoogleCalendarClient | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      googleCalendarEnabled: true,
      googleCalendarRefreshToken: true
    }
  })

  if (!org || !org.googleCalendarEnabled || !org.googleCalendarRefreshToken) {
    return null
  }

  try {
    const refreshToken = decrypt(org.googleCalendarRefreshToken)
    return new GoogleCalendarClient(refreshToken)
  } catch (error) {
    logger.error({
      error,
      organizationId
    }, 'Failed to create Google Calendar client')
    return null
  }
}

/**
 * Generate OAuth 2.0 authorization URL
 */
export function getGoogleCalendarAuthUrl(state: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  )

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh token
    scope: GOOGLE_CALENDAR_SCOPES,
    state, // Pass organization ID and user ID
    prompt: 'consent' // Force consent screen to get refresh token
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  refreshToken: string
  accessToken: string
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  )

  try {
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.refresh_token) {
      throw new Error('No refresh token received from Google')
    }

    return {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token!
    }
  } catch (error: any) {
    logger.error({ error }, 'Failed to exchange code for tokens')
    throw new Error(`OAuth token exchange failed: ${error.message}`)
  }
}

/**
 * Log Google Calendar activity
 */
export async function logGoogleCalendarActivity(
  organizationId: string,
  action: string,
  status: 'SUCCESS' | 'FAILED' | 'PENDING',
  request: any,
  response: any | null = null,
  errorMessage: string | null = null
): Promise<void> {
  await prisma.integrationLog.create({
    data: {
      organizationId,
      type: 'GOOGLE_CALENDAR',
      action,
      status,
      request,
      response,
      errorMessage,
      attemptCount: 1
    }
  })
}
