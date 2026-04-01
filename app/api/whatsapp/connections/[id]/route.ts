/**
 * API Route: /api/whatsapp/connections/[id]
 *
 * DELETE: Remove conexão WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrgEvolutionClient } from '@/lib/evolution-api-client'
import { isWhatsmeow } from '@/lib/whatsapp-provider'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import logger from '@/lib/logger'

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
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // 3. Get connection
    const connection = await prisma.whatsAppConnection.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Conexão não encontrada' },
        { status: 404 }
      )
    }

    // 4. Delete from gateway (whatsmeow or Evolution)
    try {
      if (isWhatsmeow(connection)) {
        await whatsmeowClient.deleteInstance(connection.instanceName)
      } else {
        const evolutionClient = await getOrgEvolutionClient(user.organizationId)
        if (evolutionClient) {
          await evolutionClient.deleteInstance(connection.instanceName)
        }
      }
    } catch (error) {
      // Log but continue - instance might already be deleted on gateway
      logger.warn({ error, instanceName: connection.instanceName }, 'Failed to delete gateway instance (continuing)')
    }

    // 5. Delete from database
    await prisma.whatsAppConnection.delete({
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
