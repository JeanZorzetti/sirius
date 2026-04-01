/**
 * API Route: /api/whatsapp/connections/[id]/sync
 *
 * Sincroniza conversas do WhatsApp para o banco local.
 * - Whatsmeow: solicita history sync on-demand via gateway
 * - Evolution: delega para lib/whatsapp-sync.ts (legado)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isWhatsmeow } from '@/lib/whatsapp-provider'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import logger from '@/lib/logger'

export const maxDuration = 300

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const connection = await prisma.whatsAppConnection.findFirst({
      where: { id, organizationId: user.organizationId },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 })
    }

    if (connection.status !== 'CONNECTED') {
      return NextResponse.json({ error: 'Connection is not active' }, { status: 400 })
    }

    // Whatsmeow: history sync is automatic on connect via webhook events.
    // This endpoint is a no-op for whatsmeow — just return success.
    // Optionally try on-demand sync but don't fail if gateway is unavailable.
    if (isWhatsmeow(connection)) {
      try {
        await whatsmeowClient.requestSync(connection.instanceName)
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
    }

    // Evolution: legacy sync
    const { syncConnectionHistory } = await import('@/lib/whatsapp-sync')
    const result = await syncConnectionHistory(id)
    return NextResponse.json(result)
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Error syncing WhatsApp chats')
    return NextResponse.json({ error: 'Failed to sync chats' }, { status: 500 })
  }
}
