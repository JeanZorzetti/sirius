/**
 * Webhook receiver for whatsmeow-gateway
 *
 * Receives events:
 * - message           → new WhatsApp message (inbound or outbound)
 * - reaction          → emoji reaction to a message
 * - receipt           → delivery/read receipt
 * - connection.update → instance status changed
 * - connection.alert  → reconnection failures, ban alerts
 * - contact.update    → push name updated
 * - chat.presence     → typing indicators (composing/paused)
 * - history.sync      → bulk history messages on first connect
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { WhatsAppStatus } from '.prisma/client-wa'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import logger from '@/lib/logger'
import { ssePublish } from '@/lib/sse'
import { normalizePhoneNumber, findContactByPhone } from '@/lib/whatsapp-sync'
import { triggerAgentsForInboundMessage } from '@/lib/agaas-agent-trigger'
import { uploadBase64 } from '@/lib/storage'

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
      case 'reaction':
        await handleReaction(instanceId, data)
        break
      case 'chat.presence':
        await handleChatPresence(instanceId, data)
        break
      case 'connection.alert':
        await handleConnectionAlert(instanceId, data)
        break
      case 'history.sync':
        await handleHistorySync(instanceId, data)
        break
      case 'history.sync.batch':
        await handleHistorySyncBatch(instanceId, data)
        break
      case 'sync.completed':
        logger.info({ instanceId, data }, 'whatsmeow: sync completed')
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
  return prismaWa.whatsAppConnection.findFirst({
    where: { instanceName: instanceId },
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
    mediaBase64,
    isGroup,
    snowflakeId,
    sourceTimestamp,
  } = data

  if (!remoteJid) return

  // Skip broadcast/status/newsletter
  if (remoteJid.includes('status@') || remoteJid.includes('@broadcast') || remoteJid.includes('@newsletter')) return

  // Skip invalid JIDs (WhatsApp internal IDs with >15 digits)
  if (!isGroup) {
    const rawPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '')
    if (rawPhone.length > 15) return
  }

  const phone = isGroup
    ? remoteJid
    : normalizePhoneNumber(remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', ''))

  const senderName = pushName || phone

  // Dedup
  if (messageId) {
    const existing = await prismaWa.whatsAppMessage.findFirst({
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
  } else if (pushName && !isGroup) {
    const hasGenericName =
      !contact.name || contact.name === contact.phone || /^\d+$/.test(contact.name.replace(/\D/g, ''))
    if (hasGenericName) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { name: pushName },
      })
      contact.name = pushName
    }
  }

  // Skip messages with no content (system messages, reactions, pin events, etc.)
  if (!text && !mediaType) return

  const messageText = text || `[${mediaType}]`
  const sentAt = timestamp ? new Date(timestamp * 1000) : new Date()

  // Upload media to MinIO if present
  let mediaUrl: string | null = null
  if (mediaBase64 && mediaType) {
    try {
      const msgIdForStorage = messageId || `gen-${Date.now()}`
      mediaUrl = await uploadBase64({
        orgId: organizationId,
        contactId: contact.id,
        messageId: msgIdForStorage,
        base64Data: mediaBase64,
      })
      logger.info({ messageId: msgIdForStorage, mediaType }, 'whatsmeow: media uploaded to MinIO')
    } catch (err) {
      logger.error({ err, messageId }, 'whatsmeow: failed to upload media to MinIO, falling back to base64')
      mediaUrl = mediaBase64 // Fallback: store base64 in DB
    }
  }

  const savedMsg = await prismaWa.whatsAppMessage.create({
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
      mediaUrl,
      sentAt,
      isRead: fromMe,
      snowflakeId: snowflakeId ? BigInt(snowflakeId) : null,
      sourceTimestamp: sourceTimestamp ? new Date(sourceTimestamp) : sentAt,
    },
  })

  await prisma.contact.update({
    where: { id: contact.id },
    data: { updatedAt: new Date() },
  })

  ssePublish(organizationId, 'message:new', {
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

  await prismaWa.whatsAppMessage.updateMany({
    where: { organizationId, messageId: { in: messageIds }, direction: 'OUTBOUND' },
    data: {
      status: isRead ? 'READ' : 'DELIVERED',
      deliveredAt: new Date(),
      ...(isRead && { readAt: new Date() }),
    },
  })

  for (const messageId of messageIds) {
    ssePublish(organizationId, 'message:status', {
      messageId,
      status: isRead ? 'READ' : 'DELIVERED',
    })
  }
}

async function handleConnectionUpdate(instanceId: string, data: any) {
  const { status, organizationId } = data

  // Map gateway statuses to CRM statuses
  const statusMap: Record<string, WhatsAppStatus> = {
    connected: WhatsAppStatus.CONNECTED,
    disconnected: WhatsAppStatus.DISCONNECTED,
    qr_pending: WhatsAppStatus.CONNECTING,
    qr_timeout: WhatsAppStatus.DISCONNECTED,
    error: WhatsAppStatus.DISCONNECTED,
    banned: WhatsAppStatus.DISCONNECTED,
    logged_out: WhatsAppStatus.DISCONNECTED,
  }

  const crmStatus = statusMap[status] ?? WhatsAppStatus.DISCONNECTED

  const connection = await prismaWa.whatsAppConnection.findFirst({
    where: { instanceName: instanceId },
  })

  if (!connection) return

  const wasDisconnected = connection.status !== 'CONNECTED'

  await prismaWa.whatsAppConnection.update({
    where: { id: connection.id },
    data: {
      status: crmStatus,
      ...(crmStatus === 'CONNECTED' && { connectedAt: new Date() }),
    },
  })

  // Publish SSE for both connect and disconnect so the UI updates immediately
  // instead of waiting for the 10s polling interval.
  if (crmStatus === 'CONNECTED' && wasDisconnected) {
    ssePublish(connection.organizationId, 'connection:ready', {
      connectionId: connection.id,
      instanceName: connection.instanceName,
    })
  } else if (crmStatus === 'DISCONNECTED') {
    ssePublish(connection.organizationId, 'connection:ready', {
      connectionId: connection.id,
      instanceName: connection.instanceName,
      status: 'disconnected',
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

  // Skip broadcast, status, and newsletter JIDs
  if (remoteJid.includes('status@') || remoteJid.includes('@broadcast') || remoteJid.includes('@newsletter')) return

  const { organizationId } = connection
  const isGroup = remoteJid.includes('@g.us')

  // Extract phone from JID
  const rawPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@g.us', '')

  // Skip invalid JIDs: non-group numbers longer than 15 digits are WhatsApp internal IDs
  if (!isGroup && rawPhone.length > 15) {
    logger.debug({ remoteJid }, 'whatsmeow: skipping invalid JID (too long)')
    return
  }

  const phone = isGroup ? remoteJid : normalizePhoneNumber(rawPhone)

  let contact: any = isGroup
    ? await prisma.contact.findFirst({ where: { organizationId, phone: remoteJid } })
    : await findContactByPhone(organizationId, phone)

  if (!contact) {
    contact = await prisma.contact.create({
      data: { organizationId, name: pushName || phone, phone },
    })
  } else if (pushName && !isGroup) {
    const hasGenericName =
      !contact.name || contact.name === contact.phone || /^\d+$/.test(contact.name.replace(/\D/g, ''))
    if (hasGenericName) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { name: pushName },
      })
      contact.name = pushName
    }
  }

  // Filter messages: only skip those without an ID (protocol/system)
  const validMessages = messages.filter((msg: any) => {
    if (!msg.messageId) return false
    // Skip protocol messages with no content at all
    if (!msg.text && !msg.mediaType) return false
    return true
  })

  if (validMessages.length === 0) return

  // Batch dedup: check which messageIds already exist
  const msgIds = validMessages.map((m: any) => m.messageId)
  const existing = await prismaWa.whatsAppMessage.findMany({
    where: { organizationId, messageId: { in: msgIds } },
    select: { messageId: true, connectionId: true },
  })
  const existingMap = new Map(existing.map((m: any) => [m.messageId, m.connectionId]))

  // Reassign orphaned messages (connectionId null) to current connection
  const orphanIds = existing
    .filter((m: any) => m.connectionId === null)
    .map((m: any) => m.messageId)
  if (orphanIds.length > 0) {
    await prismaWa.whatsAppMessage.updateMany({
      where: { organizationId, messageId: { in: orphanIds } },
      data: { connectionId: connection.id },
    })
  }

  let saved = 0
  for (const msg of validMessages) {
    if (existingMap.has(msg.messageId)) continue

    const sentAt = msg.timestamp ? new Date(msg.timestamp * 1000) : new Date()

    try {
      await prismaWa.whatsAppMessage.create({
        data: {
          contactId: contact.id,
          organizationId,
          connectionId: connection.id,
          remoteJid,
          messageId: msg.messageId,
          text: msg.text || (msg.mediaType ? `[${msg.mediaType}]` : '[Mensagem]'),
          direction: msg.fromMe ? 'OUTBOUND' : 'INBOUND',
          status: msg.fromMe ? 'SENT' : 'DELIVERED',
          mediaType: msg.mediaType || null,
          sentAt,
          isRead: true,
          snowflakeId: msg.snowflakeId ? BigInt(msg.snowflakeId) : null,
          sourceTimestamp: msg.sourceTimestamp ? new Date(msg.sourceTimestamp) : sentAt,
        },
      })
      saved++
      existingMap.set(msg.messageId, connection.id)
    } catch {
      // Unique constraint — skip
    }
  }

  logger.info({ instanceId, remoteJid, total: messages.length, saved, reassigned: orphanIds.length }, 'whatsmeow: history sync processed')
}

async function handleReaction(instanceId: string, data: any) {
  const connection = await findConnectionByInstanceId(instanceId)
  if (!connection) return

  const { messageId, reaction, senderJid, fromMe } = data
  if (!messageId) return

  ssePublish(connection.organizationId, 'message:new', {
    messageId,
    reaction,
    senderJid,
    fromMe,
  })
}

async function handleChatPresence(instanceId: string, data: any) {
  const connection = await findConnectionByInstanceId(instanceId)
  if (!connection) return

  const { jid, state } = data
  if (!jid) return

  // state: "composing" or "paused"
  ssePublish(connection.organizationId, 'chat:typing', {
    remoteJid: jid,
    isTyping: state === 'composing',
  })
}

async function handleHistorySyncBatch(instanceId: string, data: any) {
  const connection = await findConnectionByInstanceId(instanceId)
  if (!connection) return

  const { messages, count } = data
  if (!messages?.length) return

  const { organizationId } = connection
  let saved = 0

  // Group messages by remoteJid for contact resolution
  const byJid = new Map<string, any[]>()
  for (const msg of messages) {
    const jid = msg.remoteJid
    if (!jid) continue
    if (jid.includes('status@') || jid.includes('@broadcast') || jid.includes('@newsletter')) continue
    if (!byJid.has(jid)) byJid.set(jid, [])
    byJid.get(jid)!.push(msg)
  }

  for (const [remoteJid, msgs] of byJid) {
    const isGroup = remoteJid.includes('@g.us')
    const rawPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@g.us', '')

    if (!isGroup && rawPhone.length > 15) continue

    const phone = isGroup ? remoteJid : normalizePhoneNumber(rawPhone)
    const pushName = msgs[0]?.pushName || phone

    let contact: any = isGroup
      ? await prisma.contact.findFirst({ where: { organizationId, phone: remoteJid } })
      : await findContactByPhone(organizationId, phone)

    if (!contact) {
      contact = await prisma.contact.create({
        data: { organizationId, name: pushName, phone },
      })
    }

    // Batch dedup
    const msgIds = msgs.map((m: any) => m.messageId).filter(Boolean)
    const existing = await prismaWa.whatsAppMessage.findMany({
      where: { organizationId, messageId: { in: msgIds } },
      select: { messageId: true },
    })
    const existingSet = new Set(existing.map((m: any) => m.messageId))

    for (const msg of msgs) {
      if (!msg.messageId || existingSet.has(msg.messageId)) continue
      if (!msg.text && !msg.mediaType) continue

      const sentAt = msg.timestamp ? new Date(msg.timestamp * 1000) : new Date()

      try {
        await prismaWa.whatsAppMessage.create({
          data: {
            contactId: contact.id,
            organizationId,
            connectionId: connection.id,
            remoteJid,
            messageId: msg.messageId,
            text: msg.text || (msg.mediaType ? `[${msg.mediaType}]` : '[Mensagem]'),
            direction: msg.fromMe ? 'OUTBOUND' : 'INBOUND',
            status: msg.fromMe ? 'SENT' : 'DELIVERED',
            mediaType: msg.mediaType || null,
            sentAt,
            isRead: true,
            snowflakeId: msg.snowflakeId ? BigInt(msg.snowflakeId) : null,
            sourceTimestamp: msg.sourceTimestamp ? new Date(msg.sourceTimestamp) : sentAt,
          },
        })
        saved++
        existingSet.add(msg.messageId)
      } catch (err: any) {
        logger.warn({ error: err.message, messageId: msg.messageId }, 'whatsmeow: history msg save skipped')
      }
    }
  }

  logger.info({ instanceId, total: count, saved }, 'whatsmeow: history.sync.batch processed')
}

async function handleConnectionAlert(instanceId: string, data: any) {
  const { organizationId, status, message, attempts } = data
  logger.error({ instanceId, status, attempts, message }, 'whatsmeow: connection alert')

  if (organizationId) {
    ssePublish(organizationId, 'connection:ready', {
      instanceId,
      status,
      message,
      attempts,
    })
  }
}
