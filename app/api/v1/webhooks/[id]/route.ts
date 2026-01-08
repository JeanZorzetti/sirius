import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateRequest, updateWebhookSchema } from '@/lib/api-validators'
import { updateSvixEndpoint, deleteSvixEndpoint, getEndpointSecret } from '@/lib/webhooks/svix-client'
import { getAllWebhookEvents } from '@/lib/webhooks/events'
import logger from '@/lib/logger'

/**
 * GET /api/v1/webhooks/[id]
 * Get webhook details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const webhook = await prisma.webhook.findFirst({
      where: {
        id: params.id,
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
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      )
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
    return NextResponse.json(
      { error: 'Erro ao buscar webhook' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/v1/webhooks/[id]
 * Update webhook
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Find webhook
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId
      }
    })

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      )
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
      where: { id: params.id },
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
    return NextResponse.json(
      { error: 'Erro ao atualizar webhook' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/webhooks/[id]
 * Delete webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Find webhook
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId
      }
    })

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      )
    }

    // Delete from Svix
    await deleteSvixEndpoint(webhook.svixAppId, webhook.svixEndpointId)

    // Delete from database (cascade deletes logs)
    await prisma.webhook.delete({
      where: { id: params.id }
    })

    logger.info({
      organizationId: user.organizationId,
      webhookId: params.id
    }, 'Webhook deleted')

    return NextResponse.json({
      success: true,
      message: 'Webhook deletado com sucesso'
    })
  } catch (error) {
    logger.error({ error }, 'Error deleting webhook')
    return NextResponse.json(
      { error: 'Erro ao deletar webhook' },
      { status: 500 }
    )
  }
}
