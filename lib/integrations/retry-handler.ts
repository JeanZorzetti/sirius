/**
 * Retry Handler for Integration Failures
 *
 * Automatically retries failed integrations with exponential backoff:
 * - Attempt 1: 5 minutes
 * - Attempt 2: 30 minutes
 * - Attempt 3: 2 hours
 *
 * After 3 failed attempts, sends alert email to organization owner.
 */

import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { sendIntegrationFailureAlert } from './alerting'

// Retry delays in milliseconds
const RETRY_DELAYS = [
  5 * 60 * 1000,      // 5 minutes
  30 * 60 * 1000,     // 30 minutes
  2 * 60 * 60 * 1000  // 2 hours
]

const MAX_RETRIES = 3

/**
 * Process failed integration logs and retry them
 * Should be run periodically (e.g., every 5 minutes via cron)
 */
export async function processRetries(): Promise<{
  processed: number
  retried: number
  failed: number
  alerted: number
}> {
  const now = new Date()
  let processed = 0
  let retried = 0
  let failed = 0
  let alerted = 0

  try {
    // Find failed logs that need retry
    const failedLogs = await prisma.integrationLog.findMany({
      where: {
        status: 'FAILED',
        attemptCount: { lt: MAX_RETRIES }
      },
      orderBy: { createdAt: 'asc' },
      take: 50 // Process up to 50 at a time
    })

    logger.info({ count: failedLogs.length }, 'Processing integration retries')

    for (const log of failedLogs) {
      processed++

      const attemptCount = log.attemptCount
      const nextRetryDelay = RETRY_DELAYS[attemptCount - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
      const nextRetryTime = new Date(log.createdAt.getTime() + nextRetryDelay)

      // Check if it's time to retry
      if (now < nextRetryTime) {
        continue // Not time yet
      }

      try {
        // Retry the integration based on type
        const retryResult = await retryIntegration(log)

        if (retryResult.success) {
          // Update log as successful
          await prisma.integrationLog.update({
            where: { id: log.id },
            data: {
              status: 'SUCCESS',
              response: retryResult.response || null,
              errorMessage: null
            }
          })
          retried++

          logger.info({
            logId: log.id,
            type: log.type,
            action: log.action,
            attempt: attemptCount
          }, 'Integration retry successful')
        } else {
          // Increment attempt count
          const newAttemptCount = attemptCount + 1

          if (newAttemptCount >= MAX_RETRIES) {
            // Max retries reached, send alert
            await prisma.integrationLog.update({
              where: { id: log.id },
              data: {
                status: 'FAILED',
                attemptCount: newAttemptCount,
                errorMessage: retryResult.error || 'Max retries exceeded'
              }
            })

            // Send alert email
            const organization = await prisma.organization.findUnique({
              where: { id: log.organizationId },
              select: {
                name: true,
                users: {
                  where: { orgRole: 'OWNER' },
                  select: { email: true, name: true }
                }
              }
            })

            if (organization && organization.users.length > 0) {
              await sendIntegrationFailureAlert({
                organizationName: organization.name,
                ownerEmail: organization.users[0].email,
                ownerName: organization.users[0].name || 'Admin',
                integrationType: log.type,
                action: log.action,
                errorMessage: retryResult.error || 'Unknown error',
                attemptCount: newAttemptCount,
                logId: log.id
              })
              alerted++
            }

            failed++
            logger.error({
              logId: log.id,
              type: log.type,
              action: log.action,
              attempts: newAttemptCount,
              error: retryResult.error
            }, 'Integration retry failed - max attempts reached')
          } else {
            // Update for next retry
            await prisma.integrationLog.update({
              where: { id: log.id },
              data: {
                status: 'RETRYING',
                attemptCount: newAttemptCount,
                errorMessage: retryResult.error || 'Retry in progress'
              }
            })

            logger.warn({
              logId: log.id,
              type: log.type,
              action: log.action,
              attempt: newAttemptCount,
              nextRetry: new Date(now.getTime() + RETRY_DELAYS[newAttemptCount - 1]).toISOString()
            }, 'Integration retry failed - will retry again')
          }
        }
      } catch (error: any) {
        logger.error({
          error,
          logId: log.id,
          type: log.type
        }, 'Error processing retry')
      }
    }

    logger.info({
      processed,
      retried,
      failed,
      alerted
    }, 'Integration retry processing completed')

    return { processed, retried, failed, alerted }
  } catch (error: any) {
    logger.error({ error }, 'Error in processRetries')
    throw error
  }
}

/**
 * Retry a specific integration based on its type
 */
async function retryIntegration(log: {
  id: string
  type: string
  action: string
  request: any
  organizationId: string
}): Promise<{ success: boolean; response?: any; error?: string }> {
  try {
    switch (log.type) {
      case 'N8N':
        return await retryN8N(log)
      case 'WHATSAPP':
        return await retryWhatsApp(log)
      case 'GOOGLE_CALENDAR':
        return await retryGoogleCalendar(log)
      default:
        return {
          success: false,
          error: `Unknown integration type: ${log.type}`
        }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Retry failed'
    }
  }
}

/**
 * Retry N8N webhook dispatch
 */
async function retryN8N(log: any): Promise<{ success: boolean; response?: any; error?: string }> {
  try {
    const { getN8NClient } = await import('./n8n-client')
    const client = await getN8NClient(log.organizationId)

    if (!client) {
      return { success: false, error: 'N8N client not configured' }
    }

    // Get organization webhook URL
    const org = await prisma.organization.findUnique({
      where: { id: log.organizationId },
      select: { n8nWebhookUrl: true }
    })

    if (!org?.n8nWebhookUrl) {
      return { success: false, error: 'N8N webhook URL not configured' }
    }

    // Resend webhook
    const response = await fetch(org.n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log.request)
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    return { success: true, response: await response.json() }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Retry WhatsApp message via Whatsmeow Gateway
 */
async function retryWhatsApp(log: any): Promise<{ success: boolean; response?: any; error?: string }> {
  try {
    const { whatsmeowClient } = await import('./whatsmeow-client')
    const { prismaWa } = await import('@/lib/prisma-wa')

    // Find active connection for the organization
    const connection = await prismaWa.whatsAppConnection.findFirst({
      where: { organizationId: log.organizationId, status: 'CONNECTED' }
    })

    if (!connection) {
      return { success: false, error: 'No active WhatsApp connection' }
    }

    // Extract message data from request
    const { remoteJid, text } = log.request || {}

    if (!remoteJid || !text) {
      return { success: false, error: 'Invalid message data in log' }
    }

    // Normalize phone (strip @s.whatsapp.net if present)
    const phone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '')

    await whatsmeowClient.sendText(connection.instanceName, phone, text)

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Retry Google Calendar event creation
 */
async function retryGoogleCalendar(log: any): Promise<{ success: boolean; response?: any; error?: string }> {
  try {
    const { getGoogleCalendarClient } = await import('./google-calendar-client')
    const client = await getGoogleCalendarClient(log.organizationId)

    if (!client) {
      return { success: false, error: 'Google Calendar client not configured' }
    }

    // Extract event data from request
    const eventData = log.request

    if (!eventData) {
      return { success: false, error: 'Invalid event data in log' }
    }

    // Recreate event
    const event = await client.createEvent(eventData)

    return { success: true, response: { eventId: event.id } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get retry status for a specific organization
 */
export async function getRetryStatus(organizationId: string): Promise<{
  pending: number
  retrying: number
  failed: number
}> {
  const [pending, retrying, failed] = await Promise.all([
    prisma.integrationLog.count({
      where: {
        organizationId,
        status: 'FAILED',
        attemptCount: { lt: MAX_RETRIES }
      }
    }),
    prisma.integrationLog.count({
      where: {
        organizationId,
        status: 'RETRYING'
      }
    }),
    prisma.integrationLog.count({
      where: {
        organizationId,
        status: 'FAILED',
        attemptCount: { gte: MAX_RETRIES }
      }
    })
  ])

  return { pending, retrying, failed }
}
