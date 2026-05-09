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
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function GET(
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

    // 4. Get status from whatsmeow gateway (non-blocking — fallback to DB status)
    let status = connection.status
    try {
      const gatewayStatus = await whatsmeowClient.getStatus(connection.instanceName)
      if (gatewayStatus?.connected === true) {
        status = 'CONNECTED'
      } else if (gatewayStatus?.connected === false) {
        status = 'DISCONNECTED'
      }
    } catch (err: any) {
      logger.warn({ instanceName: connection.instanceName, error: err.message }, 'Gateway status check failed — using DB status')
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
