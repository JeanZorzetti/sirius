/**
 * POST /api/whatsapp/send-waba-media
 * Send audio/image/document via WhatsApp Official API (Meta Cloud API).
 * Accepts multipart/form-data with: file, contactId, [caption], [ptt], [duration]
 */
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { getWhatsAppOfficialClient, normalizePhone } from '@/lib/integrations/whatsapp-official-client'
import { uploadMedia } from '@/lib/storage'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const execAsync = promisify(exec)

/**
 * Convert WebM/Opus audio to OGG/Opus using ffmpeg.
 * Meta accepts audio/ogg but not audio/webm.
 */
async function convertWebmToOgg(inputBuffer: Buffer): Promise<Buffer> {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const inputPath = join(tmpdir(), `wa_in_${id}.webm`)
  const outputPath = join(tmpdir(), `wa_out_${id}.ogg`)
  try {
    await writeFile(inputPath, inputBuffer)
    await execAsync(`ffmpeg -y -i "${inputPath}" -c:a libopus -b:a 64k "${outputPath}"`)
    return await readFile(outputPath)
  } finally {
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})
  }
}

function getMediaCategory(mimeType: string): 'audio' | 'image' | 'document' {
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('image/')) return 'image'
  return 'document'
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const contactId = formData.get('contactId') as string | null
    const caption = (formData.get('caption') as string | null) || undefined
    const ptt = formData.get('ptt') === 'true'
    const duration = parseInt(formData.get('duration') as string || '0', 10)

    if (!file || !contactId) {
      return NextResponse.json({ error: 'file and contactId are required' }, { status: 400 })
    }

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId: user.organizationId },
      select: { id: true, phone: true },
    })

    if (!contact?.phone) {
      return NextResponse.json({ error: 'Contato não encontrado ou sem telefone' }, { status: 404 })
    }

    const client = await getWhatsAppOfficialClient(user.organizationId)
    if (!client) {
      return NextResponse.json({ error: 'WABA não configurado para esta organização' }, { status: 400 })
    }

    const rawMime = file.type || 'application/octet-stream'
    const inputMime = rawMime.split(';')[0].trim()
    let fileBuffer = Buffer.from(await file.arrayBuffer())
    let mimeType = inputMime
    let filename = file.name || 'file'

    // Meta does not accept audio/webm — convert to OGG/Opus via ffmpeg
    if (inputMime === 'audio/webm' || inputMime.startsWith('audio/webm')) {
      try {
        fileBuffer = await convertWebmToOgg(fileBuffer)
        mimeType = 'audio/ogg'
        filename = 'audio.ogg'
        logger.info({ organizationId: user.organizationId }, 'Converted WebM to OGG for Meta upload')
      } catch (convErr: any) {
        logger.error({ err: convErr.message }, 'ffmpeg conversion failed')
        return NextResponse.json({ error: 'Falha ao converter áudio' }, { status: 500 })
      }
    }

    const mediaCategory = getMediaCategory(mimeType)
    const blob = new Blob([fileBuffer], { type: mimeType })

    const now = new Date()
    const msgId = `waba_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    let messageText: string
    if (mediaCategory === 'audio') {
      messageText = duration > 0
        ? `[Áudio ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}]`
        : '[Áudio]'
    } else if (mediaCategory === 'image') {
      messageText = caption ? `[Imagem] ${caption}` : '[Imagem]'
    } else {
      messageText = caption ? `[Documento] ${filename} ${caption}` : `[Documento] ${filename}`
    }

    // 1. Upload to Meta servers
    const mediaId = await client.uploadMedia(blob, mimeType, filename)

    // 2. Upload to MinIO for local playback
    let minioKey: string | null = null
    try {
      minioKey = await uploadMedia({
        orgId: user.organizationId,
        contactId: contact.id,
        messageId: msgId,
        buffer: fileBuffer,
        mimetype: mimeType,
        fileName: filename,
      })
    } catch (err: any) {
      logger.error({ err: err.message }, 'WABA media MinIO upload failed — falling back to base64')
      minioKey = `data:${mimeType};base64,${fileBuffer.toString('base64')}`
    }

    // 3. Send via Meta Cloud API
    const phone = normalizePhone(contact.phone)
    let result
    if (mediaCategory === 'audio') {
      result = await client.sendAudioMessage(phone, mediaId, ptt)
    } else if (mediaCategory === 'image') {
      result = await client.sendImageMessage(phone, mediaId, caption)
    } else {
      result = await client.sendDocumentMessage(phone, mediaId, filename, caption)
    }
    const wamid = result.messages?.[0]?.id ?? null

    await prismaWa.$executeRaw`
      INSERT INTO "WhatsAppMessage"
        (id, "contactId", "organizationId", "connectionId", "remoteJid",
         "messageId", text, direction, status, "sentAt", "isRead",
         "mediaType", "mediaUrl", "replyToId", "replyToText")
      VALUES (
        ${msgId},
        ${contact.id},
        ${user.organizationId},
        ${null},
        ${phone},
        ${wamid},
        ${messageText},
        'OUTBOUND',
        'SENT',
        ${now},
        true,
        ${mediaCategory},
        ${minioKey},
        ${null},
        ${null}
      )
      ON CONFLICT ("organizationId", "messageId") DO NOTHING
    `

    logger.info({ contactId, wamid, minioKey, mediaCategory, organizationId: user.organizationId }, 'WABA media sent')

    return NextResponse.json({
      id: msgId,
      text: messageText,
      direction: 'OUTBOUND',
      sentAt: now,
      deliveredAt: null,
      readAt: null,
      status: 'SENT',
      mediaType: mediaCategory,
      mediaUrl: minioKey,
      replyToId: null,
      replyToText: null,
    })
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error sending WABA media')
    return NextResponse.json({ error: error.message || 'Falha ao enviar mídia' }, { status: 500 })
  }
}
