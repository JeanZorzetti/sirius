/**
 * DELETE /api/whatsapp/connections/whatsmeow/[id]
 *
 * Deleta uma instância whatsmeow pelo gatewayInstanceId.
 * Remove do gateway E do banco (se existir).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gatewayInstanceId } = await params

  const session = await getSession()
  if (!session?.user) {
    return await apiError(ERR.UNAUTHORIZED, 401)
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  })
  if (!user?.organizationId) {
    return await apiError(ERR.ORG_NOT_FOUND, 404)
  }

  // 1. Deletar no gateway (best-effort)
  try {
    await whatsmeowClient.deleteInstance(gatewayInstanceId)
    logger.info({ gatewayInstanceId }, 'whatsmeow: deleted from gateway')
  } catch (err: any) {
    logger.warn({ gatewayInstanceId, error: err.message }, 'whatsmeow: gateway delete failed (continuing)')
  }

  // 2. Deletar no banco se existir
  const connection = await prismaWa.whatsAppConnection.findFirst({
    where: { instanceName: gatewayInstanceId, organizationId: user.organizationId },
  })

  if (connection) {
    await prismaWa.whatsAppConnection.delete({ where: { id: connection.id } })
    logger.info({ connectionId: connection.id, gatewayInstanceId }, 'whatsmeow: deleted from DB')
  }

  return NextResponse.json({ success: true })
}
