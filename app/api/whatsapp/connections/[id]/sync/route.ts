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

    // Whatsmeow: request on-demand history sync via gateway
    if (isWhatsmeow(connection)) {
      try {
        await whatsmeowClient.requestSync(connection.instanceName)
        logger.info({ connectionId: id, instanceName: connection.instanceName }, 'Whatsmeow: on-demand sync requested')
        return NextResponse.json({
          success: true,
          provider: 'whatsmeow',
          message: 'History sync requested. Messages will arrive via webhook.',
        })
      } catch (err: any) {
        logger.error({ error: err.message }, 'Whatsmeow sync request failed')
        return NextResponse.json({
          success: false,
          provider: 'whatsmeow',
          message: 'Sync request failed: ' + err.message,
        }, { status: 500 })
      }
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
