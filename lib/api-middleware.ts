import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from './api-keys'
import logger, { generateCorrelationId } from './logger'
import { prisma } from './prisma'
import { checkRateLimit } from './rate-limit'

export interface ApiContext {
  organizationId: string
  apiKeyId: string
  requestId: string
  plan: 'FREE' | 'PRO'
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta: {
    requestId: string
    timestamp: string
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Create standardized API response
 */
export function apiResponse<T = any>(
  requestId: string,
  data?: T,
  error?: { code: string; message: string; details?: any }
): ApiResponse<T> {
  return {
    success: !error,
    ...(data && { data }),
    ...(error && { error }),
    meta: {
      requestId,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * API Authentication Middleware
 * Validates Bearer token (API key) and adds context to request
 */
export async function withApiAuth(
  request: NextRequest,
  handler: (req: NextRequest, ctx: ApiContext) => Promise<Response>
): Promise<Response> {
  const requestId = generateCorrelationId()

  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        apiResponse(
          requestId,
          undefined,
          {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid Authorization header. Use: Bearer YOUR_API_KEY'
          }
        ),
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7) // Remove 'Bearer '

    // Validate API key
    const validation = await validateApiKey(apiKey)

    if (!validation.valid || !validation.organizationId) {
      return NextResponse.json(
        apiResponse(
          requestId,
          undefined,
          {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired API key'
          }
        ),
        { status: 401 }
      )
    }

    // Get organization plan
    const org = await prisma.organization.findUnique({
      where: { id: validation.organizationId },
      select: { plan: true }
    })

    if (!org) {
      return NextResponse.json(
        apiResponse(
          requestId,
          undefined,
          {
            code: 'ORGANIZATION_NOT_FOUND',
            message: 'Organization not found'
          }
        ),
        { status: 404 }
      )
    }

    // Create context
    const context: ApiContext = {
      organizationId: validation.organizationId,
      apiKeyId: validation.apiKeyId!,
      requestId,
      plan: org.plan === 'PRO' ? 'PRO' : 'FREE'
    }

    logger.info({
      requestId,
      organizationId: context.organizationId,
      method: request.method,
      path: request.nextUrl.pathname,
      plan: context.plan
    }, 'API request authenticated')

    // Call handler with context
    return await handler(request, context)

  } catch (error) {
    logger.error({ requestId, error }, 'API authentication error')

    return NextResponse.json(
      apiResponse(
        requestId,
        undefined,
        {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      ),
      { status: 500 }
    )
  }
}

/**
 * Rate Limiting Middleware
 * Enforces rate limits based on organization plan (FREE vs PRO)
 */
export async function withRateLimit(
  request: NextRequest,
  context: ApiContext,
  handler: (req: NextRequest, ctx: ApiContext) => Promise<Response>
): Promise<Response> {
  try {
    // Check rate limit
    const rateLimit = await checkRateLimit(context.organizationId, context.plan)

    // Add rate limit headers to response
    const rateLimitHeaders = {
      'X-RateLimit-Limit': rateLimit.limit.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.reset.toString()
    }

    // If rate limit exceeded, return 429
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000)

      logger.warn({
        requestId: context.requestId,
        organizationId: context.organizationId,
        plan: context.plan,
        limit: rateLimit.limit,
        remaining: rateLimit.remaining
      }, 'Rate limit exceeded')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Limit: ${rateLimit.limit} requests per minute. Try again in ${retryAfter} seconds.`,
            details: {
              limit: rateLimit.limit,
              remaining: rateLimit.remaining,
              reset: rateLimit.reset,
              retryAfter
            }
          }
        ),
        {
          status: 429,
          headers: {
            ...rateLimitHeaders,
            'Retry-After': retryAfter.toString()
          }
        }
      )
    }

    // Execute handler
    const response = await handler(request, context)

    // Add rate limit headers to successful response
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    logger.error({
      requestId: context.requestId,
      organizationId: context.organizationId,
      error
    }, 'Rate limiting error')

    // On error, allow the request (fail open)
    return await handler(request, context)
  }
}

/**
 * Combined API Middleware
 * Applies authentication and rate limiting
 */
export async function withApiMiddleware(
  request: NextRequest,
  handler: (req: NextRequest, ctx: ApiContext) => Promise<Response>
): Promise<Response> {
  return withApiAuth(request, async (req, ctx) => {
    return withRateLimit(req, ctx, handler)
  })
}

/**
 * Check if organization has PRO plan
 */
export function requirePro(context: ApiContext): boolean {
  return context.plan === 'PRO'
}

/**
 * Middleware to enforce PRO plan
 */
export async function withProPlan(
  request: NextRequest,
  context: ApiContext,
  handler: (req: NextRequest, ctx: ApiContext) => Promise<Response>
): Promise<Response> {
  if (!requirePro(context)) {
    return NextResponse.json(
      apiResponse(
        context.requestId,
        undefined,
        {
          code: 'PRO_REQUIRED',
          message: 'This endpoint requires a PRO plan. Upgrade at /dashboard/settings/billing'
        }
      ),
      { status: 403 }
    )
  }

  return await handler(request, context)
}
