import { sendWebhookMessage } from './svix-client'
import { WebhookEvent, createWebhookPayload } from './events'
import { prisma } from '../prisma'
import logger from '../logger'

/**
 * Dispatch webhook to all registered endpoints for an organization
 */
export async function dispatchWebhook<T = any>(
  organizationId: string,
  event: WebhookEvent,
  data: T
): Promise<void> {
  try {
    // Get organization
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, plan: true }
    })

    if (!org) {
      logger.error({ organizationId }, 'Organization not found for webhook dispatch')
      return
    }

    // Check if organization has PRO plan (webhooks are PRO feature)
    if (org.plan !== 'PRO') {
      logger.debug({
        organizationId,
        event
      }, 'Webhook skipped - organization not on PRO plan')
      return
    }

    // Get active webhooks for this organization that listen to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        organizationId,
        enabled: true,
        events: {
          path: '$',
          array_contains: event
        }
      }
    })

    if (webhooks.length === 0) {
      logger.debug({
        organizationId,
        event
      }, 'No active webhooks found for event')
      return
    }

    // Build payload
    const payload = createWebhookPayload(event, data, {
      id: organizationId,
      name: org.name
    })

    // Send webhook via Svix
    const result = await sendWebhookMessage(
      organizationId,
      org.name,
      event,
      payload
    )

    if (result.success) {
      logger.info({
        organizationId,
        event,
        messageId: result.messageId,
        webhooksCount: webhooks.length
      }, 'Webhook dispatched successfully')

      // Log webhook delivery for each endpoint
      for (const webhook of webhooks) {
        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            organizationId,
            eventType: event,
            payload,
            status: 'PENDING',
            svixMessageId: result.messageId,
            attempts: 1
          }
        }).catch(err => {
          logger.error({
            webhookId: webhook.id,
            error: err
          }, 'Failed to log webhook delivery')
        })
      }
    } else {
      logger.error({
        organizationId,
        event
      }, 'Failed to dispatch webhook')
    }
  } catch (error) {
    logger.error({
      organizationId,
      event,
      error
    }, 'Error dispatching webhook')
  }
}

/**
 * Dispatch webhook asynchronously (non-blocking)
 * Use this in server actions to avoid blocking user requests
 */
export function dispatchWebhookAsync<T = any>(
  organizationId: string,
  event: WebhookEvent,
  data: T
): void {
  // Fire and forget - don't await
  dispatchWebhook(organizationId, event, data).catch(err => {
    logger.error({
      organizationId,
      event,
      error: err
    }, 'Async webhook dispatch failed')
  })
}
