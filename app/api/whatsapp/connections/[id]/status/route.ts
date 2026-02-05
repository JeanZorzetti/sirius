/**
 * API Route: /api/whatsapp/connections/[id]/status
 *
 * Verifica o status de conexão de uma instância WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import evolutionApi from '@/lib/evolution-api-client'
import logger from '@/lib/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // 3. Get connection
    const connection = await prisma.whatsAppConnection.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    // 4. Get status from Evolution API
    const evolutionState = await evolutionApi.getConnectionState(
      connection.instanceName
    )

    // 5. Map Evolution API state to our status
    let status = connection.status
    if (evolutionState.state === 'open') {
      status = 'CONNECTED'
    } else if (evolutionState.state === 'connecting' || evolutionState.state === 'close') {
      status = 'CONNECTING'
    } else {
      status = 'DISCONNECTED'
    }

    // 6. Update status in database if changed
    if (status !== connection.status) {
      await prisma.whatsAppConnection.update({
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
      evolutionState: evolutionState.state,
    })
  } catch (error) {
    logger.error({ error, connectionId: params.id }, 'Error fetching connection status')
    return NextResponse.json(
      { error: 'Failed to retrieve connection status' },
      { status: 500 }
    )
  }
}
