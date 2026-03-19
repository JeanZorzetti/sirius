/**
 * API Route: /api/whatsapp/media
 *
 * Busca mídia (base64) de uma mensagem WhatsApp via Evolution API
 * GET ?messageId=xxx&connectionId=yyy
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrgEvolutionClient } from '@/lib/evolution-api-client'
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

    // Encontrar a mensagem no banco para pegar o remoteJid
    const message = await prisma.whatsAppMessage.findFirst({
      where: {
        messageId,
        organizationId: user.organizationId,
      },
    })

    if (!message) {
      return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
    }

    // Encontrar a conexão ativa
    const connection = await prisma.whatsAppConnection.findFirst({
      where: {
        organizationId: user.organizationId,
        status: 'CONNECTED',
      },
    })

    if (!connection) {
      return NextResponse.json({ error: 'No active connection' }, { status: 400 })
    }

    const client = await getOrgEvolutionClient(user.organizationId)
    if (!client) {
      return NextResponse.json({ error: 'Evolution API not configured' }, { status: 400 })
    }

    // Verificar se é áudio pela mensagem salva — converter para mp4 para compatibilidade
    const isAudio = message.mediaType === 'audio' ||
      message.text?.startsWith('[Áudio]')

    const media = await client.getBase64FromMediaMessage(
      connection.instanceName,
      messageId,
      isAudio, // convertToMp4 para áudios (ogg/opus não funciona no Safari)
    )

    // Build proper data URI for frontend rendering
    const mimeType = media.mimetype || 'application/octet-stream'
    const dataUri = media.base64.startsWith('data:')
      ? media.base64
      : `data:${mimeType};base64,${media.base64}`

    // Cache the full data URI in the database
    if (media.base64) {
      await prisma.whatsAppMessage.updateMany({
        where: {
          messageId,
          organizationId: user.organizationId,
        },
        data: {
          mediaUrl: dataUri,
        },
      })
    }

    return NextResponse.json({
      base64: dataUri,
      mimetype: media.mimetype,
      mediaType: media.mediaType,
      fileName: media.fileName,
    })
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error fetching media')
    return NextResponse.json(
      { error: 'Falha ao buscar mídia', details: error.message },
      { status: 500 }
    )
  }
}
