/**
 * API Route: /api/whatsapp/media
 *
 * Busca mídia (base64) de uma mensagem WhatsApp via Whatsmeow Gateway
 * GET ?messageId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import logger from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
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

    const messageId = req.nextUrl.searchParams.get('messageId')
    if (!messageId) {
      return NextResponse.json({ error: 'messageId required' }, { status: 400 })
    }

    // Find message in DB
    const message = await prismaWa.whatsAppMessage.findFirst({
      where: { messageId, organizationId: user.organizationId },
    })

    if (!message) {
      return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
    }

    // If already cached as data URI, return it
    if (message.mediaUrl?.startsWith('data:')) {
      return NextResponse.json({
        base64: message.mediaUrl,
        mimetype: message.mediaType || 'application/octet-stream',
      })
    }

    // Find active connection
    const connection = await prismaWa.whatsAppConnection.findFirst({
      where: { organizationId: user.organizationId, status: 'CONNECTED' },
    })

    if (!connection) {
      return NextResponse.json({ error: 'No active connection' }, { status: 400 })
    }

    // Download via Whatsmeow Gateway
    try {
      const result = await whatsmeowClient.downloadMedia(
        connection.instanceName,
        messageId,
        message.remoteJid || '',
      )

      const mimeType = result.mimetype || 'application/octet-stream'
      const dataUri = result.base64.startsWith('data:')
        ? result.base64
        : `data:${mimeType};base64,${result.base64}`

      // Cache in DB
      await prismaWa.whatsAppMessage.updateMany({
        where: { messageId, organizationId: user.organizationId },
        data: { mediaUrl: dataUri },
      })

      return NextResponse.json({ base64: dataUri, mimetype: mimeType })
    } catch (err: any) {
      logger.error({ error: err.message, messageId }, 'Whatsmeow media download failed')
      return NextResponse.json(
        { error: 'Mídia não disponível', details: err.message },
        { status: 404 }
      )
    }
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error fetching media')
    return NextResponse.json(
      { error: 'Falha ao buscar mídia', details: error.message },
      { status: 500 }
    )
  }
}
