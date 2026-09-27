import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  exchangeCodeForTokens,
  GoogleCalendarClient,
  logGoogleCalendarActivity
} from '@/lib/integrations/google-calendar-client'
import { encrypt, decrypt } from '@/lib/encryption'
import { podeVerTudo } from '@/lib/visibilidade'
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

    // /auth encrypts the state (AES-GCM): one made by hand, or older than 10 minutes, is refused
    let organizationId: string
    let userId: string
    try {
      const decoded = JSON.parse(decrypt(state))
      if (!(decoded.exp > Date.now())) throw new Error('expired')
      organizationId = decoded.organizationId
      userId = decoded.userId
    } catch {
      logger.warn('Google Calendar OAuth: invalid or expired state')
      return redirectTo('/dashboard/settings/integrations/google-calendar?error=invalid_state')
    }

    // Whoever started the flow must still be an owner or manager of that account when Google sends them back
    // isolamento: the user named by the state this server encrypted, checked against the account in the same state
    const quem = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true, orgRole: true } })
    if (!quem || quem.organizationId !== organizationId || !podeVerTudo(quem)) {
      return redirectTo('/dashboard/settings/integrations/google-calendar?error=forbidden')
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
