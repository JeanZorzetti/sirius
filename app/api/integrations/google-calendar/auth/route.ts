import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGoogleCalendarAuthUrl } from '@/lib/integrations/google-calendar-client'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * Initiate Google Calendar OAuth 2.0 flow
 * GET /api/integrations/google-calendar/auth
 */
export async function GET(request: Request) {
  try {
    // Authenticate user
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user || !user.organization) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Create state parameter with organization ID
    // This will be returned in the callback to identify the user
    const state = Buffer.from(
      JSON.stringify({
        organizationId: user.organizationId,
        userId: user.id
      })
    ).toString('base64')

    // Generate authorization URL
    const authUrl = getGoogleCalendarAuthUrl(state)

    logger.info({
      organizationId: user.organizationId,
      userId: user.id
    }, 'Initiating Google Calendar OAuth flow')

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    logger.error({ error }, 'Error initiating Google Calendar auth')
    return await apiError(ERR.GOOGLE_CALENDAR_AUTH, 500)
  }
}
