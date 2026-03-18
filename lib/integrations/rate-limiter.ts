/**
 * Integration Rate Limiting
 *
 * Per-organization rate limits for external integrations:
 * - N8N: 100 requests/hour (webhooks + API calls)
 * - WhatsApp (Evolution API): 50 requests/hour (messages sent)
 * - Google Calendar: 200 requests/hour (API calls)
 *
 * Uses Upstash Redis with sliding window algorithm
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

/**
 * N8N Rate Limiter
 *
 * Limit: 100 requests per hour per organization
 * Covers both webhook sends and API calls to N8N
 */
export const n8nRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  prefix: 'ratelimit:n8n',
  analytics: true
})

/**
 * WhatsApp (Evolution API) Rate Limiter
 *
 * Limit: 50 requests per hour per organization
 * Conservative limit to avoid WhatsApp number bans
 */
export const whatsappRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 h'),
  prefix: 'ratelimit:whatsapp',
  analytics: true
})

/**
 * WhatsApp Official API (Meta Cloud API) Rate Limiter
 *
 * Limit: 80 requests per hour per organization
 * Meta allows higher throughput but we keep conservative to avoid quality flags
 */
export const whatsappOfficialRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(80, '1 h'),
  prefix: 'ratelimit:waba',
  analytics: true
})

/**
 * Google Calendar Rate Limiter
 *
 * Limit: 200 requests per hour per organization
 * Higher limit due to bidirectional sync requirements
 */
export const googleCalendarRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '1 h'),
  prefix: 'ratelimit:calendar',
  analytics: true
})

/**
 * Check rate limit for an integration
 *
 * @param integration - Integration type ('n8n', 'whatsapp', 'google-calendar')
 * @param organizationId - Organization ID to rate limit
 * @returns { success: boolean, limit: number, remaining: number, reset: number }
 */
export async function checkRateLimit(
  integration: 'n8n' | 'whatsapp' | 'google-calendar',
  organizationId: string
) {
  let limiter: Ratelimit

  switch (integration) {
    case 'n8n':
      limiter = n8nRateLimit
      break
    case 'whatsapp':
      limiter = whatsappRateLimit
      break
    case 'google-calendar':
      limiter = whatsappRateLimit
      break
    default:
      throw new Error(`Unknown integration: ${integration}`)
  }

  const result = await limiter.limit(organizationId)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset
  }
}

/**
 * Reset rate limit for an organization (admin use only)
 *
 * @param integration - Integration type
 * @param organizationId - Organization ID
 */
export async function resetRateLimit(
  integration: 'n8n' | 'whatsapp' | 'google-calendar',
  organizationId: string
) {
  const prefix = integration === 'n8n'
    ? 'ratelimit:n8n'
    : integration === 'whatsapp'
    ? 'ratelimit:whatsapp'
    : 'ratelimit:calendar'

  await redis.del(`${prefix}:${organizationId}`)
}
