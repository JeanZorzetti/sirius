/**
 * API Route: /api/whatsapp/send-media
 *
 * Envia mídia (imagem, vídeo, áudio, documento) via Whatsmeow Gateway.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import { normalizePhoneNumber } from '@/lib/whatsapp-sync'
import { uploadMedia } from '@/lib/storage'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const MAX_FILE_SIZE = 16 * 1024 * 1024 // 16MB (WhatsApp limit)

const MIME_TO_MEDIATYPE: Record<string, 'image' | 'video' | 'audio' | 'document'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/3gpp': 'video',
  'audio/ogg': 'audio',
  'audio/ogg;codecs=opus': 'audio',
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/wav': 'audio',
  'audio/webm': 'audio',
  'audio/webm;codecs=opus': 'audio',
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'text/plain': 'document',
}

function getMediaType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  return MIME_TO_MEDIATYPE[mimeType] || 'document'
}

function getMediaLabel(mediatype: string): string {
  const labels: Record<string, string> = {
    image: '[Imagem]',
    video: '[Vídeo]',
    audio: '[Áudio]',
    document: '[Documento]',
  }
  return labels[mediatype] || '[Arquivo]'
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    // 2. Get user organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    // 3. Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const connectionId = formData.get('connectionId') as string
    const contactId = formData.get('contactId') as string
    const caption = formData.get('caption') as string | null
    const ptt = formData.get('ptt') === 'true'
    const durationSec = parseInt(formData.get('duration') as string || '0', 10) || 0

    if (!file || !connectionId || !contactId) {
      return NextResponse.json(
        { error: 'file, connectionId, and contactId are required' },
        { status: 400 }
      )
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 16MB.' },
        { status: 400 }
      )
    }

    // 5. Verify connection
    const connection = await prismaWa.whatsAppConnection.findFirst({
      where: {
        id: connectionId,
        organizationId: user.organizationId,
        status: 'CONNECTED',
      },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found or not active' }, { status: 404 })
    }

    // 6. Get contact
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId: user.organizationId,
      },
    })

    if (!contact?.phone) {
      return NextResponse.json({ error: 'Contact not found or has no phone' }, { status: 404 })
    }

    // 7. Send via Whatsmeow Gateway
    const phoneNumber = normalizePhoneNumber(contact.phone)
    const remoteJid = phoneNumber
    const mediatype = getMediaType(file.type)
    const arrayBuffer = await file.arrayBuffer()

    const res = await whatsmeowClient.sendMedia(
      connection.instanceName,
      phoneNumber,
      Buffer.from(arrayBuffer),
      file.type,
      caption || undefined,
      file.name,
      ptt
    )
    const messageId = res.messageId

    logger.info({
      connectionId: connection.id,
      contactId: contact.id,
      mediatype,
      fileName: file.name,
      fileSize: file.size,
      provider: 'whatsmeow',
    }, 'WhatsApp media message sent')

    // 8. Upload to MinIO for persistent storage
    let mediaUrlKey: string | null = null
    try {
      mediaUrlKey = await uploadMedia({
        orgId: user.organizationId,
        contactId: contact.id,
        messageId,
        buffer: Buffer.from(arrayBuffer),
        mimetype: file.type,
        fileName: file.name,
      })
    } catch (err) {
      logger.warn({ err, messageId }, 'MinIO upload failed for sent media')
    }

    // 9. Save to database
    function fmtDur(s: number) {
      const m = Math.floor(s / 60), sec = s % 60
      return `${m}:${sec.toString().padStart(2, '0')}`
    }
    const audioLabel = ptt && durationSec > 0
      ? `[Áudio ${fmtDur(durationSec)}]`
      : getMediaLabel(mediatype)
    const messageText = caption ? `${audioLabel} ${caption}` : audioLabel

    const savedMessage = await prismaWa.whatsAppMessage.create({
      data: {
        contactId: contact.id,
        organizationId: user.organizationId,
        connectionId: connection.id,
        remoteJid,
        messageId,
        text: messageText,
        direction: 'OUTBOUND',
        status: 'SENT',
        mediaType: mediatype,
        mediaUrl: mediaUrlKey,
        sentAt: new Date(),
      },
      select: {
        id: true,
        text: true,
        direction: true,
        sentAt: true,
        status: true,
        mediaUrl: true,
        mediaType: true,
      },
    })

    return NextResponse.json(savedMessage)
  } catch (error) {
    logger.error({ err: error }, 'Error sending WhatsApp media')
    return NextResponse.json({ error: 'Failed to send media' }, { status: 500 })
  }
}
