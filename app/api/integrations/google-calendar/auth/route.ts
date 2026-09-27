import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGoogleCalendarAuthUrl } from '@/lib/integrations/google-calendar-client'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'
import { encrypt } from '@/lib/encryption'
import { podeVerTudo } from '@/lib/visibilidade'

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

    // The account's calendar is an account-wide setting: owner and manager only
    if (!podeVerTudo(user)) {
      return NextResponse.redirect(new URL('/dashboard/settings/integrations/google-calendar?error=forbidden', request.url))
    }

    // Encrypted with AES-GCM so the callback can trust it: a hand-made state fails to decrypt, and it expires in 10 minutes
    const state = encrypt(
      JSON.stringify({
        organizationId: user.organizationId,
        userId: user.id,
        exp: Date.now() + 10 * 60_000
      })
    )

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
