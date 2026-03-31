/**
 * Webhook receiver for whatsmeow-gateway
 *
 * Receives events:
 * - message          → new WhatsApp message (inbound or outbound)
 * - receipt          → delivery/read receipt
 * - connection.update → instance status changed
 * - contact.update   → push name updated
 * - history.sync     → bulk history messages on first connect
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { triggerEvent } from '@/lib/pusher'
import { normalizePhoneNumber, findContactByPhone } from '@/lib/whatsapp-sync'
import { triggerAgentsForInboundMessage } from '@/lib/agaas-agent-trigger'

const WEBHOOK_SECRET = process.env.WHATSAPP_GATEWAY_WEBHOOK_SECRET || ''

function verifySignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return true // skip if not configured
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  return signature === expected
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-webhook-signature') || ''

  if (!verifySignature(rawBody, signature)) {
    logger.warn('whatsmeow webhook: invalid signature')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, instanceId, data } = payload

  logger.info({ type, instanceId }, 'whatsmeow webhook received')

  try {
    switch (type) {
      case 'message':
        await handleMessage(instanceId, data)
        break
      case 'receipt':
        await handleReceipt(instanceId, data)
        break
      case 'connection.update':
        await handleConnectionUpdate(instanceId, data)
        break
      case 'contact.update':
        await handleContactUpdate(instanceId, data)
        break
      case 'history.sync':
        await handleHistorySync(instanceId, data)
        break
      default:
        logger.info({ type }, 'whatsmeow webhook: unhandled event type')
    }
  } catch (error: any) {
    logger.error({ error: error.message, type, instanceId }, 'whatsmeow webhook: processing error')
  }

  return NextResponse.json({ success: true })
}

async function findConnectionByInstanceId(instanceId: string) {
  return prisma.whatsAppConnection.findFirst({
    where: { instanceName: instanceId },
    include: { organization: true },
  })
}

async function handleMessage(instanceId: string, data: any) {
  const connection = await findConnectionByInstanceId(instanceId)
  if (!connection) {
    logger.warn({ instanceId }, 'whatsmeow: message received for unknown instance')
    return
  }

  const { organizationId } = connection
  const {
    messageId,
    remoteJid,
    pushName,
    fromMe,
    timestamp,
    text,
    mediaType,
    isGroup,
  } = data

  if (!remoteJid) return

  // Skip broadcast/status
  if (remoteJid.includes('status@') || remoteJid.includes('@broadcast')) return

  const phone = isGroup
    ? remoteJid
    : normalizePhoneNumber(remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', ''))

  const senderName = pushName || phone

  // Dedup
  if (messageId) {
    const existing = await prisma.whatsAppMessage.findFirst({
      where: { messageId, organizationId },
    })
    if (existing) return
  }

  // Find or create contact
  let contact: any = isGroup
    ? await prisma.contact.findFirst({ where: { organizationId, phone: remoteJid } })
    : await findContactByPhone(organizationId, phone)

  if (!contact) {
    contact = await prisma.contact.create({
      data: { organizationId, name: senderName, phone },
    })
    logger.info({ contactId: contact.id, phone }, 'whatsmeow: created contact')
  }

  const messageText = text || (fromMe ? '[Mensagem enviada]' : '[Mensagem recebida]')
  const sentAt = timestamp ? new Date(timestamp * 1000) : new Date()

  const savedMsg = await prisma.whatsAppMessage.create({
    data: {
      contactId: contact.id,
      organizationId,
      connectionId: connection.id,
      remoteJid,
      messageId: messageId || `gen-${Date.now()}`,
      text: messageText,
      direction: fromMe ? 'OUTBOUND' : 'INBOUND',
      status: fromMe ? 'SENT' : 'DELIVERED',
      mediaType: mediaType || null,
      sentAt,
    },
  })

  await prisma.contact.update({
    where: { id: contact.id },
    data: { updatedAt: new Date() },
  })

  triggerEvent(organizationId, 'message:new', {
    contactId: contact.id,
    message: {
      id: savedMsg.id,
      text: savedMsg.text,
      direction: savedMsg.direction,
      status: savedMsg.status,
      sentAt: savedMsg.sentAt.toISOString(),
      mediaType: savedMsg.mediaType,
    },
    contactName: contact.name,
    contactPhone: contact.phone,
  })

  if (!fromMe && messageText) {
    triggerAgentsForInboundMessage({
      organizationId,
      contactId: contact.id,
      messageId: savedMsg.id,
      messageText,
      contactName: contact.name || '',
      contactPhone: contact.phone,
    }).catch(() => {})
  }
}

async function handleReceipt(instanceId: string, data: any) {
  const connection = await findConnectionByInstanceId(instanceId)
  if (!connection) return

  const { messageIds, type } = data
  if (!messageIds?.length) return

  const { organizationId } = connection

  const isDelivered = type === 'delivered'
  const isRead = type === 'read'

  if (!isDelivered && !isRead) return

  await prisma.whatsAppMessage.updateMany({
    where: { organizationId, messageId: { in: messageIds }, direction: 'OUTBOUND' },
    data: {
      status: isRead ? 'READ' : 'DELIVERED',
      deliveredAt: new Date(),
      ...(isRead && { readAt: new Date() }),
    },
  })

  for (const messageId of messageIds) {
    triggerEvent(organizationId, 'message:status', {
      messageId,
      status: isRead ? 'READ' : 'DELIVERED',
    })
  }
}

async function handleConnectionUpdate(instanceId: string, data: any) {
  const { status, organizationId } = data

  // Map gateway statuses to CRM statuses
  const statusMap: Record<string, string> = {
    connected: 'CONNECTED',
    disconnected: 'DISCONNECTED',
    qr_pending: 'CONNECTING',
    qr_timeout: 'DISCONNECTED',
    error: 'DISCONNECTED',
    banned: 'DISCONNECTED',
    logged_out: 'DISCONNECTED',
  }

  const crmStatus = statusMap[status] || 'DISCONNECTED'

  const connection = await prisma.whatsAppConnection.findFirst({
    where: { instanceName: instanceId },
  })

  if (!connection) return

  const wasDisconnected = connection.status !== 'CONNECTED'

  await prisma.whatsAppConnection.update({
    where: { id: connection.id },
    data: {
      status: crmStatus,
      ...(crmStatus === 'CONNECTED' && { connectedAt: new Date() }),
    },
  })

  if (crmStatus === 'CONNECTED' && wasDisconnected) {
    triggerEvent(connection.organizationId, 'connection:ready', {
      connectionId: connection.id,
      instanceName: connection.instanceName,
    })
  }
}

async function handleContactUpdate(instanceId: string, data: any) {
  const connection = await findConnectionByInstanceId(instanceId)
  if (!connection) return

  const { jid, pushName } = data
  if (!jid || !pushName) return

  const phone = normalizePhoneNumber(jid.replace('@s.whatsapp.net', '').replace('@c.us', ''))
  const contact = await findContactByPhone(connection.organizationId, phone)

  if (contact) {
    const hasGenericName =
      !contact.name || contact.name === contact.phone || /^\d+$/.test(contact.name.replace(/\D/g, ''))

    if (hasGenericName) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { name: pushName },
      })
    }
  }
}

async function handleHistorySync(instanceId: string, data: any) {
  const connection = await findConnectionByInstanceId(instanceId)
  if (!connection) return

  const { remoteJid, pushName, messages } = data
  if (!messages?.length || !remoteJid) return

  const { organizationId } = connection
  const isGroup = remoteJid.includes('@g.us')
  const phone = isGroup
    ? remoteJid
    : normalizePhoneNumber(remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', ''))

  let contact: any = isGroup
    ? await prisma.contact.findFirst({ where: { organizationId, phone: remoteJid } })
    : await findContactByPhone(organizationId, phone)

  if (!contact) {
    contact = await prisma.contact.create({
      data: { organizationId, name: pushName || phone, phone },
    })
  }

  let saved = 0
  for (const msg of messages) {
    if (!msg.messageId) continue

    const existing = await prisma.whatsAppMessage.findFirst({
      where: { messageId: msg.messageId, organizationId },
    })
    if (existing) continue

    const sentAt = msg.timestamp ? new Date(msg.timestamp * 1000) : new Date()

    await prisma.whatsAppMessage.create({
      data: {
        contactId: contact.id,
        organizationId,
        connectionId: connection.id,
        remoteJid,
        messageId: msg.messageId,
        text: msg.text || (msg.fromMe ? '[Mensagem enviada]' : '[Mensagem recebida]'),
        direction: msg.fromMe ? 'OUTBOUND' : 'INBOUND',
        status: msg.fromMe ? 'SENT' : 'DELIVERED',
        mediaType: msg.mediaType || null,
        sentAt,
      },
    })
    saved++
  }

  logger.info({ instanceId, remoteJid, total: messages.length, saved }, 'whatsmeow: history sync processed')
}
