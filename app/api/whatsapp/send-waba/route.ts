/**
 * POST /api/whatsapp/send-waba
 * Send a text message via WhatsApp Official API (Meta Cloud API / WABA).
 * Used when the org has wabaEnabled=true and no Evolution connection.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { getWhatsAppOfficialClient, normalizePhone } from '@/lib/integrations/whatsapp-official-client'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

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

    const body = await req.json()
    const { contactId, message, replyToId } = body

    if (!contactId || !message) {
      return NextResponse.json({ error: 'contactId and message are required' }, { status: 400 })
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

    const phone = normalizePhone(contact.phone)
    const result = await client.sendTextMessage(phone, message)

    const wamid = result.messages?.[0]?.id ?? null
    const now = new Date()
    const msgId = `waba_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Save to WA DB with connectionId=null (WABA marker)
    await prismaWa.$executeRaw`
      INSERT INTO "WhatsAppMessage"
        (id, "contactId", "organizationId", "connectionId", "remoteJid",
         "messageId", text, direction, status, "sentAt", "isRead",
         "replyToId", "replyToText")
      VALUES (
        ${msgId},
        ${contact.id},
        ${user.organizationId},
        ${null},
        ${phone},
        ${wamid},
        ${message},
        'OUTBOUND',
        'SENT',
        ${now},
        true,
        ${replyToId ?? null},
        ${null}
      )
      ON CONFLICT ("organizationId", "messageId") DO NOTHING
    `

    logger.info({ contactId, wamid, organizationId: user.organizationId }, 'WABA message sent')

    return NextResponse.json({
      id: msgId,
      text: message,
      direction: 'OUTBOUND',
      sentAt: now,
      deliveredAt: null,
      readAt: null,
      status: 'SENT',
      replyToId: replyToId ?? null,
      replyToText: null,
    })
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error sending WABA message')
    return NextResponse.json({ error: error.message || 'Falha ao enviar mensagem' }, { status: 500 })
  }
}
