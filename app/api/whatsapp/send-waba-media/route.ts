/**
 * POST /api/whatsapp/send-waba-media
 * Send audio/image/video/document via WhatsApp Official API (Meta Cloud API).
 * Accepts multipart/form-data with: file, contactId, [ptt], [duration]
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

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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

    const rawMime = file.type || 'audio/webm'
    const inputMime = rawMime.split(';')[0].trim()
    let audioBuffer = Buffer.from(await file.arrayBuffer())
    let mimeType = inputMime
    let filename = 'audio.ogg'

    // Meta does not accept audio/webm — convert to OGG/Opus via ffmpeg
    if (inputMime === 'audio/webm' || inputMime.startsWith('audio/webm')) {
      try {
        audioBuffer = await convertWebmToOgg(audioBuffer)
        mimeType = 'audio/ogg'
        logger.info({ organizationId: user.organizationId }, 'Converted WebM to OGG for Meta upload')
      } catch (convErr: any) {
        logger.error({ err: convErr.message }, 'ffmpeg conversion failed, sending raw webm')
        // Keep original — will likely fail at Meta but better than crashing
        mimeType = inputMime
        filename = 'audio.webm'
      }
    }

    const blob = new Blob([audioBuffer], { type: mimeType })

    const now = new Date()
    const msgId = `waba_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const durationText = duration > 0 ? `[Áudio ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}]` : '[Áudio]'

    // 1. Upload to Meta servers
    const mediaId = await client.uploadMedia(blob, mimeType, filename)

    // 2. Upload to MinIO for local playback (fallback to base64 data URI if MinIO unavailable)
    let minioKey: string | null = null
    try {
      minioKey = await uploadMedia({
        orgId: user.organizationId,
        contactId: contact.id,
        messageId: msgId,
        buffer: audioBuffer,
        mimetype: mimeType,
        fileName: filename,
      })
    } catch (err: any) {
      logger.error({ err: err.message, stack: err.stack }, 'WABA audio MinIO upload failed — falling back to base64')
      minioKey = `data:${mimeType};base64,${audioBuffer.toString('base64')}`
    }

    // 3. Send via Meta Cloud API
    const phone = normalizePhone(contact.phone)
    const result = await client.sendAudioMessage(phone, mediaId, ptt)
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
        ${durationText},
        'OUTBOUND',
        'SENT',
        ${now},
        true,
        'audio',
        ${minioKey},
        ${null},
        ${null}
      )
      ON CONFLICT ("organizationId", "messageId") DO NOTHING
    `

    logger.info({ contactId, wamid, minioKey, organizationId: user.organizationId }, 'WABA audio sent')

    return NextResponse.json({
      id: msgId,
      text: durationText,
      direction: 'OUTBOUND',
      sentAt: now,
      deliveredAt: null,
      readAt: null,
      status: 'SENT',
      mediaType: 'audio',
      mediaUrl: minioKey,
      replyToId: null,
      replyToText: null,
    })
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error sending WABA media')
    return NextResponse.json({ error: error.message || 'Falha ao enviar mídia' }, { status: 500 })
  }
}
