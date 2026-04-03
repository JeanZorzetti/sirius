import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// Rate Limiting — Upstash Redis (prod) + In-Memory (fallback)
// ============================================================

type RateLimitConfig = {
  /** Max requests allowed in the window */
  limit: number
  /** Window duration in seconds */
  windowSeconds: number
}

// --------------- In-memory store (dev/fallback) ---------------
const memoryStore = new Map<string, { count: number; resetAt: number }>()

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of memoryStore) {
      if (val.resetAt < now) memoryStore.delete(key)
    }
  }, 5 * 60 * 1000)
}

function memoryRateLimit(
  key: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowSeconds * 1000
    memoryStore.set(key, { count: 1, resetAt })
    return { success: true, remaining: config.limit - 1, reset: resetAt }
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, reset: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: config.limit - entry.count, reset: entry.resetAt }
}

// --------------- Upstash Redis rate limit ---------------
let upstashAvailable: boolean | null = null
let redisClient: any = null
let Ratelimit: any = null

async function getUpstash() {
  if (upstashAvailable === false) return null
  if (upstashAvailable === true) return { redis: redisClient, Ratelimit }

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) {
      upstashAvailable = false
      return null
    }

    const { Redis } = await import('@upstash/redis')
    const { Ratelimit: RL } = await import('@upstash/ratelimit')
    redisClient = new Redis({ url, token })
    Ratelimit = RL
    upstashAvailable = true
    return { redis: redisClient, Ratelimit: RL }
  } catch {
    upstashAvailable = false
    return null
  }
}

// Cache of Upstash Ratelimit instances per prefix
const upstashLimiters = new Map<string, any>()

async function upstashRateLimit(
  key: string,
  prefix: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; reset: number } | null> {
  const u = await getUpstash()
  if (!u) return null

  let limiter = upstashLimiters.get(prefix)
  if (!limiter) {
    limiter = new u.Ratelimit({
      redis: u.redis,
      limiter: u.Ratelimit.slidingWindow(config.limit, `${config.windowSeconds}s`),
      prefix: `ratelimit:${prefix}`,
    })
    upstashLimiters.set(prefix, limiter)
  }

  const result = await limiter.limit(key)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}

// --------------- Public API ---------------

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

/**
 * Check rate limit. Returns null if allowed, or a NextResponse (429) if blocked.
 *
 * Usage:
 *   const blocked = await checkRateLimit(req, 'auth', { limit: 5, windowSeconds: 900 })
 *   if (blocked) return blocked
 */
export async function checkRateLimit(
  req: NextRequest,
  prefix: string,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const ip = getClientIP(req)
  const key = `${prefix}:${ip}`

  // Try Upstash first, fall back to memory
  const result =
    (await upstashRateLimit(key, prefix, config)) ??
    memoryRateLimit(key, config)

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente mais tarde.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(retryAfter, 1)),
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.reset),
        },
      }
    )
  }

  return null
}

// --------------- Pre-configured limiters ---------------

/** Auth routes: 5 req / 15 min per IP */
export const authRateLimit = (req: NextRequest) =>
  checkRateLimit(req, 'auth', { limit: 5, windowSeconds: 15 * 60 })

/** AGI routes: 200 req / 1 hour per IP */
export const agiRateLimit = (req: NextRequest) =>
  checkRateLimit(req, 'agi', { limit: 200, windowSeconds: 60 * 60 })

/** Contact form: 3 req / 1 hour per IP */
export const contactRateLimit = (req: NextRequest) =>
  checkRateLimit(req, 'contact', { limit: 3, windowSeconds: 60 * 60 })

/** Lead capture: 10 req / 1 hour per IP */
export const leadCaptureRateLimit = (req: NextRequest) =>
  checkRateLimit(req, 'lead', { limit: 10, windowSeconds: 60 * 60 })

/** Webhook routes: 200 req / 1 min per IP (generous for external services) */
export const webhookRateLimit = (req: NextRequest) =>
  checkRateLimit(req, 'webhook', { limit: 200, windowSeconds: 60 })

/** Analytics ingest: 60 req / 1 min per IP (Beacon API) */
export const analyticsIngestRateLimit = (req: NextRequest) =>
  checkRateLimit(req, 'analytics-ingest', { limit: 60, windowSeconds: 60 })

/** Public endpoints (health, docs, indexnow): 20 req / 1 min per IP */
export const publicRateLimit = (req: NextRequest) =>
  checkRateLimit(req, 'public', { limit: 20, windowSeconds: 60 })

/** Billing/checkout: 10 req / 15 min per IP */
export const billingRateLimit = (req: NextRequest) =>
  checkRateLimit(req, 'billing', { limit: 10, windowSeconds: 15 * 60 })

/** Scraping: 5 req / 10 min per IP */
export const scrapingRateLimit = (req: NextRequest) =>
  checkRateLimit(req, 'scraping', { limit: 5, windowSeconds: 10 * 60 })
