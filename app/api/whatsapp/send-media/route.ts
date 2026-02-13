/**
 * API Route: /api/whatsapp/send-media
 *
 * Envia mídia (imagem, vídeo, áudio, documento) via WhatsApp
 * Aceita FormData com file + metadata
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrgEvolutionClient } from '@/lib/evolution-api-client'
import logger from '@/lib/logger'

const MAX_FILE_SIZE = 16 * 1024 * 1024 // 16MB (WhatsApp limit)

const MIME_TO_MEDIATYPE: Record<string, 'image' | 'video' | 'audio' | 'document'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/3gpp': 'video',
  'audio/ogg': 'audio',
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/wav': 'audio',
  'audio/webm': 'audio',
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // 3. Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const connectionId = formData.get('connectionId') as string
    const contactId = formData.get('contactId') as string
    const caption = formData.get('caption') as string | null

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
    const connection = await prisma.whatsAppConnection.findFirst({
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

    // 7. Get Evolution client
    const evolutionClient = await getOrgEvolutionClient(user.organizationId)
    if (!evolutionClient) {
      return NextResponse.json({ error: 'Evolution API não está configurada.' }, { status: 400 })
    }

    // 8. Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mediatype = getMediaType(file.type)
    const base64Data = `data:${file.type};base64,${base64}`

    // 9. Send via Evolution API
    const whatsappNumber = evolutionClient.formatPhoneNumber(contact.phone)

    const evolutionResponse = await evolutionClient.sendMediaMessage({
      instanceName: connection.instanceName,
      number: whatsappNumber,
      mediatype,
      media: base64Data,
      caption: caption || undefined,
      fileName: mediatype === 'document' ? file.name : undefined,
    })

    logger.info({
      connectionId: connection.id,
      contactId: contact.id,
      mediatype,
      fileName: file.name,
      fileSize: file.size,
    }, 'WhatsApp media message sent')

    // 10. Save to database
    const messageText = caption
      ? `${getMediaLabel(mediatype)} ${caption}`
      : getMediaLabel(mediatype)

    const savedMessage = await prisma.whatsAppMessage.create({
      data: {
        contactId: contact.id,
        organizationId: user.organizationId,
        remoteJid: whatsappNumber,
        messageId: evolutionResponse.key.id,
        text: messageText,
        direction: 'OUTBOUND',
        status: 'SENT',
        mediaUrl: base64Data,
        mediaType: mediatype,
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
