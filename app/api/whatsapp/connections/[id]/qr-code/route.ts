/**
 * API Route: /api/whatsapp/connections/[id]/qr-code
 *
 * Retorna o QR Code para conectar uma instância do WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrgEvolutionClient } from '@/lib/evolution-api-client'
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

    // 4. Check if already connected
    if (connection.status === 'CONNECTED') {
      return NextResponse.json(
        { error: 'Instance is already connected' },
        { status: 400 }
      )
    }

    // 5. Get Evolution API client for the organization
    const evolutionClient = await getOrgEvolutionClient(user.organizationId)
    if (!evolutionClient) {
      return NextResponse.json(
        { error: 'Evolution API não está configurada.' },
        { status: 400 }
      )
    }

    const qrCodeData = await evolutionClient.getQRCode(connection.instanceName)

    logger.info({
      connectionId: connection.id,
      instanceName: connection.instanceName,
    }, 'QR Code retrieved')

    return NextResponse.json({
      qrCode: qrCodeData.base64,
      code: qrCodeData.code,
      expiresIn: 30, // QR Code expira em 30 segundos
    })
  } catch (error: any) {
    logger.error({ error }, 'Error fetching QR code')
    return NextResponse.json(
      { error: 'Failed to retrieve QR code' },
      { status: 500 }
    )
  }
}
