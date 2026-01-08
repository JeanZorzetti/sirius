import { sendWebhookMessage } from './svix-client'
import { WebhookEvent, createWebhookPayload } from './events'
import { prisma } from '../prisma'
import logger from '../logger'
import { logN8NActivity, checkN8NRateLimit } from '../integrations/n8n-client'

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
      select: {
        name: true,
        plan: true,
        n8nEnabled: true,
        n8nWebhookUrl: true
      }
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
          array_contains: [event]
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

    // Send to N8N if configured (independent of Svix)
    if (org.n8nEnabled && org.n8nWebhookUrl) {
      try {
        // Check rate limit
        const rateLimitResult = await checkN8NRateLimit(organizationId)

        if (rateLimitResult) {
          const n8nResponse = await fetch(org.n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          if (n8nResponse.ok) {
            logger.info({
              organizationId,
              event,
              url: org.n8nWebhookUrl
            }, 'N8N webhook sent successfully')

            await logN8NActivity(
              organizationId,
              `webhook:${event}`,
              'SUCCESS',
              { event, url: org.n8nWebhookUrl },
              { status: n8nResponse.status, sent: true }
            )
          } else {
            const errorText = await n8nResponse.text()
            throw new Error(`N8N responded with ${n8nResponse.status}: ${errorText}`)
          }
        } else {
          logger.warn({ organizationId }, 'N8N rate limit exceeded, skipping webhook')
          await logN8NActivity(
            organizationId,
            `webhook:${event}`,
            'FAILED',
            { event, url: org.n8nWebhookUrl },
            null,
            'Rate limit exceeded'
          )
        }
      } catch (n8nError: any) {
        logger.error({
          organizationId,
          event,
          error: n8nError,
          url: org.n8nWebhookUrl
        }, 'Failed to send N8N webhook')

        await logN8NActivity(
          organizationId,
          `webhook:${event}`,
          'FAILED',
          { event, url: org.n8nWebhookUrl },
          null,
          n8nError.message
        )
      }
    }

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
            payload: payload as any,
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
