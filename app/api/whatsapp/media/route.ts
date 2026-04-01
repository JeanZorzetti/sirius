/**
 * API Route: /api/whatsapp/media
 *
 * Busca mídia (base64) de uma mensagem WhatsApp
 * GET ?messageId=xxx
 *
 * Dual-provider:
 * - Whatsmeow: POST /api/instances/:id/messages/download
 * - Evolution: getBase64FromMediaMessage (legacy)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isWhatsmeow } from '@/lib/whatsapp-provider'
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
    const message = await prisma.whatsAppMessage.findFirst({
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
    const connection = await prisma.whatsAppConnection.findFirst({
      where: { organizationId: user.organizationId, status: 'CONNECTED' },
    })

    if (!connection) {
      return NextResponse.json({ error: 'No active connection' }, { status: 400 })
    }

    // Whatsmeow provider
    if (isWhatsmeow(connection)) {
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
        await prisma.whatsAppMessage.updateMany({
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
    }

    // Evolution provider (legacy)
    try {
      const { getOrgEvolutionClient } = await import('@/lib/evolution-api-client')
      const client = await getOrgEvolutionClient(user.organizationId)
      if (!client) {
        return NextResponse.json({ error: 'Evolution API not configured' }, { status: 400 })
      }

      const isAudio = message.mediaType === 'audio' || message.text?.startsWith('[Áudio]')

      const media = await client.getBase64FromMediaMessage(
        connection.instanceName,
        messageId,
        isAudio,
      )

      const mimeType = media.mimetype || 'application/octet-stream'
      const dataUri = media.base64.startsWith('data:')
        ? media.base64
        : `data:${mimeType};base64,${media.base64}`

      // Cache in DB
      if (media.base64) {
        await prisma.whatsAppMessage.updateMany({
          where: { messageId, organizationId: user.organizationId },
          data: { mediaUrl: dataUri },
        })
      }

      return NextResponse.json({
        base64: dataUri,
        mimetype: media.mimetype,
        mediaType: media.mediaType,
        fileName: media.fileName,
      })
    } catch (error: any) {
      logger.error({ error: error.message }, 'Evolution media fetch failed')
      return NextResponse.json(
        { error: 'Falha ao buscar mídia', details: error.message },
        { status: 500 }
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
