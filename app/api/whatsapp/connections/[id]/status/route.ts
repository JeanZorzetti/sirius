/**
 * API Route: /api/whatsapp/connections/[id]/status
 *
 * Verifica o status de conexão de uma instância WhatsApp via Whatsmeow Gateway
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import logger from '@/lib/logger'

export async function GET(
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

    // 4. Get status from whatsmeow gateway
    const gatewayStatus = await whatsmeowClient.getStatus(connection.instanceName)

    // 5. Map gateway state to our status
    let status = connection.status
    if (gatewayStatus?.connected === true) {
      status = 'CONNECTED'
    } else if (gatewayStatus?.connected === false) {
      status = 'DISCONNECTED'
    }

    // 6. Update status in database if changed
    if (status !== connection.status) {
      await prismaWa.whatsAppConnection.update({
        where: { id: connection.id },
        data: {
          status,
          connectedAt: status === 'CONNECTED' ? new Date() : connection.connectedAt,
        },
      })

      logger.info({
        connectionId: connection.id,
        oldStatus: connection.status,
        newStatus: status,
      }, 'Connection status updated')
    }

    return NextResponse.json({
      id: connection.id,
      instanceName: connection.instanceName,
      status,
      phoneNumber: connection.phoneNumber,
      connectedAt: connection.connectedAt,
    })
  } catch (error: any) {
    logger.error({ error }, 'Error fetching connection status')
    return NextResponse.json(
      { error: 'Failed to retrieve connection status' },
      { status: 500 }
    )
  }
}
