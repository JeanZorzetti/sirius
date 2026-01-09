import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  exchangeCodeForTokens,
  GoogleCalendarClient,
  logGoogleCalendarActivity
} from '@/lib/integrations/google-calendar-client'
import { encrypt } from '@/lib/encryption'
import logger from '@/lib/logger'

/**
 * Google Calendar OAuth 2.0 callback
 * GET /api/integrations/google-calendar/callback?code=xxx&state=xxx
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors (user denied access)
    if (error) {
      logger.warn({ error }, 'Google Calendar OAuth error')
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/integrations/google-calendar?error=access_denied',
          request.url
        )
      )
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/integrations/google-calendar?error=invalid_request',
          request.url
        )
      )
    }

    // Decode state parameter
    let organizationId: string
    let userId: string
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
      organizationId = decoded.organizationId
      userId = decoded.userId
    } catch {
      logger.error({ state }, 'Invalid state parameter')
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/integrations/google-calendar?error=invalid_state',
          request.url
        )
      )
    }

    // Exchange authorization code for tokens
    const { refreshToken, accessToken } = await exchangeCodeForTokens(code)

    // Get user's calendar info (email)
    const client = new GoogleCalendarClient(refreshToken)
    const calendarInfo = await client.getCalendarInfo()

    // Encrypt and store refresh token
    const encryptedRefreshToken = encrypt(refreshToken)

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        googleCalendarEnabled: true,
        googleCalendarRefreshToken: encryptedRefreshToken,
        googleCalendarEmail: calendarInfo.email
      }
    })

    // Log successful connection
    await logGoogleCalendarActivity(
      organizationId,
      'oauth_connect',
      'SUCCESS',
      { email: calendarInfo.email },
      { connected: true }
    )

    logger.info({
      organizationId,
      email: calendarInfo.email
    }, 'Google Calendar connected successfully')

    // Redirect back to settings page with success message
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/integrations/google-calendar?success=true',
        request.url
      )
    )
  } catch (error: any) {
    logger.error({ error }, 'Error in Google Calendar OAuth callback')
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/integrations/google-calendar?error=connection_failed',
        request.url
      )
    )
  }
}
