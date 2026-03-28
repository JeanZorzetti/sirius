import logger from './logger'
import { prisma } from './prisma'
import crypto from 'crypto'

/**
 * Eventos de webhook disponíveis
 */
export const WEBHOOK_EVENTS = {
  ORGANIZATION_UPGRADED: 'organization.upgraded',
  ORGANIZATION_DOWNGRADED: 'organization.downgraded',
  DEAL_CREATED: 'deal.created',
  DEAL_UPDATED: 'deal.updated',
  DEAL_DELETED: 'deal.deleted',
  DEAL_STAGE_CHANGED: 'deal.stage_changed',
  DEAL_VALUE_CHANGED: 'deal.value_changed',
  CONTACT_CREATED: 'contact.created',
  CONTACT_UPDATED: 'contact.updated',
  CONTACT_DELETED: 'contact.deleted',
  DEAL_NOTE_ADDED: 'deal.note_added',
  // AgaaS events (dispatched to Sofia IA)
  DEAL_IDLE: 'deal.idle',
  WHATSAPP_MESSAGE_IN: 'whatsapp.message.in',
  NOTE_CREATED: 'note.created',
} as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS]

const SOFIA_WEBHOOK_URL = process.env.SOFIA_WEBHOOK_URL
const SOFIA_WEBHOOK_SECRET = process.env.SOFIA_WEBHOOK_SECRET

/**
 * Sign webhook payload with HMAC-SHA256 for Sofia IA
 */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Dispatch webhook to Sofia IA (AgaaS orchestration brain)
 */
async function dispatchToSofia(
  event: WebhookEvent,
  organizationId: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!SOFIA_WEBHOOK_URL || !SOFIA_WEBHOOK_SECRET) {
    return
  }

  const body = JSON.stringify({
    event,
    organizationId,
    payload,
    timestamp: new Date().toISOString()
  })

  const signature = signPayload(body, SOFIA_WEBHOOK_SECRET)

  try {
    const response = await fetch(SOFIA_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sirius-Signature': signature,
        'X-Sirius-Event': event
      },
      body,
      signal: AbortSignal.timeout(10000) // 10s timeout
    })

    if (!response.ok) {
      logger.warn({
        event,
        organizationId,
        status: response.status
      }, 'Sofia webhook dispatch failed')
    } else {
      logger.info({
        event,
        organizationId
      }, 'Sofia webhook dispatched successfully')
    }
  } catch (error) {
    logger.error({
      event,
      organizationId,
      error
    }, 'Sofia webhook dispatch error')
  }
}

/**
 * Dispatch webhook to registered organization webhooks (API v1 subscribers)
 */
async function dispatchToSubscribers(
  organizationId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        organizationId,
        enabled: true
      }
    })

    // Filter webhooks that subscribe to this event (events stored as JSON array)
    const matchingWebhooks = webhooks.filter(w => {
      const events = w.events as string[]
      return Array.isArray(events) && events.includes(event)
    })

    for (const webhook of matchingWebhooks) {
      const body = JSON.stringify({
        event,
        payload,
        timestamp: new Date().toISOString()
      })

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body,
          signal: AbortSignal.timeout(10000)
        })

        // Log delivery
        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            organizationId,
            eventType: event,
            payload: payload as any,
            statusCode: response.status,
            status: response.ok ? 'SUCCESS' : 'FAILED',
            attempts: 1
          }
        })
      } catch (error) {
        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            organizationId,
            eventType: event,
            payload: payload as any,
            statusCode: 0,
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            attempts: 1
          }
        }).catch(() => {})

        logger.error({
          webhookId: webhook.id,
          event,
          error
        }, 'Webhook delivery failed')
      }
    }
  } catch (error) {
    logger.error({
      organizationId,
      event,
      error
    }, 'Error fetching webhook subscribers')
  }
}

/**
 * Despacha webhook assincronamente (não-bloqueante)
 *
 * Dispatches to:
 * 1. Sofia IA (AgaaS brain) via SOFIA_WEBHOOK_URL
 * 2. Registered organization webhook subscribers (API v1)
 */
export function dispatchWebhookAsync(
  organizationId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): void {
  // Fire-and-forget: dispatch to Sofia + subscribers in parallel
  Promise.all([
    dispatchToSofia(event, organizationId, payload),
    dispatchToSubscribers(organizationId, event, payload)
  ]).catch(error => {
    logger.error({ organizationId, event, error }, 'Webhook dispatch error')
  })
}

/**
 * Despacha webhook sincronamente (bloqueante)
 */
export async function dispatchWebhook(
  organizationId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  await Promise.all([
    dispatchToSofia(event, organizationId, payload),
    dispatchToSubscribers(organizationId, event, payload)
  ])
}
