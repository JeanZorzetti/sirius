/**
 * API Route: /api/whatsapp/send-message
 *
 * Envia mensagem WhatsApp através de uma conexão.
 * Detecta automaticamente o provider (Evolution API ou Whatsmeow Gateway).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrgEvolutionClient } from '@/lib/evolution-api-client'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import logger from '@/lib/logger'
import { triggerEvent } from '@/lib/pusher'
import { normalizePhoneNumber } from '@/lib/whatsapp-sync'

export async function POST(req: NextRequest) {
  try {
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
        { error: 'Conexão não encontrada' },
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
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }

    if (!contact.phone) {
      return NextResponse.json(
        { error: 'Contact has no phone number' },
        { status: 400 }
      )
    }

    // 7. Detect provider and send
    const isWhatsmeow = !connection.apiKey
    const phoneNumber = normalizePhoneNumber(contact.phone)

    let messageId: string
    let remoteJid: string

    if (isWhatsmeow) {
      // --- Whatsmeow Gateway ---
      remoteJid = phoneNumber
      const res = await whatsmeowClient.sendText(connection.instanceName, phoneNumber, message)
      messageId = res.messageId
    } else {
      // --- Evolution API ---
      const evolutionClient = await getOrgEvolutionClient(user.organizationId)
      if (!evolutionClient) {
        return NextResponse.json(
          { error: 'Evolution API não está configurada.' },
          { status: 400 }
        )
      }

      const whatsappNumber = evolutionClient.formatPhoneNumber(contact.phone)
      remoteJid = whatsappNumber

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

      const evolutionResponse = await evolutionClient.sendTextMessage({
        instanceName: connection.instanceName,
        number: whatsappNumber,
        text: message,
        ...(quotedMessage && { quoted: quotedMessage }),
      })

      messageId = evolutionResponse.key.id
    }

    logger.info({
      connectionId: connection.id,
      contactId: contact.id,
      messageId,
      provider: isWhatsmeow ? 'whatsmeow' : 'evolution',
    }, 'WhatsApp message sent')

    // 8. Salvar mensagem no banco
    const savedMessage = await prisma.whatsAppMessage.create({
      data: {
        contactId: contact.id,
        organizationId: user.organizationId,
        connectionId: connection.id,
        remoteJid,
        messageId,
        text: message,
        direction: 'OUTBOUND',
        status: 'SENT',
        sentAt: new Date(),
        ...(replyToId && { replyToId, replyToText: null }),
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

    // Real-time: notify via Pusher
    triggerEvent(user.organizationId, 'message:sent', {
      contactId: contact.id,
      message: savedMessage,
    })

    return NextResponse.json(savedMessage)
  } catch (error) {
    logger.error({ error }, 'Error sending WhatsApp message')
    return NextResponse.json(
      { error: 'Falha ao enviar mensagem' },
      { status: 500 }
    )
  }
}
