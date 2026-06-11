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

    // O gateway QR (whatsmeow) foi descontinuado — não há sync sob demanda.
    return NextResponse.json(
      { error: 'Sincronização via conexão QR foi descontinuada.' },
      { status: 410 }
    )
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Error syncing WhatsApp chats')
    return NextResponse.json({ error: 'Failed to sync chats' }, { status: 500 })
  }
}
