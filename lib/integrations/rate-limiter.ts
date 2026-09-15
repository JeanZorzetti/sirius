/**
 * Integration Rate Limiting
 *
 * N8N: 100 requests/hour per organization (webhooks + API calls)
 *
 * Uses Upstash Redis with sliding window algorithm
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ponytail: null without Upstash credentials — callers skip the limit, same as lib/plan-quota.ts
export const n8nRateLimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN
        }),
        limiter: Ratelimit.slidingWindow(100, '1 h'),
        prefix: 'ratelimit:n8n',
        analytics: true
      })
    : null
