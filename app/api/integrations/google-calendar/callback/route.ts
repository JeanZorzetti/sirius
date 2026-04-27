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
function redirectTo(path: string) {
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? 'https://siriuscrm.com.br'
  return NextResponse.redirect(`${base}${path}`)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      logger.warn({ error }, 'Google Calendar OAuth error')
      return redirectTo('/dashboard/settings/integrations/google-calendar?error=access_denied')
    }

    if (!code || !state) {
      return redirectTo('/dashboard/settings/integrations/google-calendar?error=invalid_request')
    }

    let organizationId: string
    let userId: string
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
      organizationId = decoded.organizationId
      userId = decoded.userId
    } catch {
      logger.error({ state }, 'Invalid state parameter')
      return redirectTo('/dashboard/settings/integrations/google-calendar?error=invalid_state')
    }

    const { refreshToken } = await exchangeCodeForTokens(code)

    const client = new GoogleCalendarClient(refreshToken)
    const calendarInfo = await client.getCalendarInfo()

    const encryptedRefreshToken = encrypt(refreshToken)

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        googleCalendarEnabled: true,
        googleCalendarRefreshToken: encryptedRefreshToken,
        googleCalendarEmail: calendarInfo.email
      }
    })

    await logGoogleCalendarActivity(
      organizationId,
      'oauth_connect',
      'SUCCESS',
      { email: calendarInfo.email },
      { connected: true }
    )

    logger.info({ organizationId, email: calendarInfo.email }, 'Google Calendar connected successfully')

    return redirectTo('/dashboard/settings/integrations/google-calendar?success=true')
  } catch (error: any) {
    logger.error({ error }, 'Error in Google Calendar OAuth callback')
    return redirectTo('/dashboard/settings/integrations/google-calendar?error=connection_failed')
  }
}
