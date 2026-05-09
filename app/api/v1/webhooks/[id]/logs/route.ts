import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPaginationParams, getPaginationMeta, paginatedResponse } from '@/lib/api-helpers'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * GET /api/v1/webhooks/[id]/logs
 * Get webhook delivery logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })

    if (!user) {
      return await apiError(ERR.USER_NOT_FOUND, 404, { req: request })
    }

    // Verify webhook belongs to organization
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: paramsData.id,
        organizationId: user.organizationId
      }
    })

    if (!webhook) {
      return await apiError(ERR.WEBHOOK_NOT_FOUND, 404, { req: request })
    }

    // Parse pagination
    const { page, limit, offset } = getPaginationParams(request)

    // Get total count
    const total = await prisma.webhookLog.count({
      where: { webhookId: paramsData.id }
    })

    // Get logs
    const logs = await prisma.webhookLog.findMany({
      where: { webhookId: paramsData.id },
      orderBy: { sentAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        eventType: true,
        status: true,
        statusCode: true,
        errorMessage: true,
        attempts: true,
        svixMessageId: true,
        sentAt: true
      }
    })

    // Format response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      eventType: log.eventType,
      status: log.status,
      statusCode: log.statusCode,
      errorMessage: log.errorMessage,
      attempts: log.attempts,
      svixMessageId: log.svixMessageId,
      sentAt: log.sentAt.toISOString()
    }))

    const pagination = getPaginationMeta(page, limit, total)

    // Generate requestId for response
    const requestId = `log-${Date.now()}`

    return NextResponse.json(
      paginatedResponse(requestId, formattedLogs, pagination)
    )
  } catch (error) {
    logger.error({ error }, 'Error fetching webhook logs')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}
