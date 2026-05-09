/**
 * API Route: /api/whatsapp/connections/[id]
 *
 * DELETE: Remove conexão WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * DELETE /api/whatsapp/connections/[id]
 * Deleta uma conexão WhatsApp (logout + remove do banco + deleta instância)
 */
export async function DELETE(
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

    // 4. Delete from whatsmeow gateway
    try {
      await whatsmeowClient.deleteInstance(connection.instanceName)
    } catch (error) {
      // Log but continue - instance might already be deleted on gateway
      logger.warn({ error, instanceName: connection.instanceName }, 'Failed to delete gateway instance (continuing)')
    }

    // 5. Delete from database
    await prismaWa.whatsAppConnection.delete({
      where: { id: connection.id },
    })

    logger.info({
      connectionId: connection.id,
      instanceName: connection.instanceName,
    }, 'Connection deleted')

    return NextResponse.json({
      message: 'Connection deleted successfully',
    })
  } catch (error: any) {
    logger.error({ error }, 'Error deleting connection')
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    )
  }
}
