/**
 * GET  /api/whatsapp/connections/whatsmeow — lista instâncias do gateway
 * POST /api/whatsapp/connections/whatsmeow — cria instância no gateway e salva no DB
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import logger from '@/lib/logger'

export async function GET() {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  })
  if (!user?.organizationId) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  try {
    const instances = await whatsmeowClient.listInstances(user.organizationId)
    return NextResponse.json(instances)
  } catch (err: any) {
    logger.warn({ error: err.message }, 'whatsmeow: failed to list gateway instances')
    return NextResponse.json([], { status: 200 }) // gateway offline → retorna vazio
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  })

  if (!user?.organizationId) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const body = await req.json()
  const { instanceName } = body

  if (!instanceName || !/^[a-zA-Z0-9-]+$/.test(instanceName)) {
    return NextResponse.json(
      { error: 'instanceName inválido. Use apenas letras, números e hífen.' },
      { status: 400 }
    )
  }

  // Verificar duplicata
  const existing = await prismaWa.whatsAppConnection.findFirst({
    where: { organizationId: user.organizationId, instanceName },
  })

  if (existing) {
    return NextResponse.json({ error: 'Já existe uma instância com esse nome.' }, { status: 409 })
  }

  // Criar no gateway
  const gatewayInstance = await whatsmeowClient.createInstance(instanceName, user.organizationId)

  logger.info({ gatewayInstance, organizationId: user.organizationId }, 'whatsmeow instance created')

  // Salvar no DB — instanceName = gatewayInstance.id para usar no lookup do webhook
  const connection = await prismaWa.whatsAppConnection.create({
    data: {
      organizationId: user.organizationId,
      userId: session.user.id,
      instanceName: gatewayInstance.id,
      status: 'CONNECTING',
    },
  })

  return NextResponse.json(
    {
      connectionId: connection.id,
      gatewayInstanceId: gatewayInstance.id,
      qrStreamUrl: whatsmeowClient.getQRStreamURL(gatewayInstance.id),
    },
    { status: 201 }
  )
}
