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

    // 5.1 Fetch contacts para obter nomes reais
    // findContacts retorna { remoteJid, pushName } para cada contato
    let contactsMap = new Map<string, string>()
    try {
      const contacts = await evolutionClient.getContacts(connection.instanceName)
      if (Array.isArray(contacts)) {
        for (const c of contacts) {
          const jid = c.remoteJid || c.id || ''
          const name = c.pushName || c.name || c.notify || ''
          if (jid && name) {
            contactsMap.set(jid, name)
          }
        }
        logger.info({ contactsLoaded: contactsMap.size }, 'Loaded contacts for name resolution')
      }
    } catch (err: any) {
      logger.debug({ error: err.message }, 'Failed to fetch contacts for name resolution, continuing without')
    }

    // 5.2 Fetch groups para obter nomes reais dos grupos
    // fetchAllGroups retorna [{ id: "1203...@g.us", subject: "Nome do Grupo", description, ... }]
    let groupsMap = new Map<string, { subject: string; description?: string }>()
    logger.info({ instanceName: connection.instanceName }, 'About to call getGroups')
    try {
      const groups = await evolutionClient.getGroups(connection.instanceName)
      logger.info({ 
        instanceName: connection.instanceName,
        groupsType: typeof groups,
        isArray: Array.isArray(groups),
        groupsLength: groups?.length,
        groupsResponse: JSON.stringify(groups?.slice(0, 2)),
      }, 'Raw groups response from Evolution API')
      
      if (Array.isArray(groups) && groups.length > 0) {
        for (const g of groups) {
          const jid = g.id || g.groupJid || ''
          // O nome do grupo está no campo 'subject', não 'name'
          const subject = g.subject || g.name || g.groupName || ''
          logger.debug({ jid, subject, allKeys: Object.keys(g) }, 'Processing group')
          if (jid && subject) {
            groupsMap.set(jid, { 
              subject, 
              description: g.description 
            })
            logger.debug({ jid, subject }, 'Added group to map')
          } else {
            logger.debug({ jid, subject, g: JSON.stringify(g) }, 'Skipping group - missing jid or subject')
          }
        }
        logger.info({ groupsLoaded: groupsMap.size, sample: Array.from(groupsMap.entries()).slice(0, 3) }, 'Loaded groups for name resolution')
      } else {
        logger.warn({ groupsType: typeof groups, isArray: Array.isArray(groups) }, 'No groups returned or empty array')
      }
    } catch (err: any) {
      logger.error({ error: err.message, stack: err.stack }, 'Failed to fetch groups')
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
      const isGroup = remoteJid.includes('@g.us')

      // Prioridade para nome:
      // 1. groupsMap (para grupos - mais confiável, vem do endpoint /group/fetchAllGroups)
      // 2. contactsMap (para contatos individuais)
      // 3. chat.name/subject (nome do chat)
      let pushName = ''
      
      if (isGroup) {
        // Para grupos: usar groupsMap primeiro, depois chat.name/subject
        const groupInfo = groupsMap.get(remoteJid)
        pushName = groupInfo?.subject || chat.subject || chat.name || ''
        
        if (!pushName) {
          logger.debug({ remoteJid, chatName: chat.name, chatSubject: chat.subject }, 'Group name not found in any source')
        } else {
          logger.debug({ remoteJid, pushName, source: groupInfo ? 'groupsMap' : 'chat' }, 'Resolved group name')
        }
      } else {
        // Para contatos individuais
        pushName = contactsMap.get(remoteJid) || chat.name || chat.pushName || chat.notify || ''
      }
      
      if (!pushName && !isGroup) {
        // Para contatos individuais, pode usar lastMessage.pushName
        pushName = chat.lastMessage?.pushName || ''
      }

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
        } else {
          // Atualizar nome se:
          // 1. Veio um nome real do groupsMap (para grupos) ou contactsMap (para individuais)
          // 2. O contato ainda não tem nome, ou tem telefone/JID como nome
          // 3. Para GRUPOS: sempre atualizar se o nome veio do groupsMap
          //    (pois o webhook pode ter gravado o nome do remetente erroneamente)
          // 4. Para GRUPOS: também atualizar se o nome atual é genérico "Grupo X"
          const hasRealGroupName = isGroup && groupsMap.has(remoteJid)
          const groupHasGenericName = isGroup && contact.name && contact.name.startsWith('Grupo ')
          const shouldUpdateName = contactName && contactName !== phoneNumber && (
            !contact.name ||
            contact.name === contact.phone ||
            groupHasGenericName || // grupo com nome genérico - atualizar para nome real
            hasRealGroupName // grupo com nome do groupsMap - sempre atualizar
          )
          if (shouldUpdateName) {
            await prisma.contact.update({
              where: { id: contact.id },
              data: { name: contactName },
            })
            logger.info({ contactId: contact.id, oldName: contact.name, newName: contactName, isGroup, source: hasRealGroupName ? 'groupsMap' : 'chat' }, 'Updated contact name from sync')
          }
        }

        // Buscar foto de perfil do grupo (apenas para grupos sem foto)
        if (isGroup && !contact.profilePicUrl) {
          try {
            const profilePic = await evolutionClient.fetchProfilePictureUrl(
              connection.instanceName,
              remoteJid
            )
            if (profilePic?.profilePictureUrl) {
              await prisma.contact.update({
                where: { id: contact.id },
                data: { profilePicUrl: profilePic.profilePictureUrl },
              })
              contact.profilePicUrl = profilePic.profilePictureUrl
              logger.info({ contactId: contact.id, profilePicUrl: profilePic.profilePictureUrl }, 'Updated group profile picture')
            }
          } catch (err: any) {
            // Grupo pode não ter foto de perfil - ignorar erro
            logger.debug({ contactId: contact.id, error: err.message }, 'Failed to fetch group profile picture')
          }
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
          const mediaInfo = extractMediaInfo(msg)
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
                mediaUrl: mediaInfo?.url || null,
                mediaType: mediaInfo?.type || null,
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

function extractMediaInfo(message: any): { type: string; url: string | null } | null {
  const msg = message.message
  if (!msg) return null

  if (msg.imageMessage) {
    return { type: 'image', url: msg.imageMessage.url || msg.imageMessage.directPath || null }
  }
  if (msg.videoMessage) {
    return { type: 'video', url: msg.videoMessage.url || msg.videoMessage.directPath || null }
  }
  if (msg.documentMessage) {
    return { type: 'document', url: msg.documentMessage.url || msg.documentMessage.directPath || null }
  }
  if (msg.audioMessage || msg.pttMessage) {
    const a = msg.audioMessage || msg.pttMessage
    return { type: 'audio', url: a.url || a.directPath || null }
  }
  if (msg.stickerMessage) {
    return { type: 'sticker', url: msg.stickerMessage.url || msg.stickerMessage.directPath || null }
  }
  return null
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
