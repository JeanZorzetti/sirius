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
import { logWabaActivity } from '@/lib/integrations/whatsapp-official-client'
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
  contact: any
) {
  try {
    const from: string = message.from // E.164 without +, e.g. "5511987654321"
    const messageId: string = message.id
    const timestamp = new Date(parseInt(message.timestamp) * 1000)

    let text = ''
    if (message.type === 'text') {
      text = message.text?.body ?? ''
    } else if (message.type === 'interactive') {
      text = message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title ?? ''
    }

    const contactName: string = contact?.profile?.name ?? from

    logger.info(
      { organizationId, from, messageId, type: message.type },
      'WhatsApp Official: incoming message'
    )

    // Log to IntegrationLog for activity tracking
    await logWabaActivity(
      organizationId,
      'receive_message',
      'SUCCESS',
      { from, messageId, type: message.type, text: text.substring(0, 100) },
      undefined
    )

    // TODO: Create or update Contact and WhatsAppMessage record,
    //       link to ChatConversation, trigger deal automations, etc.
    // This follows the same pattern as the Evolution API webhook handler.

  } catch (error) {
    logger.error({ error, organizationId }, 'Error handling incoming WABA message')
  }
}

async function handleStatusUpdate(organizationId: string, status: any) {
  try {
    const { id: messageId, status: deliveryStatus, timestamp, recipient_id } = status

    logger.info(
      { organizationId, messageId, deliveryStatus, recipient_id },
      'WhatsApp Official: status update'
    )

    await logWabaActivity(
      organizationId,
      `status_update:${deliveryStatus}`,
      'SUCCESS',
      { messageId, deliveryStatus, recipient_id }
    )

    // TODO: Update WhatsAppMessage.status in DB (sent → delivered → read)

  } catch (error) {
    logger.error({ error, organizationId }, 'Error handling WABA status update')
  }
}
