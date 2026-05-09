/**
 * API Route: /api/whatsapp/connections/[id]/sync
 *
 * Sincroniza conversas do WhatsApp via Whatsmeow Gateway.
 * History sync é automático ao conectar via webhook events.
 * Este endpoint permite disparar um sync on-demand.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export const maxDuration = 300

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404, { req })
    }

    const connection = await prismaWa.whatsAppConnection.findFirst({
      where: { id, organizationId: user.organizationId },
    })

    if (!connection) {
      return await apiError(ERR.CONNECTION_NOT_FOUND, 404, { req })
    }

    if (connection.status !== 'CONNECTED') {
      return NextResponse.json({ error: 'Connection is not active' }, { status: 400 })
    }

    // Whatsmeow: history sync is automatic on connect via webhook events.
    // This endpoint triggers an on-demand sync (best-effort).
    try {
      // Request 500 messages to cover at least 24h of history for active numbers.
      await whatsmeowClient.requestSync(connection.instanceName, 500)
      logger.info({ connectionId: id, instanceName: connection.instanceName }, 'Whatsmeow: on-demand sync requested')
    } catch (err: any) {
      // Best-effort — history sync already happens automatically
      logger.debug({ error: err.message }, 'Whatsmeow on-demand sync skipped (not critical)')
    }

    return NextResponse.json({
      success: true,
      provider: 'whatsmeow',
      message: 'History sync is automatic for whatsmeow connections.',
    })
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Error syncing WhatsApp chats')
    return NextResponse.json({ error: 'Failed to sync chats' }, { status: 500 })
  }
}
