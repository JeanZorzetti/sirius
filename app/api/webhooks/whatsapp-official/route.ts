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

import { NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logWabaActivity, getWhatsAppOfficialClient } from '@/lib/integrations/whatsapp-official-client'
import { decrypt } from '@/lib/encryption'
import { assinaturaMetaValida } from '@/lib/meta-assinatura'
import { triggerAgentsForInboundMessage, triggerAgentsForContactCreated } from '@/lib/agaas-agent-trigger'
import { avancarStatus, registrarEntrada } from '@/lib/whatsapp/entrada'
import type { TipoMidia } from '@/lib/whatsapp/integradores/tipos'
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
    // The signature covers the raw body, so read it before parsing anything
    const corpoCru = await request.text()
    let body: any
    try {
      body = JSON.parse(corpoCru)
    } catch {
      return NextResponse.json({ error: 'corpo inválido' }, { status: 400 })
    }

    // Meta wraps all events in object with entry array
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' })
    }

    // Each account signs with its own Meta app secret. The entry id is untrusted until the signature checks out
    // against the secret of the account it names, so every account in the notice is checked before anything is saved.
    const orgPorWaba = new Map<string, { id: string }>()
    for (const entry of body.entry ?? []) {
      const org = await prisma.organization.findFirst({
        where: { wabaBusinessAccountId: String(entry.id), wabaEnabled: true },
        select: { id: true, wabaAppSecret: true }
      })
      if (!org) {
        logger.warn({ wabaId: entry.id }, 'WhatsApp Official webhook: no org found for WABA ID')
        continue
      }
      let segredo: string | null = null
      try {
        segredo = org.wabaAppSecret ? decrypt(org.wabaAppSecret) : null
      } catch {
        segredo = null
      }
      if (!assinaturaMetaValida(corpoCru, request.headers.get('x-hub-signature-256'), segredo)) {
        logger.warn(
          { organizationId: org.id, motivo: segredo ? 'assinatura inválida' : 'conta sem App Secret' },
          'WhatsApp Official webhook: notice refused'
        )
        return NextResponse.json({ error: 'assinatura inválida' }, { status: 401 })
      }
      orgPorWaba.set(String(entry.id), { id: org.id })
    }

    // Answer first and process after the response (FR-011): Meta must not wait on media downloads or agents
    after(async () => {
      for (const entry of body.entry ?? []) {
        const org = orgPorWaba.get(String(entry.id))
        if (!org) continue

        for (const change of entry.changes ?? []) {
          if (change.field !== 'messages') continue

          const value = change.value

          for (const message of value.messages ?? []) {
            await handleIncomingMessage(org.id, message, value.contacts?.[0])
          }

          for (const status of value.statuses ?? []) {
            await handleStatusUpdate(org.id, status)
          }
        }
      }
    })

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
    let interactiveReplyId: string | null = null

    if (message.type === 'text') {
      text = message.text?.body ?? ''
    } else if (message.type === 'interactive') {
      // Quick-reply button or list selection. We store both the title (text)
      // and the id (machine-readable) so downstream agents/automations can
      // route on it without re-parsing strings.
      const buttonReply = message.interactive?.button_reply
      const listReply = message.interactive?.list_reply
      if (buttonReply) {
        interactiveReplyId = buttonReply.id ?? null
        text = buttonReply.title ?? ''
      } else if (listReply) {
        interactiveReplyId = listReply.id ?? null
        text = listReply.title ?? ''
        if (listReply.description) text = `${text}\n${listReply.description}`
      }
      mediaType = 'interactive_reply'
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

    logger.info(
      { organizationId, messageId, type: message.type },
      'WhatsApp Official: incoming message'
    )

    // Prefix interactive replies with the button/list id so downstream
    // consumers can route on it without needing a schema migration.
    const persistedText = interactiveReplyId
      ? `[btn:${interactiveReplyId}] ${text}`
      : text

    // The shared inbound path (spec 012): contact by phone key, dedup by create + P2002, media to our storage.
    // connectionId null marks the official API.
    const salva = await registrarEntrada(
      organizationId,
      null,
      {
        tipo: 'mensagem',
        messageId,
        jid: from,
        telefone: from,
        nomePerfil: metaContact?.profile?.name ?? null,
        fromMe: false,
        enviadaEm: timestamp,
        texto: persistedText,
        midia: mediaId && mediaType ? { tipo: mediaType as TipoMidia | 'sticker', ref: { messageId: mediaId } } : null,
      },
      mediaId ? () => baixarMidiaOficial(organizationId, mediaId!) : undefined,
      mediaType ? { mediaType } : {},
    )
    if (!salva) return // already processed

    // The AI agents fire only on the official path
    if (salva.contatoNovo) {
      triggerAgentsForContactCreated({
        organizationId,
        contactId: salva.contactId,
        contactName: salva.contactName,
        contactPhone: `+${from.replace(/\D/g, '')}`,
      }).catch(err => logger.error({ err }, 'WABA ContactEnricher trigger failed'))
    }

    if ((message.type === 'text' || message.type === 'interactive') && text.trim()) {
      triggerAgentsForInboundMessage({
        organizationId,
        contactId: salva.contactId,
        messageId: salva.mensagemId,
        messageText: text, // Use raw title without [btn:ID] prefix for LLM context
        contactName: salva.contactName,
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

async function baixarMidiaOficial(organizationId: string, mediaId: string) {
  const client = await getWhatsAppOfficialClient(organizationId)
  if (!client) throw new Error('no WABA client')
  const { buffer, mimeType } = await client.downloadMedia(mediaId)
  return { buffer, mimetype: mimeType }
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

    // Map Meta status to our enum; the state only moves forward (FR-016)
    const statusMap: Record<string, 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'> = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    }
    const newStatus = statusMap[deliveryStatus]
    if (!newStatus) return

    await avancarStatus(organizationId, [messageId], newStatus, {
      em: new Date(parseInt(timestamp) * 1000),
      erro: status.errors?.[0]?.title ?? null,
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
