/**
 * API Route: /api/whatsapp/connections/[id]/sync
 *
 * Sincroniza conversas existentes do Evolution API para o banco local
 * Usado após conexão para importar mensagens recentes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrgEvolutionClient } from '@/lib/evolution-api-client'
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
        id,
        organizationId: user.organizationId,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    if (connection.status !== 'CONNECTED') {
      return NextResponse.json(
        { error: 'Connection is not active' },
        { status: 400 }
      )
    }

    // 4. Get Evolution API client
    const evolutionClient = await getOrgEvolutionClient(user.organizationId)
    if (!evolutionClient) {
      return NextResponse.json(
        { error: 'Evolution API não está configurada.' },
        { status: 400 }
      )
    }

    // 5. Fetch recent chats from Evolution API
    let chats: any[] = []
    try {
      chats = await evolutionClient.getChats(connection.instanceName)
    } catch (err: any) {
      logger.warn({ error: err.message, instanceName: connection.instanceName }, 'Failed to fetch chats from Evolution API')
      return NextResponse.json(
        { error: 'Failed to fetch chats from Evolution API', details: err.message },
        { status: 502 }
      )
    }

    // 6. Filter to individual chats (not groups)
    const individualChats = (chats || []).filter(
      (chat: any) => !chat.id?.includes('@g.us') && chat.id?.includes('@s.whatsapp.net')
    )

    logger.info({
      connectionId: connection.id,
      totalChats: chats?.length || 0,
      individualChats: individualChats.length,
    }, 'Syncing chats from Evolution API')

    let syncedContacts = 0
    let syncedMessages = 0

    // 7. For each chat, fetch recent messages and sync
    for (const chat of individualChats.slice(0, 20)) { // Limit to 20 most recent chats
      try {
        const remoteJid = chat.id
        const phoneNumber = normalizePhoneNumber(remoteJid.replace('@s.whatsapp.net', ''))
        const contactName = chat.name || chat.pushName || phoneNumber

        // Find or create contact
        let contact = await findContactByPhone(user.organizationId, phoneNumber)
        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              organizationId: user.organizationId,
              name: contactName,
              phone: phoneNumber,
            }
          })
          syncedContacts++
        }

        // Fetch recent messages for this chat
        let messages: any[] = []
        try {
          messages = await evolutionClient.getMessages(connection.instanceName, remoteJid, 10)
        } catch (err) {
          logger.debug({ remoteJid }, 'Failed to fetch messages for chat, skipping')
          continue
        }

        // Save messages
        for (const msg of (messages || []).slice(0, 10)) {
          const messageId = msg.key?.id
          if (!messageId) continue

          // Skip if already exists
          const existing = await prisma.whatsAppMessage.findFirst({
            where: { messageId, organizationId: user.organizationId }
          })
          if (existing) continue

          const messageText = extractMessageText(msg)
          if (!messageText) continue

          const rawTimestamp = msg.messageTimestamp
          const timestamp = rawTimestamp
            ? new Date((typeof rawTimestamp === 'string' ? parseInt(rawTimestamp) : rawTimestamp) * 1000)
            : new Date()

          await prisma.whatsAppMessage.create({
            data: {
              contactId: contact.id,
              organizationId: user.organizationId,
              remoteJid,
              messageId,
              text: messageText,
              direction: msg.key?.fromMe ? 'OUTBOUND' : 'INBOUND',
              status: msg.key?.fromMe ? 'SENT' : 'DELIVERED',
              sentAt: timestamp,
            }
          })
          syncedMessages++
        }

        // Update contact timestamp
        await prisma.contact.update({
          where: { id: contact.id },
          data: { updatedAt: new Date() }
        })
      } catch (err: any) {
        logger.error({ error: err.message, chat: chat.id }, 'Error syncing chat')
        continue
      }
    }

    // 8. Update connection lastSyncAt
    await prisma.whatsAppConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    })

    logger.info({
      connectionId: connection.id,
      syncedContacts,
      syncedMessages,
    }, 'Chat sync completed')

    return NextResponse.json({
      success: true,
      syncedContacts,
      syncedMessages,
    })
  } catch (error: any) {
    logger.error({ error }, 'Error syncing WhatsApp chats')
    return NextResponse.json(
      { error: 'Failed to sync chats' },
      { status: 500 }
    )
  }
}

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  if (cleaned.length === 10 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  return cleaned
}

async function findContactByPhone(organizationId: string, phone: string) {
  let contact = await prisma.contact.findFirst({
    where: { organizationId, phone }
  })
  if (contact) return contact

  const withoutCountry = phone.startsWith('55') ? phone.substring(2) : phone
  contact = await prisma.contact.findFirst({
    where: { organizationId, phone: withoutCountry }
  })
  if (contact) return contact

  if (!phone.startsWith('55')) {
    contact = await prisma.contact.findFirst({
      where: { organizationId, phone: '55' + phone }
    })
  }
  return contact
}

function extractMessageText(message: any): string {
  const msg = message.message
  if (!msg) return ''
  if (msg.conversation) return msg.conversation
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text
  if (msg.imageMessage?.caption) return `[Imagem] ${msg.imageMessage.caption}`
  if (msg.videoMessage?.caption) return `[Vídeo] ${msg.videoMessage.caption}`
  if (msg.documentMessage?.fileName) return `[Documento] ${msg.documentMessage.fileName}`
  if (msg.audioMessage) return '[Áudio]'
  return ''
}
