import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generateApiKey, listApiKeys } from '@/lib/api-keys'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

/**
 * GET /api/v1/api-keys
 * List all API keys for the authenticated user's organization
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

    // Check PRO or BUSINESS plan (API keys are PRO+ feature)
    if (!['PRO', 'BUSINESS'].includes(user.organization.plan)) {
      return NextResponse.json(
        {
          error: 'API Keys são uma funcionalidade PRO. Faça upgrade em /dashboard/settings/billing'
        },
        { status: 403 }
      )
    }

    const apiKeys = await listApiKeys(user.organizationId)

    return NextResponse.json({ apiKeys })

  } catch (error) {
    logger.error({ error }, 'Error listing API keys')
    return NextResponse.json(
      { error: 'Erro ao listar API keys' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/api-keys
 * Generate a new API key for the authenticated user's organization
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
        organization: { select: { plan: true } }
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
          error: 'API Keys são uma funcionalidade PRO. Faça upgrade em /dashboard/settings/billing'
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome da API key é obrigatório' },
        { status: 400 }
      )
    }

    // Check if organization already has an API key (one per organization)
    const existingKey = await prisma.apiKey.findFirst({
      where: { organizationId: user.organizationId }
    })

    if (existingKey) {
      return NextResponse.json(
        {
          error: 'Você já possui uma API key. Revogue a existente antes de criar uma nova.'
        },
        { status: 400 }
      )
    }

    const apiKey = await generateApiKey(user.organizationId, name.trim())

    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        key: apiKey.key, // IMPORTANT: This is the only time the full key is shown
        prefix: apiKey.prefix,
        name: apiKey.name,
        createdAt: apiKey.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    logger.error({ error }, 'Error generating API key')
    return NextResponse.json(
      { error: 'Erro ao gerar API key' },
      { status: 500 }
    )
  }
}
