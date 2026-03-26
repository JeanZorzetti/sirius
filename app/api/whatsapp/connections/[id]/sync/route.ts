/**
 * API Route: /api/whatsapp/connections/[id]/sync
 *
 * Sincroniza conversas existentes do Evolution API para o banco local.
 * Agora delega para lib/whatsapp-sync.ts (lógica compartilhada com auto-sync e cron).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncConnectionHistory } from '@/lib/whatsapp-sync'
import logger from '@/lib/logger'

export const maxDuration = 120

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

    // Verify connection belongs to user's org
    const connection = await prisma.whatsAppConnection.findFirst({
      where: { id, organizationId: user.organizationId },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 })
    }

    if (connection.status !== 'CONNECTED') {
      return NextResponse.json({ error: 'Connection is not active' }, { status: 400 })
    }

    const result = await syncConnectionHistory(id)

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Error syncing WhatsApp chats')
    return NextResponse.json({ error: 'Failed to sync chats' }, { status: 500 })
  }
}
