import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateRequest, createWebhookSchema } from '@/lib/api-validators'
import { createSvixEndpoint } from '@/lib/webhooks/svix-client'
import { getAllWebhookEvents } from '@/lib/webhooks/events'
import logger from '@/lib/logger'

/**
 * GET /api/v1/webhooks
 * List all webhooks for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
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
      select: {
        organizationId: true,
        organization: { select: { plan: true } }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Check PRO or BUSINESS plan
    if (!['PRO', 'BUSINESS'].includes(user.organization.plan)) {
      return NextResponse.json(
        {
          error: 'Webhooks são uma funcionalidade PRO. Faça upgrade em /dashboard/settings/billing'
        },
        { status: 403 }
      )
    }

    const webhooks = await prisma.webhook.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        description: true,
        enabled: true,
        events: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { logs: true }
        }
      }
    })

    return NextResponse.json({ webhooks })
  } catch (error) {
    logger.error({ error }, 'Error listing webhooks')
    return NextResponse.json(
      { error: 'Erro ao listar webhooks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/webhooks
 * Create a new webhook
 */
export async function POST(request: NextRequest) {
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
      select: {
        organizationId: true,
        organization: { select: { plan: true, name: true } }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Check PRO plan
    if (user.organization.plan !== 'PRO') {
      return NextResponse.json(
        {
          error: 'Webhooks são uma funcionalidade PRO. Faça upgrade em /dashboard/settings/billing'
        },
        { status: 403 }
      )
    }

    // Validate request body
    const validation = await validateRequest(request, createWebhookSchema)

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

    // Validate events
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

    // Create endpoint in Svix
    const svixResult = await createSvixEndpoint(
      user.organizationId,
      user.organization.name,
      data.url,
      data.events,
      data.description
    )

    if (!svixResult) {
      return NextResponse.json(
        {
          error: 'Falha ao criar webhook no Svix. Verifique se o SVIX_API_KEY está configurado.'
        },
        { status: 500 }
      )
    }

    // Create webhook in database
    const webhook = await prisma.webhook.create({
      data: {
        svixAppId: svixResult.svixAppId,
        svixEndpointId: svixResult.svixEndpointId,
        url: data.url,
        description: data.description,
        enabled: true,
        events: data.events,
        organizationId: user.organizationId
      }
    })

    logger.info({
      organizationId: user.organizationId,
      webhookId: webhook.id,
      url: data.url
    }, 'Webhook created')

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        url: webhook.url,
        description: webhook.description,
        enabled: webhook.enabled,
        events: webhook.events,
        createdAt: webhook.createdAt
      }
    }, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Error creating webhook')
    return NextResponse.json(
      { error: 'Erro ao criar webhook' },
      { status: 500 }
    )
  }
}
