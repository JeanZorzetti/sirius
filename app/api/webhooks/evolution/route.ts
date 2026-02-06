import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

/**
 * Webhook receiver para Evolution API v2
 *
 * Recebe eventos:
 * - QRCODE_UPDATED: QR Code atualizado
 * - CONNECTION_UPDATE: Status de conexão mudou
 * - MESSAGES_UPSERT: Novas mensagens recebidas
 * - MESSAGES_UPDATE: Atualização de status de mensagens (entregue, lido)
 */
export async function POST(request: Request) {
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
                receivedApikey: apikey?.substring(0, 10) + '...',
                expectedPrefix: process.env.EVOLUTION_API_KEY?.substring(0, 10) + '...',
            }, '❌ Invalid Evolution API key')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

            return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
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

            default:
                logger.info({ event, normalizedEvent }, '⚠️ Unhandled Evolution webhook event')
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        logger.error({ error: error.message, stack: error.stack }, '💥 Error processing Evolution webhook')
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
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

    await prisma.whatsAppConnection.update({
        where: { id: connection.id },
        data: {
            status,
            phoneNumber: phoneNumber || connection.phoneNumber,
            connectedAt: status === 'CONNECTED' ? new Date() : connection.connectedAt,
        },
    })

    logger.info({ connectionId: connection.id, status, phoneNumber }, '✅ Connection updated in DB')
}

/**
 * Processa mensagem recebida
 * - Cria/atualiza contato
 * - Salva interação no banco
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
                // Ignorar mensagens enviadas por nós
                if (message?.key?.fromMe) {
                    logger.debug({ messageId: message.key.id }, 'Skipping fromMe message')
                    continue
                }

                // Validar remoteJid
                const remoteJid = message?.key?.remoteJid
                if (!remoteJid) {
                    logger.debug({ remoteJid }, 'Skipping message without remoteJid')
                    continue
                }

                // Ignorar status, newsletter, LID direto
                if (remoteJid.includes('status@') || remoteJid.includes('@broadcast') || remoteJid.includes('@newsletter')) {
                    logger.debug({ remoteJid }, 'Skipping status/broadcast/newsletter message')
                    continue
                }

                const isGroup = remoteJid.includes('@g.us')
                const messageId = message.key?.id

                // Para grupos: usar o JID completo; para individuais: normalizar telefone
                const phoneNumber = isGroup
                    ? remoteJid
                    : normalizePhoneNumber(remoteJid.replace('@s.whatsapp.net', ''))
                const senderName = isGroup
                    ? (message.pushName || `Grupo ${remoteJid.replace('@g.us', '')}`)
                    : (message.pushName || message.verifiedBizName || phoneNumber)

                // Extrair texto - agora aceita media sem caption também
                let messageText = extractMessageText(message)

                // Se não tem texto nenhum, atribuir texto genérico ao invés de ignorar
                if (!messageText) {
                    messageText = '[Mensagem recebida]'
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
                    textPreview: messageText.substring(0, 50),
                }, '📝 Saving incoming WhatsApp message')

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
                }

                // Calcular timestamp da mensagem
                const rawTimestamp = message.messageTimestamp
                const messageTimestamp = rawTimestamp
                    ? new Date(
                        (typeof rawTimestamp === 'string'
                            ? parseInt(rawTimestamp)
                            : rawTimestamp) * 1000
                    )
                    : new Date()

                // Salvar mensagem no banco
                const savedMsg = await prisma.whatsAppMessage.create({
                    data: {
                        contactId: contact.id,
                        organizationId,
                        remoteJid,
                        messageId: messageId || `gen-${Date.now()}`,
                        text: messageText,
                        direction: 'INBOUND',
                        status: 'DELIVERED',
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
                }, '✅ WhatsApp message saved successfully')

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

/**
 * Normaliza número de telefone para formato consistente
 */
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

/**
 * Busca contato por telefone com vários formatos
 */
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

    // Busca parcial - telefone contém ou é contido
    if (!contact) {
        contact = await prisma.contact.findFirst({
            where: {
                organizationId,
                phone: { contains: phone.slice(-8) }, // últimos 8 dígitos
            }
        })
    }

    return contact
}

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
            }
        }
    } catch (error: any) {
        logger.error({ error: error.message, organizationId: connection.organizationId }, 'Error handling message status update')
    }
}

/**
 * Extrai texto da mensagem (suporta diferentes tipos)
 * Agora retorna texto para TODOS os tipos de mídia, mesmo sem caption
 */
function extractMessageText(message: any): string {
    const msg = message.message

    if (!msg) return ''

    // Mensagem de texto simples
    if (msg.conversation) return msg.conversation

    // Mensagem de texto estendida
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text

    // Mensagem com imagem
    if (msg.imageMessage) {
        return msg.imageMessage.caption
            ? `[Imagem] ${msg.imageMessage.caption}`
            : '[Imagem]'
    }

    // Mensagem com vídeo
    if (msg.videoMessage) {
        return msg.videoMessage.caption
            ? `[Vídeo] ${msg.videoMessage.caption}`
            : '[Vídeo]'
    }

    // Mensagem com documento
    if (msg.documentMessage) {
        return msg.documentMessage.fileName
            ? `[Documento] ${msg.documentMessage.fileName}`
            : '[Documento]'
    }

    // Mensagem com áudio
    if (msg.audioMessage) return '[Áudio]'

    // Sticker
    if (msg.stickerMessage) return '[Figurinha]'

    // Localização
    if (msg.locationMessage) return '[Localização]'

    // Contato
    if (msg.contactMessage || msg.contactsArrayMessage) return '[Contato]'

    // Reação
    if (msg.reactionMessage) return ''  // Reações não criam mensagem

    // Mensagem de protocolo (sistema)
    if (msg.protocolMessage) return ''

    // Qualquer outro tipo de mensagem
    return '[Mensagem]'
}
