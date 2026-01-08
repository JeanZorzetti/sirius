import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from './api-keys'
import logger, { generateCorrelationId } from './logger'
import { prisma } from './prisma'

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
 * Rate Limiting Middleware (placeholder for Phase 2)
 * Will be implemented with Upstash Redis
 */
export async function withRateLimit(
  request: NextRequest,
  context: ApiContext,
  handler: (req: NextRequest, ctx: ApiContext) => Promise<Response>
): Promise<Response> {
  // TODO: Implement in Phase 2 with Upstash Redis
  // For now, just pass through to handler
  return await handler(request, context)
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
