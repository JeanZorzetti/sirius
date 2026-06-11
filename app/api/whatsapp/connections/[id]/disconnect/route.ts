/**
 * API Route: /api/whatsapp/connections/[id]/disconnect
 *
 * Desconecta (logout) uma instância WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404, { req })
    }

    // 3. Get connection
    const connection = await prismaWa.whatsAppConnection.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!connection) {
      return await apiError(ERR.CONNECTION_NOT_FOUND, 404, { req })
    }

    // 4. Update status in database (the QR gateway was discontinued; there is
    // no remote instance to restart)
    await prismaWa.whatsAppConnection.update({
      where: { id: connection.id },
      data: {
        status: 'DISCONNECTED',
        connectedAt: null,
      },
    })

    logger.info({
      connectionId: connection.id,
      instanceName: connection.instanceName,
    }, 'Connection disconnected')

    return NextResponse.json({
      message: 'Connection disconnected successfully',
      id: connection.id,
    })
  } catch (error: any) {
    logger.error({ error }, 'Error disconnecting connection')
    return NextResponse.json(
      { error: 'Failed to disconnect connection' },
      { status: 500 }
    )
  }
}
