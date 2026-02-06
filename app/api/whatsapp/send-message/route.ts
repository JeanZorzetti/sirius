/**
 * API Route: /api/whatsapp/send-message
 *
 * Envia mensagem WhatsApp através de uma conexão
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrgEvolutionClient } from '@/lib/evolution-api-client'
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
    const { connectionId, contactId, message, replyToId } = body

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

    // 7. Verificar se contato tem telefone
    if (!contact.phone) {
      return NextResponse.json(
        { error: 'Contact has no phone number' },
        { status: 400 }
      )
    }

    // 8. Obter cliente Evolution API da organização
    const evolutionClient = await getOrgEvolutionClient(user.organizationId)
    if (!evolutionClient) {
      return NextResponse.json(
        { error: 'Evolution API não está configurada.' },
        { status: 400 }
      )
    }

    // 9. Formatar número de telefone e preparar dados de citação (se houver)
    const whatsappNumber = evolutionClient.formatPhoneNumber(contact.phone)

    let quotedMessage = null
    let replyToText = null

    if (replyToId) {
      const originalMessage = await prisma.whatsAppMessage.findFirst({
        where: {
          id: replyToId,
          organizationId: user.organizationId,
        },
      })

      if (originalMessage && originalMessage.messageId) {
        quotedMessage = {
          key: {
            remoteJid: whatsappNumber,
            id: originalMessage.messageId,
          },
        }
        replyToText = originalMessage.text
      }
    }

    // 10. Enviar mensagem via Evolution API (com ou sem citação)
    const evolutionResponse = await evolutionClient.sendTextMessage({
      instanceName: connection.instanceName,
      number: whatsappNumber,
      text: message,
      ...(quotedMessage && { quoted: quotedMessage }),
    })

    logger.info({
      connectionId: connection.id,
      contactId: contact.id,
      messageId: evolutionResponse.key.id,
    }, 'WhatsApp message sent')

    // 11. Salvar mensagem no banco (com referência à mensagem citada, se houver)
    const savedMessage = await prisma.whatsAppMessage.create({
      data: {
        contactId: contact.id,
        organizationId: user.organizationId,
        remoteJid: whatsappNumber,
        messageId: evolutionResponse.key.id,
        text: message,
        direction: 'OUTBOUND',
        status: 'SENT',
        sentAt: new Date(),
        ...(replyToId && { replyToId, replyToText }),
      },
      select: {
        id: true,
        text: true,
        direction: true,
        sentAt: true,
        deliveredAt: true,
        readAt: true,
        status: true,
        replyToId: true,
        replyToText: true,
      },
    })

    return NextResponse.json(savedMessage)
  } catch (error) {
    logger.error({ error }, 'Error sending WhatsApp message')
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
