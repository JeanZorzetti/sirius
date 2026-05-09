/**
 * API Route: /api/whatsapp/send-message
 *
 * Envia mensagem WhatsApp através do Whatsmeow Gateway.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import logger from '@/lib/logger'
import { ssePublish } from '@/lib/sse'
import { normalizePhoneNumber } from '@/lib/whatsapp-sync'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, organization: { select: { tier: true } } },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    if (user.organization?.tier !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'O WhatsApp está disponível apenas no plano Business (API Oficial Meta).' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await req.json()
    const { connectionId, contactId, message, replyToId } = body

    if (!connectionId || !contactId || !message) {
      return NextResponse.json(
        { error: 'connectionId, contactId, and message are required' },
        { status: 400 }
      )
    }

    // 4. Verificar se a conexão pertence à organização
    // Use $queryRaw to avoid any Prisma INSUFFICIENT_PATH on nullable relation fields
    const connRows = await prismaWa.$queryRaw<Array<{
      id: string; instanceName: string; status: string; organizationId: string
    }>>`
      SELECT id, "instanceName", status, "organizationId"
      FROM "WhatsAppConnection"
      WHERE id = ${connectionId}
        AND "organizationId" = ${user.organizationId}
      LIMIT 1
    `

    if (!connRows.length) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 })
    }

    const connection = connRows[0]

    // 5. Verificar se a conexão está ativa
    if (connection.status !== 'CONNECTED') {
      return NextResponse.json(
        { error: 'Connection is not active. Please connect first.' },
        { status: 400 }
      )
    }

    // 6. Buscar contato
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId: user.organizationId,
      },
      select: { id: true, phone: true },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    if (!contact.phone) {
      return NextResponse.json({ error: 'Contact has no phone number' }, { status: 400 })
    }

    // 7. Send via Whatsmeow Gateway — this MUST succeed before saving to DB
    const phoneNumber = normalizePhoneNumber(contact.phone)
    const remoteJid = phoneNumber

    const res = await whatsmeowClient.sendText(connection.instanceName, phoneNumber, message)
    const messageId = res.messageId

    logger.info({ connectionId: connection.id, contactId: contact.id, messageId }, 'WhatsApp message sent')

    // 8. Save message to DB using raw SQL to bypass any Prisma relation path issues
    const now = new Date()
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    let savedMessage: any
    try {
      await prismaWa.$executeRaw`
        INSERT INTO "WhatsAppMessage"
          (id, "contactId", "organizationId", "connectionId", "remoteJid",
           "messageId", text, direction, status, "sentAt", "isRead",
           "replyToId", "replyToText")
        VALUES (
          ${msgId},
          ${contact.id},
          ${user.organizationId},
          ${connection.id},
          ${remoteJid},
          ${messageId},
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

      savedMessage = {
        id: msgId,
        text: message,
        direction: 'OUTBOUND',
        sentAt: now,
        deliveredAt: null,
        readAt: null,
        status: 'SENT',
        replyToId: replyToId ?? null,
        replyToText: null,
      }
    } catch (dbErr: any) {
      // DB save failed but message was already sent — log and return success anyway
      logger.error({ error: dbErr.message, messageId }, 'send-message: DB save failed after send')
      savedMessage = {
        id: `temp_${messageId}`,
        text: message,
        direction: 'OUTBOUND',
        sentAt: now,
        deliveredAt: null,
        readAt: null,
        status: 'SENT',
        replyToId: replyToId ?? null,
        replyToText: null,
      }
    }

    ssePublish(user.organizationId, 'message:sent', {
      contactId: contact.id,
      message: savedMessage,
    })

    return NextResponse.json(savedMessage)
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack, code: error.code }, 'Error sending WhatsApp message')
    return NextResponse.json(
      { error: 'Falha ao enviar mensagem', details: error.message },
      { status: 500 }
    )
  }
}
