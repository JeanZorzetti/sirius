/**
 * API Route: /api/whatsapp/connections/[id]/sync
 *
 * Sincroniza conversas existentes do Evolution API para o banco local.
 * Importa histórico de conversas como no WhatsApp - ao conectar, todas
 * as conversas recentes ficam disponíveis imediatamente.
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

    // 5. Fetch ALL chats from Evolution API
    let chats: any[] = []
    try {
      chats = await evolutionClient.getChats(connection.instanceName)
    } catch (err: any) {
      logger.warn({ error: err.message, instanceName: connection.instanceName }, 'Failed to fetch chats from Evolution API')
      return NextResponse.json(
        { error: 'Falha ao buscar conversas do WhatsApp', details: err.message },
        { status: 502 }
      )
    }

    // 6. Filter to individual chats (not groups, not status)
    const individualChats = (chats || []).filter((chat: any) => {
      const chatId = chat.id || chat.remoteJid || ''
      return chatId.includes('@s.whatsapp.net') && !chatId.includes('@g.us')
    })

    logger.info({
      connectionId: connection.id,
      totalChats: chats?.length || 0,
      individualChats: individualChats.length,
    }, 'Syncing chats from Evolution API')

    let syncedContacts = 0
    let syncedMessages = 0
    let skippedExisting = 0

    // 7. Processar até 50 conversas mais recentes
    const chatsToSync = individualChats.slice(0, 50)

    for (const chat of chatsToSync) {
      try {
        const remoteJid = chat.id || chat.remoteJid
        if (!remoteJid) continue

        const phoneNumber = normalizePhoneNumber(remoteJid.replace('@s.whatsapp.net', ''))
        const contactName = chat.name || chat.pushName || chat.notify || phoneNumber

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
          logger.info({ contactName, phone: phoneNumber }, 'Created contact from sync')
        } else if (contactName !== phoneNumber && (!contact.name || contact.name === contact.phone)) {
          // Atualizar nome se veio um nome real e o contato só tinha telefone
          await prisma.contact.update({
            where: { id: contact.id },
            data: { name: contactName },
          })
        }

        // Fetch messages for this chat (até 30 mensagens por conversa)
        let chatMessages: any[] = []
        try {
          chatMessages = await evolutionClient.getMessages(connection.instanceName, remoteJid, 30)
        } catch (err) {
          logger.debug({ remoteJid }, 'Failed to fetch messages for chat, skipping')
          // Mesmo sem mensagens, o contato já foi criado - a conversa aparece
          continue
        }

        // Ordenar por timestamp (mais antiga primeiro)
        const sortedMessages = (chatMessages || []).sort((a: any, b: any) => {
          const tsA = a.messageTimestamp || 0
          const tsB = b.messageTimestamp || 0
          return (typeof tsA === 'string' ? parseInt(tsA) : tsA) -
            (typeof tsB === 'string' ? parseInt(tsB) : tsB)
        })

        // Save messages
        for (const msg of sortedMessages) {
          const messageId = msg.key?.id
          if (!messageId) continue

          // Skip if already exists
          const existing = await prisma.whatsAppMessage.findFirst({
            where: { messageId, organizationId: user.organizationId }
          })
          if (existing) {
            skippedExisting++
            continue
          }

          let messageText = extractMessageText(msg)
          // Aceitar mídia sem caption
          if (!messageText) {
            messageText = '[Mensagem]'
          }

          const rawTimestamp = msg.messageTimestamp
          const timestamp = rawTimestamp
            ? new Date((typeof rawTimestamp === 'string' ? parseInt(rawTimestamp) : rawTimestamp) * 1000)
            : new Date()

          try {
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
          } catch (createErr: any) {
            // Pode falhar por unique constraint se houve race condition
            logger.debug({ messageId, error: createErr.message }, 'Failed to create message (probably duplicate)')
          }
        }

        // Update contact timestamp com a mensagem mais recente
        if (sortedMessages.length > 0) {
          const lastMsg = sortedMessages[sortedMessages.length - 1]
          const lastTs = lastMsg.messageTimestamp
          const lastDate = lastTs
            ? new Date((typeof lastTs === 'string' ? parseInt(lastTs) : lastTs) * 1000)
            : new Date()

          await prisma.contact.update({
            where: { id: contact.id },
            data: { updatedAt: lastDate }
          })
        }
      } catch (err: any) {
        logger.error({ error: err.message, chat: chat.id }, 'Error syncing individual chat')
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
      skippedExisting,
      totalChatsProcessed: chatsToSync.length,
    }, 'Chat sync completed')

    return NextResponse.json({
      success: true,
      syncedContacts,
      syncedMessages,
      skippedExisting,
      totalChats: individualChats.length,
    })
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Error syncing WhatsApp chats')
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

  // Busca parcial - últimos 8 dígitos
  if (!contact) {
    contact = await prisma.contact.findFirst({
      where: {
        organizationId,
        phone: { contains: phone.slice(-8) },
      }
    })
  }

  return contact
}

function extractMessageText(message: any): string {
  const msg = message.message
  if (!msg) return ''
  if (msg.conversation) return msg.conversation
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text
  if (msg.imageMessage) return msg.imageMessage.caption ? `[Imagem] ${msg.imageMessage.caption}` : '[Imagem]'
  if (msg.videoMessage) return msg.videoMessage.caption ? `[Vídeo] ${msg.videoMessage.caption}` : '[Vídeo]'
  if (msg.documentMessage) return msg.documentMessage.fileName ? `[Documento] ${msg.documentMessage.fileName}` : '[Documento]'
  if (msg.audioMessage) return '[Áudio]'
  if (msg.stickerMessage) return '[Figurinha]'
  if (msg.locationMessage) return '[Localização]'
  if (msg.contactMessage || msg.contactsArrayMessage) return '[Contato]'
  if (msg.protocolMessage || msg.reactionMessage) return ''
  return '[Mensagem]'
}
