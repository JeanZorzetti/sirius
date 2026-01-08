import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import logger from './logger'

/**
 * Generate a new API key for an organization
 * Returns the full key (only shown once) and metadata
 */
export async function generateApiKey(organizationId: string, name: string) {
  try {
    // Generate random key
    const randomPart = randomBytes(32).toString('hex')
    const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test'
    const fullKey = `sk_${environment}_${randomPart}`

    // Hash key using bcrypt
    const keyHash = await bcrypt.hash(fullKey, 10)
    const keyPrefix = fullKey.substring(0, 12) // e.g., "sk_live_1234"

    // Store in database
    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        keyHash,
        keyPrefix,
        organizationId,
        requestCount: 0
      }
    })

    logger.info({
      organizationId,
      apiKeyId: apiKey.id,
      keyPrefix
    }, 'API key generated')

    return {
      id: apiKey.id,
      key: fullKey, // Return full key ONCE - never stored in plain text
      prefix: keyPrefix,
      name: apiKey.name,
      createdAt: apiKey.createdAt
    }
  } catch (error) {
    logger.error({ organizationId, error }, 'Failed to generate API key')
    throw error
  }
}

/**
 * Validate an API key
 * Returns validation result with organizationId if valid
 */
export async function validateApiKey(key: string): Promise<{
  valid: boolean
  organizationId?: string
  apiKeyId?: string
}> {
  try {
    if (!key || !key.startsWith('sk_')) {
      return { valid: false }
    }

    const prefix = key.substring(0, 12)

    // Find API keys by prefix (faster lookup)
    const apiKeys = await prisma.apiKey.findMany({
      where: { keyPrefix: prefix },
      select: {
        id: true,
        keyHash: true,
        organizationId: true,
        expiresAt: true
      }
    })

    // Compare hash for each matching prefix
    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(key, apiKey.keyHash)

      if (isValid) {
        // Check expiration
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
          logger.warn({
            apiKeyId: apiKey.id,
            keyPrefix: prefix
          }, 'Expired API key attempt')
          return { valid: false }
        }

        // Update last used (async, non-blocking)
        prisma.apiKey.update({
          where: { id: apiKey.id },
          data: {
            lastUsed: new Date(),
            requestCount: { increment: 1 }
          }
        }).catch(err => {
          logger.error({
            apiKeyId: apiKey.id,
            error: err
          }, 'Failed to update API key stats')
        })

        return {
          valid: true,
          organizationId: apiKey.organizationId,
          apiKeyId: apiKey.id
        }
      }
    }

    logger.warn({ keyPrefix: prefix }, 'Invalid API key attempt')
    return { valid: false }

  } catch (error) {
    logger.error({ error }, 'Error validating API key')
    return { valid: false }
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(apiKeyId: string, organizationId: string) {
  try {
    await prisma.apiKey.delete({
      where: {
        id: apiKeyId,
        organizationId // Ensure organization owns this key
      }
    })

    logger.info({ apiKeyId, organizationId }, 'API key revoked')
    return { success: true }
  } catch (error) {
    logger.error({ apiKeyId, organizationId, error }, 'Failed to revoke API key')
    throw error
  }
}

/**
 * List API keys for an organization
 */
export async function listApiKeys(organizationId: string) {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsed: true,
        requestCount: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return apiKeys
  } catch (error) {
    logger.error({ organizationId, error }, 'Failed to list API keys')
    throw error
  }
}
