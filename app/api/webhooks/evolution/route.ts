import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { triggerEvent } from '@/lib/pusher'
import { webhookRateLimit } from '@/lib/ratelimit'
import {
  normalizePhoneNumber,
  findContactByPhone,
  extractMessageText,
  extractMediaInfo,
} from '@/lib/whatsapp-sync'
import { triggerAgentsForInboundMessage } from '@/lib/agaas-agent-trigger'

/**
 * Webhook receiver para Evolution API v2
 *
 * Recebe eventos:
 * - QRCODE_UPDATED: QR Code atualizado
 * - CONNECTION_UPDATE: Status de conexão mudou
 * - MESSAGES_UPSERT: Novas mensagens recebidas
 * - MESSAGES_UPDATE: Atualização de status de mensagens (entregue, lido)
 */
export async function POST(request: NextRequest) {
    const blocked = await webhookRateLimit(request)
    if (blocked) return blocked

    try {
        const payload = await request.json()
        const { event, data, instance, apikey, server_url, sender } = payload

        // Log TUDO para diagnóstico (sempre info, não debug)
        logger.info({
            event,
            instance,
            sender,
            dataKeys: data ? Object.keys(data) : [],
            payloadKeys: Object.keys(payload),
            fullPayload: JSON.stringify(payload).substring(0, 2000),
        }, '🔔 Evolution webhook received')

        // Validar API key
        if (apikey !== process.env.EVOLUTION_API_KEY) {
            logger.warn({
                instance,
                event,
            }, '❌ Invalid Evolution API key')
            return NextResponse.json({
                error: 'Unauthorized',
            }, { status: 401 })
        }

        // Encontrar conexão pela instância - BUSCA FLEXÍVEL
        // Evolution API pode enviar o nome com ou sem prefixo da org
        const connection = await findConnectionByInstance(instance, sender)

        if (!connection) {
            logger.warn({
                instance,
                sender,
                // Listar todas as connections para debug
            }, '❌ Connection not found for Evolution instance - listing all connections for debug')

            // Log todas as connections existentes para comparação
            const allConnections = await prisma.whatsAppConnection.findMany({
                select: { id: true, instanceName: true, status: true, organizationId: true },
            })
            logger.info({ allConnections }, '📋 All connections in DB')

            // Retorna 200 para evitar re-envios do provedor
            return NextResponse.json({ ignored: true })
        }

        logger.info({ connectionId: connection.id, instanceName: connection.instanceName }, '✅ Connection matched')

        // Normalizar nome do evento (Evolution API v2 pode usar vários formatos)
        // Exemplos: "messages.upsert", "MESSAGES_UPSERT", "messages-upsert"
        const normalizedEvent = event
            ?.toUpperCase?.()
            ?.replace(/\./g, '_')
            ?.replace(/-/g, '_')
            || event

        // Processar diferentes tipos de eventos
        switch (normalizedEvent) {
            case 'QRCODE_UPDATED':
                await handleQRCodeUpdate(connection, data)
                break

            case 'CONNECTION_UPDATE':
                await handleConnectionUpdate(connection, data)
                break

            case 'MESSAGES_UPSERT':
                await handleIncomingMessage(connection, data)
                break

            case 'MESSAGES_UPDATE':
                await handleMessageStatusUpdate(connection, data)
                break

            case 'CONTACTS_UPSERT':
                await handleContactsUpsert(connection, data)
                break

            case 'CHATS_UPSERT':
                await handleChatsUpsert(connection, data)
                break

            default:
                logger.info({ event, normalizedEvent }, '⚠️ Unhandled Evolution webhook event')
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        // Sempre retorna 200 — provedores re-enviam quando recebem 4xx/5xx
        logger.error({ error: error.message, stack: error.stack }, 'Error processing Evolution webhook')
        return NextResponse.json({ success: true })
    }
}

/**
 * Busca conexão por nome de instância - FLEXÍVEL
 * Evolution API pode retornar o nome da instância em diferentes formatos:
 *  - Exatamente como salvamos: "orgId-instanceName"
 *  - Apenas o instanceName sem o prefixo da org
 *  - No campo 'sender' ao invés de 'instance'
 */
async function findConnectionByInstance(instance?: string, sender?: string): Promise<any | null> {
    const searchNames = [instance, sender].filter(Boolean)

    for (const name of searchNames) {
        if (!name) continue

        // 1. Busca exata
        let connection = await prisma.whatsAppConnection.findFirst({
            where: { instanceName: name },
            include: { organization: true },
        })
        if (connection) return connection

        // 2. Busca com contains (caso o nome tenha prefixo/sufixo extra)
        connection = await prisma.whatsAppConnection.findFirst({
            where: {
                instanceName: { contains: name },
            },
            include: { organization: true },
        })
        if (connection) return connection

        // 3. Busca inversa - o nome do banco contém o que veio no webhook
        connection = await prisma.whatsAppConnection.findFirst({
            where: {
                instanceName: { endsWith: name },
            },
            include: { organization: true },
        })
        if (connection) return connection
    }

    // 4. Se instance parece ser "orgId-name", buscar por "orgId-name"
    // mas também buscar só pela parte após o último "-"
    if (instance?.includes('-')) {
        const parts = instance.split('-')
        const shortName = parts[parts.length - 1]

        const connection = await prisma.whatsAppConnection.findFirst({
            where: {
                instanceName: { endsWith: `-${shortName}` },
            },
            include: { organization: true },
        })
        if (connection) return connection
    }

    // 5. Último recurso: se há apenas UMA connection, usar ela
    const allConnections = await prisma.whatsAppConnection.findMany({
        where: { status: { in: ['CONNECTED', 'CONNECTING'] } },
        include: { organization: true },
    })
    if (allConnections.length === 1) {
        logger.warn({ instance, matchedAs: allConnections[0].instanceName }, '⚠️ Using single active connection as fallback match')
        return allConnections[0]
    }

    return null
}

/**
 * Handle QR Code update
 */
async function handleQRCodeUpdate(connection: any, data: any) {
    logger.info({ instanceName: connection.instanceName }, '📱 QR Code updated')

    await prisma.whatsAppConnection.update({
        where: { id: connection.id },
        data: { status: 'CONNECTING' },
    })
}

/**
 * Handle connection status update
 */
async function handleConnectionUpdate(connection: any, data: any) {
    const state = data?.state // 'open', 'connecting', 'close'

    logger.info({
        instanceName: connection.instanceName,
        state,
        fullData: JSON.stringify(data).substring(0, 500),
    }, '🔌 Connection state updated')

    let status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' = 'DISCONNECTED'
    if (state === 'open') {
        status = 'CONNECTED'
    } else if (state === 'connecting') {
        status = 'CONNECTING'
    }

    // Evolution API v2 envia o número em vários formatos possíveis
    const phoneNumber =
        data?.statusReason?.phoneNumber ||
        data?.instance?.owner?.split('@')?.[0] ||
        data?.ownerJid?.split('@')?.[0] ||
        data?.wuid?.split(':')?.[0] ||
        data?.number ||
        connection.phoneNumber // manter o existente se não vier novo

    const wasDisconnected = connection.status !== 'CONNECTED'

    await prisma.whatsAppConnection.update({
        where: { id: connection.id },
        data: {
            status,
            phoneNumber: phoneNumber || connection.phoneNumber,
            connectedAt: status === 'CONNECTED' ? new Date() : connection.connectedAt,
        },
    })

    logger.info({ connectionId: connection.id, status, phoneNumber }, '✅ Connection updated in DB')

    // Notificar clientes via Pusher sobre mudança de conexão
    if (status === 'CONNECTED' && wasDisconnected) {
        triggerEvent(connection.organizationId, 'connection:ready', {
            connectionId: connection.id,
            instanceName: connection.instanceName,
        })
    }
}

/**
 * Processa mensagem recebida (INBOUND e OUTBOUND do telefone)
 * - Cria/atualiza contato
 * - Salva interação no banco com mediaUrl/mediaType quando aplicável
 * - Mensagens fromMe também são salvas para manter chat em tempo real
 */
async function handleIncomingMessage(connection: any, data: any) {
    try {
        logger.info({
            dataType: typeof data,
            isArray: Array.isArray(data),
            dataKeys: data ? Object.keys(data) : [],
            dataStr: JSON.stringify(data).substring(0, 1000),
        }, '📩 Processing MESSAGES_UPSERT payload')

        // Evolution API v2 envia 'data' em vários formatos possíveis:
        //   1. Array de mensagens
        //   2. { messages: [...] }
        //   3. Mensagem direta com { key: {...}, message: {...} }
        //   4. Objeto com campos misturados
        let messages: any[]
        if (Array.isArray(data)) {
            messages = data
        } else if (data?.messages && Array.isArray(data.messages)) {
            messages = data.messages
        } else if (data?.key) {
            messages = [data]
        } else if (data?.message && data?.key === undefined) {
            // Tentar wrapping caso data tenha campos diretos
            messages = [data]
        } else {
            logger.warn({
                dataStr: JSON.stringify(data).substring(0, 500),
            }, '❓ Unknown MESSAGES_UPSERT payload structure - attempting to process anyway')
            // Último recurso: tentar como mensagem única
            messages = [data]
        }

        const organizationId = connection.organizationId

        for (const message of messages) {
            try {
                // Log every single message for debugging
                const msgKeys = message?.message ? Object.keys(message.message) : []
                logger.info({
                    keyId: message?.key?.id,
                    remoteJid: message?.key?.remoteJid,
                    senderPn: message?.key?.senderPn,
                    remoteJidAlt: message?.key?.remoteJidAlt,
                    fromMe: message?.key?.fromMe,
                    messageTypes: msgKeys,
                    messageType: message?.messageType,
                }, '🔍 Processing individual message')

                const isFromMe = !!message?.key?.fromMe

                // Resolve remoteJid — WhatsApp LID privacy sends @lid instead of real number.
                let remoteJid = message?.key?.remoteJid
                const senderPn = message?.key?.senderPn
                const remoteJidAlt = message?.key?.remoteJidAlt

                if (!remoteJid && !senderPn && !remoteJidAlt) {
                    logger.info({ messageKey: message?.key }, 'Skipping message without any JID')
                    continue
                }

                // Resolve LID to real JID
                if (remoteJid?.includes('@lid')) {
                    if (senderPn) {
                        logger.info({ lid: remoteJid, senderPn }, '🔄 Resolving LID via senderPn')
                        remoteJid = senderPn.includes('@') ? senderPn : `${senderPn}@s.whatsapp.net`
                    } else if (remoteJidAlt && !remoteJidAlt.includes('@lid')) {
                        logger.info({ lid: remoteJid, remoteJidAlt }, '🔄 Resolving LID via remoteJidAlt')
                        remoteJid = remoteJidAlt
                    } else {
                        logger.warn({ remoteJid, keyFields: Object.keys(message?.key || {}) }, '⚠️ LID message without senderPn or remoteJidAlt — skipping')
                        continue
                    }
                }

                // Fallback if remoteJid is missing entirely
                if (!remoteJid) {
                    remoteJid = senderPn || remoteJidAlt
                    if (!remoteJid) continue
                }

                // Ignorar status, newsletter, broadcast
                if (remoteJid!.includes('status@') || remoteJid!.includes('@broadcast') || remoteJid!.includes('@newsletter')) {
                    logger.debug({ remoteJid }, 'Skipping status/broadcast/newsletter message')
                    continue
                }

                // Ignorar mensagens puramente de protocolo/sistema
                // IMPORTANT: senderKeyDistributionMessage is an encryption key exchange
                // that is often bundled WITH the actual message content (extendedTextMessage,
                // conversation, imageMessage, etc.). Only skip if it's the ONLY content.
                const msg = message.message
                if (msg?.protocolMessage || msg?.reactionMessage) {
                    logger.debug({ messageId: message.key?.id }, 'Skipping protocol/reaction message')
                    continue
                }
                if (msg?.senderKeyDistributionMessage && !msg.conversation && !msg.extendedTextMessage
                    && !msg.imageMessage && !msg.videoMessage && !msg.documentMessage
                    && !msg.audioMessage && !msg.pttMessage && !msg.stickerMessage
                    && !msg.contactMessage && !msg.contactsArrayMessage
                    && !msg.locationMessage && !msg.liveLocationMessage
                    && !msg.viewOnceMessage && !msg.viewOnceMessageV2
                    && !msg.pollCreationMessage && !msg.pollCreationMessageV3) {
                    logger.debug({ messageId: message.key?.id }, 'Skipping pure senderKeyDistribution message')
                    continue
                }

                const isGroup = remoteJid.includes('@g.us')
                const messageId = message.key?.id

                // Para grupos: usar o JID completo; para individuais: normalizar telefone
                const phoneNumber = isGroup
                    ? remoteJid
                    : normalizePhoneNumber(remoteJid.replace('@s.whatsapp.net', ''))

                // Para grupos: o nome do grupo geralmente vem em message.pushName ou message.groupMetadata.subject
                // Se não tiver nome, usar o nome genérico temporariamente (a sync vai atualizar)
                const senderName = isGroup
                    ? (message.pushName || message.groupMetadata?.subject || `Grupo ${remoteJid.replace('@g.us', '')}`)
                    : (message.pushName || message.verifiedBizName || phoneNumber)

                // Extrair texto e mídia
                let messageText = extractMessageText(message)
                const mediaInfo = extractMediaInfo(message)

                // Se não tem texto nenhum, atribuir texto genérico
                if (!messageText) {
                    messageText = isFromMe ? '[Mensagem enviada]' : '[Mensagem recebida]'
                }

                // Verificar se mensagem já existe (dedup)
                if (messageId) {
                    const existingMessage = await prisma.whatsAppMessage.findFirst({
                        where: { messageId, organizationId }
                    })

                    if (existingMessage) {
                        logger.debug({ messageId }, 'Message already exists, skipping')
                        continue
                    }
                }

                logger.info({
                    organizationId,
                    remoteJid,
                    messageId,
                    senderName,
                    isFromMe,
                    mediaType: mediaInfo?.type || null,
                    textPreview: messageText.substring(0, 50),
                }, '📝 Saving WhatsApp message')

                // Buscar contato - para grupos buscar por JID, para individuais por telefone
                let contact: any = null
                if (isGroup) {
                    contact = await prisma.contact.findFirst({
                        where: { organizationId, phone: remoteJid }
                    })
                } else {
                    contact = await findContactByPhone(organizationId, phoneNumber)
                }

                if (!contact) {
                    contact = await prisma.contact.create({
                        data: {
                            organizationId,
                            name: senderName,
                            phone: isGroup ? remoteJid : phoneNumber,
                        }
                    })

                    logger.info({ contactId: contact.id, phone: phoneNumber, isGroup }, '👤 Created new contact from WhatsApp')
                } else if (isGroup) {
                    // Para grupos: atualizar nome se o contato tem um nome genérico e recebemos um nome real
                    const hasGenericName = contact.name?.startsWith('Grupo ') || contact.name === phoneNumber || contact.name === remoteJid
                    const hasRealName = senderName && !senderName.startsWith('Grupo ')
                    if (hasGenericName && hasRealName) {
                        await prisma.contact.update({
                            where: { id: contact.id },
                            data: { name: senderName },
                        })
                        contact = { ...contact, name: senderName }
                        logger.info({ contactId: contact.id, oldName: contact.name, newName: senderName }, '👤 Updated group name')
                    }
                } else if (!isGroup && message.pushName && message.pushName !== phoneNumber) {
                    // Para contatos individuais: atualizar nome se o contato não tem nome
                    // ou se o nome atual é apenas o número de telefone
                    const currentName = contact.name || ''
                    const isPhoneName = !currentName || currentName === contact.phone || /^\d+$/.test(currentName.replace(/\D/g, ''))
                    if (isPhoneName) {
                        await prisma.contact.update({
                            where: { id: contact.id },
                            data: { name: message.pushName },
                        })
                        contact = { ...contact, name: message.pushName }
                        logger.info({ contactId: contact.id, oldName: currentName, newName: message.pushName }, '👤 Updated contact name from pushName')
                    }
                }

                // Calcular timestamp da mensagem
                const rawTimestamp = message.messageTimestamp
                const ts = typeof rawTimestamp === 'string' ? parseInt(rawTimestamp) : (rawTimestamp || 0)
                const messageTimestamp = ts > 0
                    ? new Date(ts > 9999999999 ? ts : ts * 1000)
                    : new Date()

                // Salvar mensagem no banco
                const savedMsg = await prisma.whatsAppMessage.create({
                    data: {
                        contactId: contact.id,
                        organizationId,
                        connectionId: connection.id,
                        remoteJid,
                        messageId: messageId || `gen-${Date.now()}`,
                        text: messageText,
                        direction: isFromMe ? 'OUTBOUND' : 'INBOUND',
                        status: isFromMe ? 'SENT' : 'DELIVERED',
                        mediaUrl: mediaInfo?.url || null,
                        mediaType: mediaInfo?.type || null,
                        sentAt: messageTimestamp,
                    }
                })

                // Atualizar updatedAt do contato (para ordenar conversas)
                await prisma.contact.update({
                    where: { id: contact.id },
                    data: { updatedAt: new Date() }
                })

                logger.info({
                    savedMessageId: savedMsg.id,
                    contactId: contact.id,
                    messageId,
                    direction: isFromMe ? 'OUTBOUND' : 'INBOUND',
                }, '✅ WhatsApp message saved successfully')

                // Real-time: notify via Pusher
                triggerEvent(organizationId, 'message:new', {
                  contactId: contact.id,
                  message: {
                    id: savedMsg.id,
                    text: savedMsg.text,
                    direction: savedMsg.direction,
                    status: savedMsg.status,
                    sentAt: savedMsg.sentAt.toISOString(),
                    mediaUrl: savedMsg.mediaUrl,
                    mediaType: savedMsg.mediaType,
                  },
                  contactName: contact.name,
                  contactPhone: contact.phone,
                })

                // AgaaS: trigger agents for inbound messages (non-blocking)
                if (!isFromMe && messageText) {
                  triggerAgentsForInboundMessage({
                    organizationId,
                    contactId: contact.id,
                    messageId: savedMsg.id,
                    messageText,
                    contactName: contact.name || '',
                    contactPhone: contact.phone,
                  }).catch(() => {}) // fire-and-forget, errors logged internally
                }

            } catch (msgError: any) {
                logger.error({
                    error: msgError.message,
                    messageKey: message?.key,
                }, '💥 Error processing individual message')
                // Continuar com próxima mensagem
            }
        }
    } catch (error: any) {
        logger.error({
            error: error.message,
            stack: error.stack,
            organizationId: connection.organizationId,
        }, '💥 Error handling incoming WhatsApp messages batch')
    }
}

// normalizePhoneNumber, findContactByPhone — imported from @/lib/whatsapp-sync

/**
 * Atualiza status de mensagem (entregue, lido)
 */
async function handleMessageStatusUpdate(connection: any, data: any) {
    try {
        // Evolution API v2 pode enviar como array ou array dentro de data
        let updates: any[]
        if (Array.isArray(data)) {
            updates = data
        } else if (data?.key) {
            updates = [data]
        } else {
            updates = []
        }

        const organizationId = connection.organizationId

        for (const update of updates) {
            const messageId = update.key?.id
            if (!messageId) continue

            const status = update.update?.status || update.status

            if (status === 'DELIVERY_ACK' || status === 'DELIVERED' || status === 3) {
                await prisma.whatsAppMessage.updateMany({
                    where: {
                        organizationId,
                        messageId,
                        direction: 'OUTBOUND',
                    },
                    data: {
                        status: 'DELIVERED',
                        deliveredAt: new Date(),
                    },
                })
                // Real-time: notify via Pusher
                triggerEvent(organizationId, 'message:status', {
                  messageId,
                  status: 'DELIVERED',
                })
            } else if (status === 'READ' || status === 4) {
                await prisma.whatsAppMessage.updateMany({
                    where: {
                        organizationId,
                        messageId,
                        direction: 'OUTBOUND',
                    },
                    data: {
                        status: 'READ',
                        readAt: new Date(),
                        deliveredAt: new Date(),
                    },
                })
                // Real-time: notify via Pusher
                triggerEvent(organizationId, 'message:status', {
                  messageId,
                  status: 'READ',
                })
            }
        }
    } catch (error: any) {
        logger.error({ error: error.message, organizationId: connection.organizationId }, 'Error handling message status update')
    }
}

// extractMessageText, extractMediaInfo — imported from @/lib/whatsapp-sync


/**
 * Handle CONTACTS_UPSERT - Atualiza cria contatos em tempo real
 * Evolution API envia este evento quando novos contatos são descobertos
 */
async function handleContactsUpsert(connection: any, data: any) {
    try {
        const contacts = Array.isArray(data) ? data : [data]
        const organizationId = connection.organizationId

        logger.info({ count: contacts.length }, '👥 Processing CONTACTS_UPSERT')

        for (const contact of contacts) {
            try {
                const remoteJid = contact.id || contact.remoteJid
                if (!remoteJid) continue

                // Ignorar LID, broadcast, etc
                if (remoteJid.includes('@lid') || remoteJid.includes('@broadcast') || remoteJid.includes('status@')) {
                    continue
                }

                const isGroup = remoteJid.includes('@g.us')
                const name = contact.pushName || contact.name || contact.notify
                
                if (!name) continue

                // Buscar contato existente
                let existingContact: any = null
                if (isGroup) {
                    existingContact = await prisma.contact.findFirst({
                        where: { organizationId, phone: remoteJid }
                    })
                } else {
                    const phoneNumber = normalizePhoneNumber(remoteJid.replace('@s.whatsapp.net', ''))
                    existingContact = await findContactByPhone(organizationId, phoneNumber)
                }

                if (existingContact) {
                    // Atualizar nome se o contato existe mas tem nome genérico
                    const hasGenericName = !existingContact.name || 
                        existingContact.name.startsWith('Grupo ') || 
                        existingContact.name === existingContact.phone ||
                        /^\d+$/.test(existingContact.name.replace(/\D/g, ''))
                    
                    if (hasGenericName) {
                        await prisma.contact.update({
                            where: { id: existingContact.id },
                            data: { name },
                        })
                        logger.info({ contactId: existingContact.id, newName: name }, '👤 Updated contact name from CONTACTS_UPSERT')
                    }
                }
                // Nota: Não criamos novos contatos aqui - isso é feito no MESSAGES_UPSERT
            } catch (err: any) {
                logger.debug({ error: err.message }, 'Error processing individual contact')
            }
        }
    } catch (error: any) {
        logger.error({ error: error.message }, 'Error handling CONTACTS_UPSERT')
    }
}

/**
 * Handle CHATS_UPSERT - Atualiza chats em tempo real
 * Evolution API envia este evento quando novos chats são descobertos
 */
async function handleChatsUpsert(connection: any, data: any) {
    try {
        const chats = Array.isArray(data) ? data : [data]
        const organizationId = connection.organizationId

        logger.info({ count: chats.length }, '💬 Processing CHATS_UPSERT')

        for (const chat of chats) {
            try {
                const remoteJid = chat.id || chat.remoteJid
                if (!remoteJid || !remoteJid.includes('@g.us')) continue // Só processar grupos

                const groupName = chat.name || chat.subject
                if (!groupName) continue

                // Buscar contato existente (grupo)
                const existingContact = await prisma.contact.findFirst({
                    where: { organizationId, phone: remoteJid }
                })

                if (existingContact) {
                    // Atualizar nome do grupo se necessário
                    const hasGenericName = !existingContact.name || 
                        existingContact.name.startsWith('Grupo ')
                    
                    if (hasGenericName) {
                        await prisma.contact.update({
                            where: { id: existingContact.id },
                            data: { name: groupName },
                        })
                        logger.info({ contactId: existingContact.id, newName: groupName }, '👥 Updated group name from CHATS_UPSERT')
                    }
                }
            } catch (err: any) {
                logger.debug({ error: err.message }, 'Error processing individual chat')
            }
        }
    } catch (error: any) {
        logger.error({ error: error.message }, 'Error handling CHATS_UPSERT')
    }
}
