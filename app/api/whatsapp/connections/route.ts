/**
 * API Route: /api/whatsapp/connections
 *
 * CRUD de conexões WhatsApp (Whatsmeow Gateway)
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * GET /api/whatsapp/connections
 * Lista todas as conexões WhatsApp da organização
 */
export async function GET() {
  try {
    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organization) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    // 3. Get connections
    const connections = await prismaWa.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(connections)
  } catch (error) {
    logger.error({ error }, 'Error fetching WhatsApp connections')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

/**
 * POST /api/whatsapp/connections
 * Use /api/whatsapp/connections/whatsmeow to create connections.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Use a rota /api/whatsapp/connections/whatsmeow para criar conexões' },
    { status: 400 }
  )
}
