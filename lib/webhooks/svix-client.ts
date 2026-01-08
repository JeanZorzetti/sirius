import { Svix } from 'svix'
import logger from '../logger'

let svixClient: Svix | null = null

/**
 * Initialize Svix client
 */
function getSvixClient(): Svix | null {
  if (!process.env.SVIX_API_KEY) {
    logger.warn('SVIX_API_KEY not configured - webhooks disabled')
    return null
  }

  if (!svixClient) {
    try {
      svixClient = new Svix(process.env.SVIX_API_KEY)
      logger.info('Svix client initialized')
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Svix client')
      return null
    }
  }

  return svixClient
}

/**
 * Create or get Svix application for an organization
 */
export async function getOrCreateSvixApp(
  organizationId: string,
  organizationName: string
): Promise<string | null> {
  const svix = getSvixClient()
  if (!svix) return null

  try {
    // Try to get existing app by UID (using organizationId as UID)
    try {
      const app = await svix.application.getOrCreate({
        uid: organizationId,
        name: `${organizationName} (${organizationId.substring(0, 8)})`
      })
      return app.id
    } catch (error) {
      logger.error({ organizationId, error }, 'Failed to get/create Svix app')
      return null
    }
  } catch (error) {
    logger.error({ organizationId, error }, 'Error in getOrCreateSvixApp')
    return null
  }
}

/**
 * Create webhook endpoint in Svix
 */
export async function createSvixEndpoint(
  organizationId: string,
  organizationName: string,
  url: string,
  events: string[],
  description?: string
): Promise<{ svixAppId: string; svixEndpointId: string } | null> {
  const svix = getSvixClient()
  if (!svix) return null

  try {
    // Get or create app
    const appId = await getOrCreateSvixApp(organizationId, organizationName)
    if (!appId) return null

    // Create endpoint
    const endpoint = await svix.endpoint.create(appId, {
      url,
      version: 1,
      filterTypes: events.length > 0 ? events : undefined,
      description: description || `Webhook endpoint for ${url}`
    })

    logger.info({
      organizationId,
      appId,
      endpointId: endpoint.id,
      url
    }, 'Svix endpoint created')

    return {
      svixAppId: appId,
      svixEndpointId: endpoint.id
    }
  } catch (error) {
    logger.error({
      organizationId,
      url,
      error
    }, 'Failed to create Svix endpoint')
    return null
  }
}

/**
 * Update webhook endpoint in Svix
 */
export async function updateSvixEndpoint(
  svixAppId: string,
  svixEndpointId: string,
  url?: string,
  events?: string[],
  description?: string
): Promise<boolean> {
  const svix = getSvixClient()
  if (!svix) return false

  try {
    const updateData: any = {}
    if (url) updateData.url = url
    if (events && events.length > 0) updateData.filterTypes = events
    if (description !== undefined) updateData.description = description

    await svix.endpoint.update(svixAppId, svixEndpointId, updateData)

    logger.info({
      svixAppId,
      svixEndpointId
    }, 'Svix endpoint updated')

    return true
  } catch (error) {
    logger.error({
      svixAppId,
      svixEndpointId,
      error
    }, 'Failed to update Svix endpoint')
    return false
  }
}

/**
 * Delete webhook endpoint from Svix
 */
export async function deleteSvixEndpoint(
  svixAppId: string,
  svixEndpointId: string
): Promise<boolean> {
  const svix = getSvixClient()
  if (!svix) return false

  try {
    await svix.endpoint.delete(svixAppId, svixEndpointId)

    logger.info({
      svixAppId,
      svixEndpointId
    }, 'Svix endpoint deleted')

    return true
  } catch (error) {
    logger.error({
      svixAppId,
      svixEndpointId,
      error
    }, 'Failed to delete Svix endpoint')
    return false
  }
}

/**
 * Get endpoint signing secret for verification
 */
export async function getEndpointSecret(
  svixAppId: string,
  svixEndpointId: string
): Promise<string | null> {
  const svix = getSvixClient()
  if (!svix) return null

  try {
    const secret = await svix.endpoint.getSecret(svixAppId, svixEndpointId)
    return secret.key
  } catch (error) {
    logger.error({
      svixAppId,
      svixEndpointId,
      error
    }, 'Failed to get endpoint secret')
    return null
  }
}

/**
 * Send webhook message via Svix
 */
export async function sendWebhookMessage(
  organizationId: string,
  organizationName: string,
  eventType: string,
  payload: any
): Promise<{ success: boolean; messageId?: string }> {
  const svix = getSvixClient()
  if (!svix) {
    return { success: false }
  }

  try {
    // Get or create app
    const appId = await getOrCreateSvixApp(organizationId, organizationName)
    if (!appId) {
      return { success: false }
    }

    // Send message
    const message = await svix.message.create(appId, {
      eventType,
      payload
    })

    logger.info({
      organizationId,
      appId,
      messageId: message.id,
      eventType
    }, 'Webhook message sent via Svix')

    return {
      success: true,
      messageId: message.id
    }
  } catch (error) {
    logger.error({
      organizationId,
      eventType,
      error
    }, 'Failed to send webhook message via Svix')
    return { success: false }
  }
}
