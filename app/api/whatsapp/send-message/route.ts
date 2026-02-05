/**
 * API Route: /api/whatsapp/send-message
 *
 * Envia mensagem WhatsApp através de uma conexão
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import evolutionApi from '@/lib/evolution-api-client'
import logger from '@/lib/logger'

export async function POST(req: NextRequest) {
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

    // 3. Parse request body
    const body = await req.json()
    const { connectionId, contactId, message } = body

    if (!connectionId || !contactId || !message) {
      return NextResponse.json(
        { error: 'connectionId, contactId, and message are required' },
        { status: 400 }
      )
    }

    // 4. Verificar se a conexão pertence à organização
    const connection = await prisma.whatsAppConnection.findFirst({
      where: {
        id: connectionId,
        organizationId: user.organizationId,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    // 5. Verificar se a conexão está ativa
    if (connection.status !== 'CONNECTED') {
      return NextResponse.json(
        { error: 'Connection is not active. Please connect first.' },
        { status: 400 }
      )
    }

    // 6. Buscar contato
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId: user.organizationId,
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // 7. Formatar número de telefone para WhatsApp
    const phone = contact.whatsappPhone || contact.phone
    const whatsappNumber = evolutionApi.formatPhoneNumber(phone)

    // 8. Enviar mensagem via Evolution API
    const evolutionResponse = await evolutionApi.sendTextMessage({
      instanceName: connection.instanceName,
      number: whatsappNumber,
      text: message,
    })

    logger.info({
      connectionId: connection.id,
      contactId: contact.id,
      messageId: evolutionResponse.key.id,
    }, 'WhatsApp message sent')

    // 9. Salvar mensagem como interação
    const interaction = await prisma.interaction.create({
      data: {
        contactId: contact.id,
        organizationId: user.organizationId,
        userId: session.user.id,
        type: 'WHATSAPP',
        direction: 'OUTBOUND',
        content: message,
        metadata: {
          messageId: evolutionResponse.key.id,
          remoteJid: whatsappNumber,
          instanceName: connection.instanceName,
          timestamp: evolutionResponse.messageTimestamp,
        },
        occurredAt: new Date(),
      },
      select: {
        id: true,
        type: true,
        direction: true,
        content: true,
        occurredAt: true,
        metadata: true,
      },
    })

    return NextResponse.json(interaction)
  } catch (error) {
    logger.error({ error }, 'Error sending WhatsApp message')
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
