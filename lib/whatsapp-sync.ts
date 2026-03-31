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

/**
 * Normaliza phone para formato canônico: apenas dígitos, com DDI 55.
 * Ex: "19998442269" → "5519998442269", "5519998442269" → "5519998442269"
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  // Celular BR 11 dígitos (DDD + 9 dígitos)
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  // Fixo BR 10 dígitos (DDD + 8 dígitos)
  if (cleaned.length === 10 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  return cleaned
}

/**
 * Busca contato por phone em TODAS as variações possíveis.
 * Retorna o primeiro match encontrado.
 */
export async function findContactByPhone(organizationId: string, phone: string) {
  // Gera todas as variações possíveis do phone
  const normalized = normalizePhoneNumber(phone)
  const withoutCountry = normalized.startsWith('55') ? normalized.substring(2) : normalized
  const last8 = normalized.slice(-8)

  const variations = [...new Set([phone, normalized, withoutCountry, '55' + withoutCountry])]

  // Busca por match exato em qualquer variação
  const contact = await prisma.contact.findFirst({
    where: {
      organizationId,
      phone: { in: variations },
    }
  })
  if (contact) return contact

  // Fallback: busca por sufixo (últimos 8 dígitos)
  return prisma.contact.findFirst({
    where: {
      organizationId,
      phone: { endsWith: last8 },
    }
  })
}

export function extractMessageText(message: any): string {
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

  const orgId = connection.organizationId
  logger.info({ connectionId, instanceName: connection.instanceName }, 'Starting chat sync')

  // Janela de 7 dias — ISO string para a Evolution API
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Fetch chats (findChats já retorna remoteJid, pushName, lastMessage)
  let chats: any[] = []
  try {
    chats = await evolutionClient.getChats(connection.instanceName, sevenDaysAgo)
    logger.info({ chatsCount: chats?.length || 0 }, 'Fetched chats from Evolution API')
  } catch (err: any) {
    // Fallback: tenta sem filtro de data
    try {
      chats = await evolutionClient.getChats(connection.instanceName)
      logger.info({ chatsCount: chats?.length || 0 }, 'Fetched chats (no date filter)')
    } catch (err2: any) {
      logger.error({ error: err2.message }, 'Failed to fetch chats')
      throw new Error(`Failed to fetch chats: ${err2.message}`)
    }
  }

  // 2. Fetch contacts para name resolution (fallback)
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

  // 3. Fetch groups para name resolution (fallback)
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

  // 4. Parse chats — resolver JIDs e nomes
  const parsedChats = (chats || []).map((chat: any) => {
    let remoteJid = chat.remoteJid || chat.id || chat.lastMessage?.key?.remoteJid || ''

    // Resolver @lid para @s.whatsapp.net
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

  let syncedContacts = 0
  let syncedMessages = 0
  let skippedExisting = 0

  logger.info({ totalChats: uniqueChats.length }, 'Chats to sync after dedup/filter')

  // 7. Process each chat
  for (const chat of uniqueChats) {
    try {
      let remoteJid = chat._remoteJid
      if (!remoteJid) continue

      const isLid = remoteJid.includes('@lid')
      const isGroup = chat._isGroup

      // Fetch mensagens dos últimos 7 dias com paginação automática
      let chatMessages: any[] = []
      try {
        chatMessages = await evolutionClient.getMessages(connection.instanceName, remoteJid, sevenDaysAgo)
        if (!Array.isArray(chatMessages)) chatMessages = []
      } catch (err: any) {
        // Fallback: tenta sem filtro de data
        try {
          chatMessages = await evolutionClient.getMessages(connection.instanceName, remoteJid)
          if (!Array.isArray(chatMessages)) chatMessages = []
        } catch {
          // Último fallback: usa lastMessage do findChats
          if (chat.lastMessage) chatMessages = [chat.lastMessage]
        }
      }

      // LID resolution (precisa de mensagens para resolver)
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

      // Normalizar phone
      const phoneNumber = isGroup
        ? remoteJid
        : normalizePhoneNumber(remoteJid.replace('@s.whatsapp.net', ''))

      const contactName = isGroup
        ? (chat._pushName || `Grupo ${remoteJid.replace('@g.us', '')}`)
        : (chat._pushName || contactsMap.get(remoteJid) || phoneNumber)

      // ============================================================
      // FIND OR CREATE CONTACT — garantir unicidade
      // ============================================================
      const canonicalPhone = isGroup ? remoteJid : phoneNumber
      let contact = await findContactByPhone(orgId, canonicalPhone)

      if (!contact) {
        try {
          contact = await prisma.contact.create({
            data: { organizationId: orgId, name: contactName, phone: canonicalPhone }
          })
          syncedContacts++
        } catch {
          // Race condition: outro processo criou. Rebuscar.
          contact = await findContactByPhone(orgId, canonicalPhone)
          if (!contact) continue
        }
      } else {
        // Atualizar nome se genérico
        const shouldUpdateName = contactName && contactName !== phoneNumber && (
          !contact.name || contact.name === contact.phone ||
          (isGroup && contact.name.startsWith('Grupo ') && groupsMap.has(remoteJid))
        )
        if (shouldUpdateName) {
          await prisma.contact.update({ where: { id: contact.id }, data: { name: contactName } })
        }
      }

      // Fallback: usar lastMessage do findChats
      if (chatMessages.length === 0 && chat.lastMessage) {
        chatMessages = [chat.lastMessage]
      }

      if (chatMessages.length === 0) continue

      // ============================================================
      // SALVAR MENSAGENS — com dedup via unique constraint (orgId + messageId)
      // ============================================================
      const validMessages = chatMessages
        .map((msg: any) => ({
          key: msg.key || {},
          message: msg.message || {},
          messageTimestamp: msg.messageTimestamp || 0,
          pushName: msg.pushName || '',
          messageType: msg.messageType || '',
        }))
        .filter((msg: any) => msg.key?.id) // Só mensagens com ID válido
        .sort((a: any, b: any) => {
          const tsA = typeof a.messageTimestamp === 'string' ? parseInt(a.messageTimestamp) : (a.messageTimestamp || 0)
          const tsB = typeof b.messageTimestamp === 'string' ? parseInt(b.messageTimestamp) : (b.messageTimestamp || 0)
          return tsA - tsB
        })

      // Batch dedup: buscar quais messageIds já existem no DB
      const msgIds = validMessages.map((m: any) => m.key.id as string)
      const existingMsgs = await prisma.whatsAppMessage.findMany({
        where: { organizationId: orgId, messageId: { in: msgIds } },
        select: { messageId: true },
      })
      const existingIds = new Set(existingMsgs.map(m => m.messageId))

      for (const msg of validMessages) {
        const messageId = msg.key.id as string

        if (existingIds.has(messageId)) {
          skippedExisting++
          continue
        }

        let messageText = extractMessageText(msg)
        const mediaInfo = extractMediaInfo(msg)
        if (!messageText) messageText = '[Mensagem]'

        const rawTs = msg.messageTimestamp
        const ts = typeof rawTs === 'string' ? parseInt(rawTs) : rawTs
        const timestamp = ts > 0 ? new Date(ts > 9999999999 ? ts : ts * 1000) : new Date()

        try {
          await prisma.whatsAppMessage.create({
            data: {
              contactId: contact.id,
              organizationId: orgId,
              connectionId: connection.id,
              remoteJid,
              messageId,
              text: messageText,
              direction: msg.key.fromMe ? 'OUTBOUND' : 'INBOUND',
              status: msg.key.fromMe ? 'SENT' : 'DELIVERED',
              mediaUrl: mediaInfo?.url || null,
              mediaType: mediaInfo?.type || null,
              sentAt: timestamp,
            }
          })
          syncedMessages++
          existingIds.add(messageId) // previne duplicatas dentro do mesmo batch
        } catch {
          // Unique constraint violation — mensagem já existe, skip silencioso
          skippedExisting++
        }
      }

      // Update contact timestamp para ordenação
      if (validMessages.length > 0) {
        const lastMsg = validMessages[validMessages.length - 1]
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

  return { success: true, syncedContacts, syncedMessages, skippedExisting, totalChats: uniqueChats.length }
}
