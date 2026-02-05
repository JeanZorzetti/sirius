/**
 * API Route: /api/whatsapp/connections
 *
 * CRUD de conexões WhatsApp (Evolution API)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import evolutionApi from '@/lib/evolution-api-client'
import { canUseFeature } from '@/lib/entitlements'
import logger from '@/lib/logger'

/**
 * GET /api/whatsapp/connections
 * Lista todas as conexões WhatsApp da organização
 */
export async function GET() {
  try {
    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // 3. Get connections
    const connections = await prisma.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(connections)
  } catch (error) {
    logger.error({ error }, 'Error fetching WhatsApp connections')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/whatsapp/connections
 * Cria nova conexão WhatsApp
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // 3. Check entitlement
    if (!canUseFeature(user.organization.tier, 'can_use_chat_interface')) {
      return NextResponse.json(
        {
          error: 'Upgrade to PRO to use WhatsApp Chat Center',
          requiredTier: 'PRO'
        },
        { status: 403 }
      )
    }

    // 4. Check instance limit
    const currentConnections = await prisma.whatsAppConnection.count({
      where: {
        organizationId: user.organizationId,
        status: { in: ['CONNECTING', 'CONNECTED'] }
      },
    })

    const maxInstances = user.organization.whatsappInstances || 1

    // Contar add-ons de instâncias extras
    const extraInstances = await prisma.addon.count({
      where: {
        organizationId: user.organizationId,
        type: 'WHATSAPP_EXTRA_INSTANCE',
        status: 'ACTIVE',
      },
    })

    const totalAllowed = maxInstances + extraInstances

    if (currentConnections >= totalAllowed) {
      return NextResponse.json(
        {
          error: `Instance limit reached (${currentConnections}/${totalAllowed}). Upgrade or buy add-on.`,
          currentConnections,
          maxInstances: totalAllowed,
        },
        { status: 403 }
      )
    }

    // 5. Parse request body
    const body = await req.json()
    const { instanceName } = body

    if (!instanceName) {
      return NextResponse.json(
        { error: 'instanceName is required' },
        { status: 400 }
      )
    }

    // 6. Validar nome da instância (apenas letras, números, hífen)
    if (!/^[a-zA-Z0-9-]+$/.test(instanceName)) {
      return NextResponse.json(
        { error: 'instanceName must contain only letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // 7. Verificar se já existe
    const existing = await prisma.whatsAppConnection.findFirst({
      where: {
        organizationId: user.organizationId,
        instanceName,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Instance with this name already exists' },
        { status: 409 }
      )
    }

    // 8. Criar instância no Evolution API
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`

    const evolutionInstance = await evolutionApi.createInstance({
      instanceName: `${user.organizationId}-${instanceName}`,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhookUrl,
    })

    logger.info({
      organizationId: user.organizationId,
      instanceName,
      evolutionInstance,
    }, 'Evolution API instance created')

    // 9. Salvar no banco
    const connection = await prisma.whatsAppConnection.create({
      data: {
        organizationId: user.organizationId,
        userId: session.user.id,
        instanceName: `${user.organizationId}-${instanceName}`,
        status: 'CONNECTING',
      },
    })

    return NextResponse.json(connection, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Error creating WhatsApp connection')

    // Tentar deletar instância do Evolution API se falhou criar no banco
    // (cleanup)

    return NextResponse.json(
      { error: 'Failed to create WhatsApp connection' },
      { status: 500 }
    )
  }
}
