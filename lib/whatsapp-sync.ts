/**
 * WhatsApp Sync Engine
 *
 * Lógica core de sincronização de histórico do Evolution API para o banco local.
 * Usada por:
 * - POST /api/whatsapp/connections/[id]/sync (sync manual/API)
 * - after() no webhook CONNECTION_UPDATE (auto-sync ao conectar)
 * - GET /api/cron/sync-whatsapp (self-healing cron)
 */

import { prisma } from '@/lib/prisma'
import { getOrgEvolutionClient } from '@/lib/evolution-api-client'
import logger from '@/lib/logger'

// --- Shared utilities (used by sync + webhook) ---

export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  if (cleaned.length === 10 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  return cleaned
}

export async function findContactByPhone(organizationId: string, phone: string) {
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

export function extractMessageText(message: any): string {
  // Evolution API v2 sometimes puts text directly on the message object
  if (message.body) return message.body
  if (message.text) return message.text

  const msg = message.message
  if (!msg) {
    if (message.messageType === 'conversation') return ''
    return ''
  }

  if (msg.conversation) return msg.conversation
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text
  if (msg.imageMessage) return msg.imageMessage.caption ? `[Imagem] ${msg.imageMessage.caption}` : '[Imagem]'
  if (msg.videoMessage) return msg.videoMessage.caption ? `[Vídeo] ${msg.videoMessage.caption}` : '[Vídeo]'
  if (msg.documentMessage) return msg.documentMessage.fileName ? `[Documento] ${msg.documentMessage.fileName}` : '[Documento]'
  if (msg.audioMessage || msg.pttMessage) return '[Áudio]'
  if (msg.stickerMessage) return '[Figurinha]'
  if (msg.locationMessage || msg.liveLocationMessage) return '[Localização]'
  if (msg.contactMessage || msg.contactsArrayMessage) return '[Contato]'
  if (msg.viewOnceMessage || msg.viewOnceMessageV2) return '[Visualização única]'
  if (msg.pollCreationMessage || msg.pollCreationMessageV3) return '[Enquete]'
  if (msg.reactionMessage) return ''
  if (msg.protocolMessage) return ''
  // senderKeyDistributionMessage is a crypto key exchange — ignore it,
  // but DON'T return '' because it can coexist with real content above

  return '[Mensagem]'
}

export function extractMediaInfo(message: any): { type: string; url: string | null; mimetype?: string | null; fileName?: string | null } | null {
  const msg = message.message
  if (!msg) return null

  if (msg.imageMessage) {
    return { type: 'image', url: msg.imageMessage.url || msg.imageMessage.directPath || null, mimetype: msg.imageMessage.mimetype || 'image/jpeg', fileName: null }
  }
  if (msg.videoMessage) {
    return { type: 'video', url: msg.videoMessage.url || msg.videoMessage.directPath || null, mimetype: msg.videoMessage.mimetype || 'video/mp4', fileName: null }
  }
  if (msg.documentMessage) {
    return { type: 'document', url: msg.documentMessage.url || msg.documentMessage.directPath || null, mimetype: msg.documentMessage.mimetype || 'application/octet-stream', fileName: msg.documentMessage.fileName || null }
  }
  if (msg.audioMessage || msg.pttMessage) {
    const a = msg.audioMessage || msg.pttMessage
    return { type: 'audio', url: a.url || a.directPath || null, mimetype: a.mimetype || 'audio/ogg', fileName: null }
  }
  if (msg.stickerMessage) {
    return { type: 'sticker', url: msg.stickerMessage.url || msg.stickerMessage.directPath || null, mimetype: msg.stickerMessage.mimetype || 'image/webp', fileName: null }
  }

  return null
}

// --- Sync Result ---

export interface SyncResult {
  success: boolean
  syncedContacts: number
  syncedMessages: number
  skippedExisting: number
  totalChats: number
}

// --- Core sync function ---

export async function syncConnectionHistory(connectionId: string): Promise<SyncResult> {
  const connection = await prisma.whatsAppConnection.findUnique({
    where: { id: connectionId },
  })

  if (!connection) {
    throw new Error(`Connection ${connectionId} not found`)
  }

  if (connection.status !== 'CONNECTED') {
    throw new Error(`Connection ${connectionId} is not active (status: ${connection.status})`)
  }

  const evolutionClient = await getOrgEvolutionClient(connection.organizationId)
  if (!evolutionClient) {
    throw new Error('Evolution API not configured for this organization')
  }

  logger.info({ connectionId, instanceName: connection.instanceName }, 'Starting chat sync')

  // Janela de 7 dias — ISO string para a Evolution API
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Fetch chats (findChats já retorna remoteJid, pushName, lastMessage, etc.)
  let chats: any[] = []
  try {
    chats = await evolutionClient.getChats(connection.instanceName, sevenDaysAgo)
    logger.info({ chatsCount: chats?.length || 0 }, 'Fetched chats from Evolution API')
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to fetch chats')
    throw new Error(`Failed to fetch chats: ${err.message}`)
  }

  // 2. Fetch contacts for name resolution (fallback)
  const contactsMap = new Map<string, string>()
  try {
    const contacts = await evolutionClient.getContacts(connection.instanceName)
    if (Array.isArray(contacts)) {
      for (const c of contacts) {
        const jid = c.remoteJid || c.id || ''
        const name = c.pushName || c.name || c.notify || ''
        if (jid && name) contactsMap.set(jid, name)
      }
    }
  } catch (err: any) {
    logger.debug({ error: err.message }, 'Failed to fetch contacts for name resolution')
  }

  // 3. Fetch groups for name resolution (fallback)
  const groupsMap = new Map<string, { subject: string; description?: string }>()
  try {
    const groups = await evolutionClient.getGroups(connection.instanceName)
    if (Array.isArray(groups) && groups.length > 0) {
      for (const g of groups) {
        const jid = g.id || g.groupJid || ''
        const subject = g.subject || g.name || g.groupName || ''
        if (jid && subject) {
          groupsMap.set(jid, { subject, description: g.description })
        }
      }
    }
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to fetch groups')
  }

  // 4. Parse chats — findChats v2 retorna { remoteJid, pushName, lastMessage, ... }
  const parsedChats = (chats || []).map((chat: any) => {
    // findChats retorna remoteJid direto; fallback para formatos alternativos
    let remoteJid = chat.remoteJid || chat.id || chat.lastMessage?.key?.remoteJid || ''

    if (remoteJid.includes('@lid')) {
      const senderPn = chat.lastMessage?.key?.senderPn || chat.senderPn || ''
      if (senderPn) {
        const cleanPhone = senderPn.replace(/\D/g, '')
        remoteJid = `${cleanPhone}@s.whatsapp.net`
      }
    }

    const isGroup = remoteJid.includes('@g.us')
    let pushName = chat.pushName || ''

    if (!pushName && isGroup) {
      const groupInfo = groupsMap.get(remoteJid)
      pushName = groupInfo?.subject || chat.subject || chat.name || ''
    }
    if (!pushName && !isGroup) {
      pushName = contactsMap.get(remoteJid) || chat.name || chat.lastMessage?.pushName || ''
    }

    return { ...chat, _remoteJid: remoteJid, _pushName: pushName, _isGroup: isGroup }
  })

  // 5. Filter valid chats
  const validChats = parsedChats.filter((chat: any) => {
    const jid = chat._remoteJid
    if (!jid) return false
    if (jid.includes('@broadcast') || jid.includes('status@') || jid.includes('@newsletter')) return false
    return jid.includes('@s.whatsapp.net') || jid.includes('@g.us') || jid.includes('@lid')
  })

  // 6. Deduplicate by remoteJid
  const seenJids = new Set<string>()
  const uniqueChats = validChats.filter((chat: any) => {
    if (seenJids.has(chat._remoteJid)) return false
    seenJids.add(chat._remoteJid)
    return true
  })

  const chatsToSync = uniqueChats

  let syncedContacts = 0
  let syncedMessages = 0
  let skippedExisting = 0

  logger.info({ totalChats: chatsToSync.length }, 'Chats to sync after dedup/filter')

  // 7. Process each chat
  for (const chat of chatsToSync) {
    try {
      let remoteJid = chat._remoteJid
      if (!remoteJid) continue

      const isLid = remoteJid.includes('@lid')
      const isGroup = chat._isGroup

      // Fetch mensagens dos últimos 7 dias com paginação automática
      let chatMessages: any[] = []
      try {
        const rawMessages = await evolutionClient.getMessages(connection.instanceName, remoteJid, sevenDaysAgo)
        chatMessages = Array.isArray(rawMessages) ? rawMessages : []
      } catch (err: any) {
        logger.warn({ remoteJid, error: err.message }, 'Failed to fetch messages for chat')
        // Usa lastMessage do findChats como fallback
        if (chat.lastMessage) chatMessages = [chat.lastMessage]
      }

      // LID resolution
      if (isLid) {
        let resolvedPhone = ''
        const lastSenderPn = chat.lastMessage?.key?.senderPn || ''
        if (lastSenderPn) {
          resolvedPhone = lastSenderPn.replace('@s.whatsapp.net', '').replace(/\D/g, '')
        }
        if (!resolvedPhone) {
          for (const msg of chatMessages) {
            const spn = msg.key?.senderPn || ''
            if (spn && spn.includes('@s.whatsapp.net')) {
              resolvedPhone = spn.replace('@s.whatsapp.net', '').replace(/\D/g, '')
              break
            }
          }
        }
        if (!resolvedPhone) {
          const pushName = chat._pushName || chat.lastMessage?.pushName || ''
          if (pushName) {
            for (const [jid, name] of contactsMap.entries()) {
              if (name === pushName && jid.includes('@s.whatsapp.net')) {
                resolvedPhone = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
                break
              }
            }
          }
        }
        if (resolvedPhone) {
          remoteJid = `${resolvedPhone}@s.whatsapp.net`
        } else {
          logger.warn({ lid: remoteJid }, 'Could not resolve LID — skipping chat')
          continue
        }
      }

      const phoneNumber = isGroup
        ? remoteJid
        : normalizePhoneNumber(remoteJid.replace('@s.whatsapp.net', ''))

      const contactName = isGroup
        ? (chat._pushName || `Grupo ${remoteJid.replace('@g.us', '')}`)
        : (chat._pushName || contactsMap.get(remoteJid) || phoneNumber)

      // Find or create contact — upsert atômico para evitar duplicatas por race condition
      const canonicalPhone = isGroup ? remoteJid : phoneNumber
      let contact: any = null

      // Primeiro tenta achar pelo phone canônico
      contact = isGroup
        ? await prisma.contact.findFirst({ where: { organizationId: connection.organizationId, phone: remoteJid } })
        : await findContactByPhone(connection.organizationId, phoneNumber)

      if (!contact) {
        // Upsert: createOrUpdate pelo par (organizationId, phone) usando updateMany + create
        // para evitar duplicata em corrida paralela
        try {
          contact = await prisma.contact.create({
            data: {
              organizationId: connection.organizationId,
              name: contactName,
              phone: canonicalPhone,
            }
          })
          syncedContacts++
        } catch (createErr: any) {
          // Se falhou por unique constraint (outro processo criou antes), busca novamente
          contact = isGroup
            ? await prisma.contact.findFirst({ where: { organizationId: connection.organizationId, phone: remoteJid } })
            : await findContactByPhone(connection.organizationId, phoneNumber)
          if (!contact) {
            logger.warn({ canonicalPhone, error: createErr.message }, 'Could not create or find contact — skipping chat')
            continue
          }
        }
      } else {
        const hasRealGroupName = isGroup && groupsMap.has(remoteJid)
        const groupHasGenericName = isGroup && contact.name && contact.name.startsWith('Grupo ')
        const shouldUpdateName = contactName && contactName !== phoneNumber && (
          !contact.name ||
          contact.name === contact.phone ||
          groupHasGenericName ||
          hasRealGroupName
        )
        if (shouldUpdateName) {
          await prisma.contact.update({
            where: { id: contact.id },
            data: { name: contactName },
          })
        }
      }

      if (chatMessages.length === 0 && chat.lastMessage) {
        chatMessages = [chat.lastMessage]
      }

      // Normalize and sort messages
      const normalizedMessages = chatMessages.map((msg: any) => ({
        key: msg.key || {},
        message: msg.message || {},
        messageTimestamp: msg.messageTimestamp || 0,
        pushName: msg.pushName || '',
        messageType: msg.messageType || '',
      }))

      const sortedMessages = normalizedMessages.sort((a: any, b: any) => {
        const tsA = typeof a.messageTimestamp === 'string' ? parseInt(a.messageTimestamp) : (a.messageTimestamp || 0)
        const tsB = typeof b.messageTimestamp === 'string' ? parseInt(b.messageTimestamp) : (b.messageTimestamp || 0)
        return tsA - tsB
      })

      // Batch dedup check
      const allMsgIds = sortedMessages.map((m: any) => m.key?.id).filter(Boolean) as string[]
      const existingMsgs = allMsgIds.length > 0
        ? await prisma.whatsAppMessage.findMany({
            where: { organizationId: connection.organizationId, messageId: { in: allMsgIds } },
            select: { messageId: true },
          })
        : []
      const existingIds = new Set(existingMsgs.map(m => m.messageId))

      // Save messages
      for (const msg of sortedMessages) {
        const messageId = msg.key?.id
        if (!messageId) continue

        if (existingIds.has(messageId)) {
          skippedExisting++
          continue
        }

        let messageText = extractMessageText(msg)
        const mediaInfo = extractMediaInfo(msg)
        if (!messageText) messageText = '[Mensagem]'

        const rawTimestamp = msg.messageTimestamp
        const ts = typeof rawTimestamp === 'string' ? parseInt(rawTimestamp) : rawTimestamp
        const timestamp = ts > 0 ? new Date(ts > 9999999999 ? ts : ts * 1000) : new Date()

        try {
          await prisma.whatsAppMessage.create({
            data: {
              contactId: contact.id,
              organizationId: connection.organizationId,
              connectionId: connection.id,
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
          logger.debug({ messageId, error: createErr.message }, 'Failed to create message (probably duplicate)')
        }
      }

      // Update contact timestamp
      if (sortedMessages.length > 0) {
        const lastMsg = sortedMessages[sortedMessages.length - 1]
        const lastTs = lastMsg.messageTimestamp
        const ts = typeof lastTs === 'string' ? parseInt(lastTs) : lastTs
        const lastDate = ts > 0 ? new Date(ts > 9999999999 ? ts : ts * 1000) : new Date()

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

  // 8. Update lastSyncAt
  await prisma.whatsAppConnection.update({
    where: { id: connection.id },
    data: { lastSyncAt: new Date() },
  })

  logger.info({ connectionId, syncedContacts, syncedMessages, skippedExisting }, 'Chat sync completed')

  return { success: true, syncedContacts, syncedMessages, skippedExisting, totalChats: validChats.length }
}
