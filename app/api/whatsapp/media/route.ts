/**
 * API Route: /api/whatsapp/media
 *
 * Serves WhatsApp media. Resolution order:
 * 1. MinIO key (new format) → pre-signed URL or stream
 * 2. Base64 data URI (legacy cached) → migrate to MinIO, return
 * 3. Not cached → download from gateway → upload to MinIO → return
 *
 * GET ?messageId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import { uploadBase64, getMediaUrl, isMinioKey } from '@/lib/storage'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function GET(req: NextRequest) {
  try {
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

    const messageId = req.nextUrl.searchParams.get('messageId')
    if (!messageId) {
      return NextResponse.json({ error: 'messageId required' }, { status: 400 })
    }

    const message = await prismaWa.whatsAppMessage.findFirst({
      where: { messageId, organizationId: user.organizationId },
    })

    if (!message) {
      return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
    }

    // 1. MinIO key — return pre-signed URL
    if (message.mediaUrl && isMinioKey(message.mediaUrl)) {
      const url = await getMediaUrl(message.mediaUrl)
      logger.info({ messageId, key: message.mediaUrl, url: url.substring(0, 80) }, 'media: returning presigned URL')
      return NextResponse.json({ url, mimetype: message.mediaType || 'application/octet-stream' })
    }

    // 2. Legacy base64 in DB — migrate to MinIO, then return
    if (message.mediaUrl?.startsWith('data:')) {
      try {
        const key = await uploadBase64({
          orgId: user.organizationId,
          contactId: message.contactId,
          messageId: message.messageId || message.id,
          base64Data: message.mediaUrl,
        })
        // Update DB to point to MinIO key
        await prismaWa.whatsAppMessage.updateMany({
          where: { messageId, organizationId: user.organizationId },
          data: { mediaUrl: key },
        })
        const url = await getMediaUrl(key)
        return NextResponse.json({ url, mimetype: message.mediaType || 'application/octet-stream' })
      } catch (err) {
        // Fallback: return base64 directly if MinIO upload fails
        logger.warn({ err, messageId }, 'Failed to migrate base64 to MinIO, returning base64')
        return NextResponse.json({
          base64: message.mediaUrl,
          mimetype: message.mediaType || 'application/octet-stream',
        })
      }
    }

    // 3. Not cached — WABA messages (connectionId=null) have no gateway to fetch from
    if (!message.connectionId) {
      logger.warn({ messageId, organizationId: user.organizationId }, 'WABA media not cached yet')
      return NextResponse.json({ error: 'Mídia ainda sendo processada. Tente novamente em instantes.' }, { status: 404 })
    }

    // 3. Not cached — download from gateway, upload to MinIO
    const connection = await prismaWa.whatsAppConnection.findFirst({
      where: { organizationId: user.organizationId, status: 'CONNECTED' },
    })

    if (!connection) {
      return NextResponse.json({ error: 'No active connection' }, { status: 400 })
    }

    try {
      const result = await whatsmeowClient.downloadMedia(
        connection.instanceName,
        messageId,
        message.remoteJid || '',
      )

      const mimeType = result.mimetype || 'application/octet-stream'
      const base64Data = result.base64.startsWith('data:')
        ? result.base64
        : `data:${mimeType};base64,${result.base64}`

      // Try to upload to MinIO
      try {
        const key = await uploadBase64({
          orgId: user.organizationId,
          contactId: message.contactId,
          messageId: message.messageId || message.id,
          base64Data,
        })
        await prismaWa.whatsAppMessage.updateMany({
          where: { messageId, organizationId: user.organizationId },
          data: { mediaUrl: key },
        })
        const url = await getMediaUrl(key)
        return NextResponse.json({ url, mimetype: mimeType })
      } catch (uploadErr) {
        // Fallback: cache as base64 in DB (old behavior)
        logger.warn({ err: uploadErr, messageId }, 'MinIO upload failed, caching as base64')
        await prismaWa.whatsAppMessage.updateMany({
          where: { messageId, organizationId: user.organizationId },
          data: { mediaUrl: base64Data },
        })
        return NextResponse.json({ base64: base64Data, mimetype: mimeType })
      }
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
