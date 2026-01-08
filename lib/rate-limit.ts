import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import logger from './logger'

// Rate limit configuration
export const RATE_LIMITS = {
  FREE: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000
  },
  PRO: {
    requestsPerMinute: 300,
    requestsPerHour: 10000,
    requestsPerDay: 100000
  }
} as const

// Initialize Redis client
let redis: Redis | null = null
let freeLimiter: Ratelimit | null = null
let proLimiter: Ratelimit | null = null

function initializeRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    logger.warn('Upstash Redis credentials not configured - rate limiting disabled')
    return false
  }

  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    // Create rate limiters for each plan
    freeLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.FREE.requestsPerMinute,
        '1 m'
      ),
      analytics: true,
      prefix: 'ratelimit:api:free'
    })

    proLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.PRO.requestsPerMinute,
        '1 m'
      ),
      analytics: true,
      prefix: 'ratelimit:api:pro'
    })

    logger.info('Rate limiting initialized with Upstash Redis')
    return true
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Upstash Redis')
    return false
  }
}

// Initialize on module load
const isInitialized = initializeRedis()

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check rate limit for an organization
 * Returns rate limit status and headers
 */
export async function checkRateLimit(
  organizationId: string,
  plan: 'FREE' | 'PRO'
): Promise<RateLimitResult> {
  // If Redis not configured, allow all requests (for development)
  if (!isInitialized || !freeLimiter || !proLimiter) {
    logger.warn({ organizationId }, 'Rate limiting bypassed - Redis not configured')
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: Date.now() + 60000
    }
  }

  try {
    const limiter = plan === 'PRO' ? proLimiter : freeLimiter
    const identifier = `org:${organizationId}`

    const result = await limiter.limit(identifier)

    logger.debug({
      organizationId,
      plan,
      success: result.success,
      limit: result.limit,
      remaining: result.remaining
    }, 'Rate limit check')

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset
    }
  } catch (error) {
    logger.error({
      organizationId,
      plan,
      error
    }, 'Rate limit check failed')

    // On error, allow the request (fail open)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60000
    }
  }
}

/**
 * Get rate limit info for display purposes
 */
export function getRateLimitInfo(plan: 'FREE' | 'PRO') {
  return RATE_LIMITS[plan]
}

/**
 * Reset rate limit for an organization (admin function)
 */
export async function resetRateLimit(organizationId: string, plan: 'FREE' | 'PRO') {
  if (!redis) {
    throw new Error('Redis not configured')
  }

  try {
    const prefix = plan === 'PRO' ? 'ratelimit:api:pro' : 'ratelimit:api:free'
    const key = `${prefix}:org:${organizationId}`

    await redis.del(key)

    logger.info({ organizationId, plan }, 'Rate limit reset')
    return { success: true }
  } catch (error) {
    logger.error({ organizationId, plan, error }, 'Failed to reset rate limit')
    throw error
  }
}
