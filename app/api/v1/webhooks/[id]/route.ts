import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateRequest, updateWebhookSchema } from '@/lib/api-validators'
import { updateSvixEndpoint, deleteSvixEndpoint, getEndpointSecret } from '@/lib/webhooks/svix-client'
import { getAllWebhookEvents } from '@/lib/webhooks/events'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * GET /api/v1/webhooks/[id]
 * Get webhook details
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

    const webhook = await prisma.webhook.findFirst({
      where: {
        id: paramsData.id,
        organizationId: user.organizationId
      },
      include: {
        _count: {
          select: {
            logs: true
          }
        }
      }
    })

    if (!webhook) {
      return await apiError(ERR.WEBHOOK_NOT_FOUND, 404, { req: request })
    }

    // Get signing secret from Svix
    const secret = await getEndpointSecret(webhook.svixAppId, webhook.svixEndpointId)

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        url: webhook.url,
        description: webhook.description,
        enabled: webhook.enabled,
        events: webhook.events,
        secret: secret || undefined,
        logsCount: webhook._count.logs,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt
      }
    })
  } catch (error) {
    logger.error({ error }, 'Error getting webhook')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}

/**
 * PATCH /api/v1/webhooks/[id]
 * Update webhook
 */
export async function PATCH(
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

    // Find webhook
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: paramsData.id,
        organizationId: user.organizationId
      }
    })

    if (!webhook) {
      return await apiError(ERR.WEBHOOK_NOT_FOUND, 404, { req: request })
    }

    // Validate request body
    const validation = await validateRequest(request, updateWebhookSchema)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validação falhou',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Validate events if provided
    if (data.events) {
      const validEvents = getAllWebhookEvents()
      const invalidEvents = data.events.filter(e => !validEvents.includes(e as any))

      if (invalidEvents.length > 0) {
        return NextResponse.json(
          {
            error: 'Eventos inválidos',
            details: invalidEvents
          },
          { status: 400 }
        )
      }
    }

    // Update in Svix if URL or events changed
    if (data.url || data.events || data.description) {
      const success = await updateSvixEndpoint(
        webhook.svixAppId,
        webhook.svixEndpointId,
        data.url,
        data.events,
        data.description
      )

      if (!success) {
        return NextResponse.json(
          { error: 'Falha ao atualizar webhook no Svix' },
          { status: 500 }
        )
      }
    }

    // Update in database
    const updated = await prisma.webhook.update({
      where: { id: paramsData.id },
      data: {
        ...(data.url && { url: data.url }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.events && { events: data.events }),
        ...(data.enabled !== undefined && { enabled: data.enabled })
      }
    })

    logger.info({
      organizationId: user.organizationId,
      webhookId: updated.id
    }, 'Webhook updated')

    return NextResponse.json({
      webhook: {
        id: updated.id,
        url: updated.url,
        description: updated.description,
        enabled: updated.enabled,
        events: updated.events,
        updatedAt: updated.updatedAt
      }
    })
  } catch (error) {
    logger.error({ error }, 'Error updating webhook')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}

/**
 * DELETE /api/v1/webhooks/[id]
 * Delete webhook
 */
export async function DELETE(
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

    // Find webhook
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: paramsData.id,
        organizationId: user.organizationId
      }
    })

    if (!webhook) {
      return await apiError(ERR.WEBHOOK_NOT_FOUND, 404, { req: request })
    }

    // Delete from Svix
    await deleteSvixEndpoint(webhook.svixAppId, webhook.svixEndpointId)

    // Delete from database (cascade deletes logs)
    await prisma.webhook.delete({
      where: { id: paramsData.id }
    })

    logger.info({
      organizationId: user.organizationId,
      webhookId: paramsData.id
    }, 'Webhook deleted')

    return NextResponse.json({
      success: true,
      message: 'Webhook deletado com sucesso'
    })
  } catch (error) {
    logger.error({ error }, 'Error deleting webhook')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}
