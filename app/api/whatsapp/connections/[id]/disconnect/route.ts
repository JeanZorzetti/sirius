/**
 * API Route: /api/whatsapp/connections/[id]/disconnect
 *
 * Desconecta (logout) uma instância WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import logger from '@/lib/logger'

export async function POST(
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
    const connection = await prismaWa.whatsAppConnection.findFirst({
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

    // 4. Logout from whatsmeow gateway (best-effort)
    try {
      await whatsmeowClient.deleteInstance(connection.instanceName)
    } catch (err: any) {
      // Instance may not exist or already be disconnected — proceed anyway
      logger.warn(
        { error: err?.message, instanceName: connection.instanceName },
        'Whatsmeow logout failed, forcing DB disconnect'
      )
    }

    // 5. Update status in database
    await prismaWa.whatsAppConnection.update({
      where: { id: connection.id },
      data: {
        status: 'DISCONNECTED',
        phoneNumber: null,
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
