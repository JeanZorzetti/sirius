import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logGoogleCalendarActivity } from '@/lib/integrations/google-calendar-client'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * Disconnect Google Calendar integration
 * POST /api/integrations/google-calendar/settings
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user || !user.organization) {
      return await apiError(ERR.USER_NOT_FOUND, 404)
    }

    // Parse request body
    const { organizationId, action } = await request.json()

    // Validate organization ownership
    if (organizationId !== user.organizationId) {
      return await apiError(ERR.FORBIDDEN, 403)
    }

    // Handle disconnect action
    if (action === 'disconnect') {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          googleCalendarEnabled: false,
          googleCalendarRefreshToken: null,
          googleCalendarEmail: null
        }
      })

      // Log disconnection
      await logGoogleCalendarActivity(
        organizationId,
        'oauth_disconnect',
        'SUCCESS',
        { action: 'disconnect' },
        { disconnected: true }
      )

      logger.info({ organizationId }, 'Google Calendar disconnected')

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    )
  } catch (error: any) {
    logger.error({ error }, 'Error updating Google Calendar settings')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
