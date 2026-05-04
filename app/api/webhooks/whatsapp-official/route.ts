/**
 * WhatsApp Official API Webhook
 *
 * Handles two types of requests from Meta:
 *
 * GET  — Webhook verification challenge (one-time setup)
 * POST — Incoming messages, delivery status updates
 *
 * Meta sends a GET request to verify the webhook URL.
 * We respond with the challenge string if the verify_token matches.
 *
 * Configure this URL in Meta Business Manager:
 *   https://seu-crm.com/api/webhooks/whatsapp-official
 *
 * Required env var:
 *   WHATSAPP_WEBHOOK_VERIFY_TOKEN — global fallback verify token
 *   (each org can also set their own wabaWebhookVerifyToken)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { logWabaActivity, getWhatsAppOfficialClient } from '@/lib/integrations/whatsapp-official-client'
import { triggerAgentsForInboundMessage, triggerAgentsForContactCreated } from '@/lib/agaas-agent-trigger'
import { uploadMedia } from '@/lib/storage'
import logger from '@/lib/logger'

// ─── GET: Meta webhook verification challenge ─────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode !== 'subscribe' || !token || !challenge) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Check against global fallback token first
  const globalToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  if (globalToken && token === globalToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  // Check against any org's per-org verify token
  const org = await prisma.organization.findFirst({
    where: { wabaWebhookVerifyToken: token },
    select: { id: true }
  })

  if (org) {
    return new NextResponse(challenge, { status: 200 })
  }

  logger.warn({ token }, 'WhatsApp Official webhook verification failed: unknown token')
  return new NextResponse('Forbidden', { status: 403 })
}

// ─── POST: Incoming messages & status updates ────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Meta wraps all events in object with entry array
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' })
    }

    for (const entry of body.entry ?? []) {
      const wabaId: string = entry.id

      // Find the organization by business account ID
      const org = await prisma.organization.findFirst({
        where: { wabaBusinessAccountId: wabaId, wabaEnabled: true },
        select: { id: true }
      })

      if (!org) {
        logger.warn({ wabaId }, 'WhatsApp Official webhook: no org found for WABA ID')
        continue
      }

      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue

        const value = change.value

        // Handle incoming messages
        for (const message of value.messages ?? []) {
          await handleIncomingMessage(org.id, message, value.contacts?.[0])
        }

        // Handle status updates
        for (const status of value.statuses ?? []) {
          await handleStatusUpdate(org.id, status)
        }
      }
    }

    // Always return 200 to prevent Meta from retrying
    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    logger.error({ error }, 'Error processing WhatsApp Official webhook')
    // Still return 200 — Meta will retry on non-200 responses
    return NextResponse.json({ status: 'error' })
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleIncomingMessage(
  organizationId: string,
  message: any,
  metaContact: any
) {
  try {
    const from: string = message.from // E.164 without +, e.g. "5511987654321"
    const messageId: string = message.id
    const timestamp = new Date(parseInt(message.timestamp) * 1000)

    // Extract text content and media info based on message type
    let text = ''
    let mediaId: string | null = null
    let mediaType: string | null = null

    if (message.type === 'text') {
      text = message.text?.body ?? ''
    } else if (message.type === 'interactive') {
      text = message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title ?? ''
    } else if (message.type === 'image') {
      text = message.image?.caption ?? '[Imagem]'
      mediaId = message.image?.id ?? null
      mediaType = 'image'
    } else if (message.type === 'video') {
      text = message.video?.caption ?? '[Vídeo]'
      mediaId = message.video?.id ?? null
      mediaType = 'video'
    } else if (message.type === 'audio') {
      text = '[Áudio]'
      mediaId = message.audio?.id ?? null
      mediaType = 'audio'
    } else if (message.type === 'document') {
      text = message.document?.filename ?? '[Documento]'
      mediaId = message.document?.id ?? null
      mediaType = 'document'
    } else if (message.type === 'sticker') {
      text = '[Figurinha]'
      mediaId = message.sticker?.id ?? null
      mediaType = 'sticker'
    } else if (message.type === 'location') {
      text = '[Localização]'
    } else {
      text = `[${message.type}]`
    }

    const contactName: string = metaContact?.profile?.name ?? from

    logger.info(
      { organizationId, from, messageId, type: message.type },
      'WhatsApp Official: incoming message'
    )

    // Idempotency — skip if already processed
    const existing = await prismaWa.whatsAppMessage.findFirst({
      where: { organizationId, messageId },
      select: { id: true }
    })
    if (existing) return

    // Find or create CRM contact by phone number
    const phoneDigits = from.replace(/\D/g, '')
    let contact = await prisma.contact.findFirst({
      where: {
        organizationId,
        phone: { contains: phoneDigits.slice(-9) }, // match last 9 digits to handle format variations
      },
      select: { id: true, name: true }
    })

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          organizationId,
          name: contactName,
          phone: `+${phoneDigits}`,
        },
        select: { id: true, name: true }
      })
      logger.info({ organizationId, contactId: contact.id, phone: from }, 'WhatsApp Official: created new contact')
      triggerAgentsForContactCreated({
        organizationId,
        contactId: contact.id,
        contactName: contactName,
        contactPhone: `+${phoneDigits}`,
      }).catch(err => logger.error({ err }, 'WABA ContactEnricher trigger failed'))
    }

    // Save message to WA DB (no connectionId — WABA doesn't use WhatsAppConnection records)
    const saved = await prismaWa.whatsAppMessage.create({
      data: {
        organizationId,
        messageId,
        remoteJid: from,
        text,
        direction: 'INBOUND',
        status: 'DELIVERED',
        isRead: false,
        contactId: contact.id,
        sentAt: timestamp,
        ...(mediaType ? { mediaType } : {}),
      }
    })
    logger.info({ organizationId, messageDbId: saved.id, contactId: contact.id }, 'WhatsApp Official: message saved to WA DB')

    // Download media in background — don't await, webhook must return fast
    if (mediaId && mediaType) {
      downloadAndCacheWabaMedia({
        organizationId,
        messageDbId: saved.id,
        messageId,
        mediaId,
        mediaType,
        contactId: contact.id,
      }).catch(err => logger.error({ err, mediaId }, 'WABA media background download failed'))
    }

    // Trigger IA agents in background — only for text messages
    if (message.type === 'text' && text.trim()) {
      triggerAgentsForInboundMessage({
        organizationId,
        contactId: contact.id,
        messageId: saved.id,
        messageText: text,
        contactName: contact.name || contactName,
        contactPhone: from,
      }).catch(err => logger.error({ err }, 'WABA agent trigger failed'))
    }

    await logWabaActivity(
      organizationId,
      'receive_message',
      'SUCCESS',
      { from, messageId, type: message.type, text: text.substring(0, 100) },
      undefined
    )

  } catch (error) {
    logger.error({ error, organizationId }, 'Error handling incoming WABA message')
  }
}

async function downloadAndCacheWabaMedia({
  organizationId,
  messageDbId,
  messageId,
  mediaId,
  mediaType,
  contactId,
}: {
  organizationId: string
  messageDbId: string
  messageId: string
  mediaId: string
  mediaType: string
  contactId: string
}) {
  try {
    const client = await getWhatsAppOfficialClient(organizationId)
    if (!client) {
      logger.warn({ organizationId, messageDbId }, 'WABA media download skipped: no WABA client')
      return
    }

    const { buffer, mimeType } = await client.downloadMedia(mediaId)
    logger.info({ organizationId, messageDbId, mediaType, mimeType, bytes: buffer.length }, 'WABA media downloaded from Meta')

    const key = await uploadMedia({
      orgId: organizationId,
      contactId,
      messageId: messageDbId,
      buffer,
      mimetype: mimeType,
    })

    await prismaWa.whatsAppMessage.update({
      where: { id: messageDbId },
      data: { mediaUrl: key, mediaType },
    })

    logger.info({ organizationId, messageDbId, mediaType, mimeType, key }, 'WABA media cached to MinIO')
  } catch (err: any) {
    logger.error({ err: err.message, stack: err.stack, organizationId, messageDbId, mediaId }, 'WABA media download/cache failed')
  }
}

async function handleStatusUpdate(organizationId: string, status: any) {
  try {
    const { id: messageId, status: deliveryStatus, timestamp, recipient_id } = status

    if (deliveryStatus === 'failed') {
      logger.error(
        { organizationId, messageId, recipient_id, errors: status.errors },
        'WhatsApp Official: message delivery FAILED'
      )
    } else {
      logger.info(
        { organizationId, messageId, deliveryStatus, recipient_id },
        'WhatsApp Official: status update'
      )
    }

    // Map Meta status to our enum
    const statusMap: Record<string, string> = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    }
    const newStatus = statusMap[deliveryStatus]
    if (!newStatus) return

    const updateData: any = { status: newStatus }
    if (deliveryStatus === 'delivered') updateData.deliveredAt = new Date(parseInt(timestamp) * 1000)
    if (deliveryStatus === 'read') updateData.readAt = new Date(parseInt(timestamp) * 1000)

    await prismaWa.whatsAppMessage.updateMany({
      where: { organizationId, messageId },
      data: updateData,
    })

    await logWabaActivity(
      organizationId,
      `status_update:${deliveryStatus}`,
      'SUCCESS',
      { messageId, deliveryStatus, recipient_id }
    )

  } catch (error) {
    logger.error({ error, organizationId }, 'Error handling WABA status update')
  }
}
