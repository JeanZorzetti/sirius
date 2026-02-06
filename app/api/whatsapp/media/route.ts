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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
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
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
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

    const media = await client.getBase64FromMediaMessage(
      connection.instanceName,
      messageId,
    )

    // Atualizar mediaUrl no banco com o base64 para cache
    if (media.base64) {
      await prisma.whatsAppMessage.updateMany({
        where: {
          messageId,
          organizationId: user.organizationId,
        },
        data: {
          mediaUrl: media.base64,
        },
      })
    }

    return NextResponse.json({
      base64: media.base64,
      mimetype: media.mimetype,
      mediaType: media.mediaType,
      fileName: media.fileName,
    })
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error fetching media')
    return NextResponse.json(
      { error: 'Failed to fetch media', details: error.message },
      { status: 500 }
    )
  }
}
