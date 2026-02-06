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

    // 6. Extrair remoteJid de cada chat
    // Evolution API v2 retorna chats com id=null
    // O remoteJid real está em lastMessage.key.remoteJid
    const parsedChats = (chats || []).map((chat: any) => {
      const remoteJid =
        chat.id ||                                     // v1 format
        chat.remoteJid ||                              // alternate field
        chat.lastMessage?.key?.remoteJid ||            // v2 format - dentro do lastMessage
        ''
      const pushName =
        chat.name ||
        chat.pushName ||
        chat.notify ||
        chat.lastMessage?.pushName ||                  // v2 format
        ''
      const isGroup = remoteJid.includes('@g.us')
      return { ...chat, _remoteJid: remoteJid, _pushName: pushName, _isGroup: isGroup }
    })

    // Filter: incluir conversas individuais (@s.whatsapp.net) E grupos (@g.us)
    // Excluir: LID (contatos internos do WhatsApp), status, newsletter, sem JID
    const validChats = parsedChats.filter((chat: any) => {
      const jid = chat._remoteJid
      if (!jid) return false
      if (jid.includes('@lid')) return false
      if (jid.includes('@broadcast')) return false
      if (jid.includes('status@')) return false
      if (jid.includes('@newsletter')) return false
      return jid.includes('@s.whatsapp.net') || jid.includes('@g.us')
    })

    const individualCount = validChats.filter((c: any) => !c._isGroup).length
    const groupCount = validChats.filter((c: any) => c._isGroup).length

    logger.info({
      connectionId: connection.id,
      totalChats: chats?.length || 0,
      parsedWithJid: parsedChats.filter((c: any) => c._remoteJid).length,
      validChats: validChats.length,
      individuals: individualCount,
      groups: groupCount,
    }, 'Syncing chats from Evolution API')

    let syncedContacts = 0
    let syncedMessages = 0
    let skippedExisting = 0

    // 7. Deduplicate by remoteJid (same contact can appear multiple times)
    const seenJids = new Set<string>()
    const uniqueChats = validChats.filter((chat: any) => {
      if (seenJids.has(chat._remoteJid)) return false
      seenJids.add(chat._remoteJid)
      return true
    })

    // Processar até 50 conversas mais recentes
    const chatsToSync = uniqueChats.slice(0, 50)

    for (const chat of chatsToSync) {
      try {
        const remoteJid = chat._remoteJid
        if (!remoteJid) continue

        const isGroup = chat._isGroup

        // Para grupos: usar o group JID como identificador
        // Para individuais: usar o phone number
        const phoneNumber = isGroup
          ? remoteJid // Para grupos, salvar o JID completo como "phone"
          : normalizePhoneNumber(remoteJid.replace('@s.whatsapp.net', ''))

        // Nome do contato/grupo
        const contactName = isGroup
          ? (chat._pushName || `Grupo ${remoteJid.replace('@g.us', '')}`)
          : (chat._pushName || phoneNumber)

        // Find or create contact
        let contact: any = null
        if (isGroup) {
          // Grupos: buscar por phone = remoteJid (JID completo)
          contact = await prisma.contact.findFirst({
            where: { organizationId: user.organizationId, phone: remoteJid }
          })
        } else {
          contact = await findContactByPhone(user.organizationId, phoneNumber)
        }

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              organizationId: user.organizationId,
              name: contactName,
              phone: isGroup ? remoteJid : phoneNumber,
            }
          })
          syncedContacts++
          logger.info({ contactName, phone: phoneNumber, isGroup }, 'Created contact from sync')
        } else if (contactName !== phoneNumber && (!contact.name || contact.name === contact.phone)) {
          // Atualizar nome se veio um nome real e o contato só tinha telefone/JID
          await prisma.contact.update({
            where: { id: contact.id },
            data: { name: contactName },
          })
        }

        // Fetch messages for this chat (até 30 mensagens por conversa)
        let chatMessages: any[] = []
        try {
          const rawMessages = await evolutionClient.getMessages(connection.instanceName, remoteJid, 30)
          chatMessages = Array.isArray(rawMessages) ? rawMessages : []
        } catch (err: any) {
          logger.debug({ remoteJid, error: err.message }, 'Failed to fetch messages for chat')
          // Fallback: usar lastMessage do chat como única mensagem
          if (chat.lastMessage) {
            chatMessages = [chat.lastMessage]
          }
        }

        // Se não tem mensagens e nem lastMessage, pelo menos criar a conversa com lastMessage do chat
        if (chatMessages.length === 0 && chat.lastMessage) {
          chatMessages = [chat.lastMessage]
        }

        // Normalizar mensagens - Evolution API v2 pode ter formato diferente
        // v2 findMessages retorna: { id, key: {}, message: {}, messageTimestamp, ... }
        // v2 lastMessage retorna: { id, key: {}, message: {}, messageTimestamp, ... }
        const normalizedMessages = chatMessages.map((msg: any) => ({
          key: msg.key || {},
          message: msg.message || {},
          messageTimestamp: msg.messageTimestamp || 0,
          pushName: msg.pushName || '',
          messageType: msg.messageType || '',
        }))

        // Ordenar por timestamp (mais antiga primeiro)
        const sortedMessages = normalizedMessages.sort((a: any, b: any) => {
          const tsA = typeof a.messageTimestamp === 'string' ? parseInt(a.messageTimestamp) : (a.messageTimestamp || 0)
          const tsB = typeof b.messageTimestamp === 'string' ? parseInt(b.messageTimestamp) : (b.messageTimestamp || 0)
          return tsA - tsB
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
          const ts = typeof rawTimestamp === 'string' ? parseInt(rawTimestamp) : rawTimestamp
          // Se timestamp parece ser em segundos (< 2000000000), converter para ms
          const timestamp = ts > 0
            ? new Date(ts > 9999999999 ? ts : ts * 1000)
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
          const ts = typeof lastTs === 'string' ? parseInt(lastTs) : lastTs
          const lastDate = ts > 0
            ? new Date(ts > 9999999999 ? ts : ts * 1000)
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
      totalChats: validChats.length,
      individuals: individualCount,
      groups: groupCount,
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
  if (!msg) {
    // v2 format: messageType field at top level
    if (message.messageType === 'conversation') return ''
    return ''
  }

  // Text messages
  if (msg.conversation) return msg.conversation
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text

  // Media messages
  if (msg.imageMessage) return msg.imageMessage.caption ? `[Imagem] ${msg.imageMessage.caption}` : '[Imagem]'
  if (msg.videoMessage) return msg.videoMessage.caption ? `[Vídeo] ${msg.videoMessage.caption}` : '[Vídeo]'
  if (msg.documentMessage) return msg.documentMessage.fileName ? `[Documento] ${msg.documentMessage.fileName}` : '[Documento]'
  if (msg.audioMessage || msg.pttMessage) return '[Áudio]'
  if (msg.stickerMessage) return '[Figurinha]'
  if (msg.locationMessage || msg.liveLocationMessage) return '[Localização]'
  if (msg.contactMessage || msg.contactsArrayMessage) return '[Contato]'
  if (msg.viewOnceMessage || msg.viewOnceMessageV2) return '[Visualização única]'
  if (msg.pollCreationMessage || msg.pollCreationMessageV3) return '[Enquete]'

  // System messages (skip)
  if (msg.protocolMessage || msg.reactionMessage || msg.senderKeyDistributionMessage) return ''

  return '[Mensagem]'
}
