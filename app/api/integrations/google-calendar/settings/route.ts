import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logGoogleCalendarActivity } from '@/lib/integrations/google-calendar-client'
import logger from '@/lib/logger'

/**
 * Disconnect Google Calendar integration
 * POST /api/integrations/google-calendar/settings
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user || !user.organization) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Parse request body
    const { organizationId, action } = await request.json()

    // Validate organization ownership
    if (organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
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
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}
