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
        const { event, data, instance, apikey } = payload

        logger.info({ event, instance, dataKeys: data ? Object.keys(data) : [] }, 'Evolution webhook received')

        // Log full payload for debugging (first 1000 chars)
        logger.debug({ payload: JSON.stringify(payload).substring(0, 1000) }, 'Evolution webhook full payload')

        // Validar API key
        if (apikey !== process.env.EVOLUTION_API_KEY) {
            logger.warn({ receivedApikey: apikey }, 'Invalid Evolution API key')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Encontrar conexão pela instância
        const connection = await prisma.whatsAppConnection.findFirst({
            where: {
                instanceName: instance,
            },
            include: {
                organization: true,
            },
        })

        if (!connection) {
            logger.warn({ instance }, 'Connection not found for Evolution instance')
            return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
        }

        // Normalizar nome do evento (Evolution API v2 usa lowercase com ponto)
        const normalizedEvent = event?.toUpperCase?.()?.replace(/\./g, '_') || event

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
                logger.debug({ event, normalizedEvent }, 'Unhandled Evolution webhook event')
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        logger.error({ error }, 'Error processing Evolution webhook')
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * Handle QR Code update
 */
async function handleQRCodeUpdate(connection: any, data: any) {
    logger.info({ instanceName: connection.instanceName }, 'QR Code updated')

    await prisma.whatsAppConnection.update({
        where: { id: connection.id },
        data: { status: 'CONNECTING' },
    })
}

/**
 * Handle connection status update
 */
async function handleConnectionUpdate(connection: any, data: any) {
    const state = data.state // 'open', 'connecting', 'close'

    logger.info({ instanceName: connection.instanceName, state, data: JSON.stringify(data).substring(0, 500) }, 'Connection state updated')

    let status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' = 'DISCONNECTED'
    if (state === 'open') {
        status = 'CONNECTED'
    } else if (state === 'connecting') {
        status = 'CONNECTING'
    }

    // Evolution API v2 envia o número em vários formatos possíveis
    const phoneNumber =
        data.statusReason?.phoneNumber ||
        data.instance?.owner?.split('@')?.[0] ||
        data.ownerJid?.split('@')?.[0] ||
        data.wuid?.split(':')?.[0] ||
        connection.phoneNumber // manter o existente se não vier novo

    await prisma.whatsAppConnection.update({
        where: { id: connection.id },
        data: {
            status,
            phoneNumber: phoneNumber || connection.phoneNumber,
            connectedAt: status === 'CONNECTED' ? new Date() : connection.connectedAt,
        },
    })
}

/**
 * Processa mensagem recebida
 * - Cria/atualiza contato
 * - Salva interação no banco
 */
async function handleIncomingMessage(connection: any, data: any) {
    try {
        // Evolution API v2 envia 'data' como objeto direto da mensagem,
        // não como { messages: [...] }. Suportamos ambos os formatos.
        let messages: any[]
        if (Array.isArray(data)) {
            messages = data
        } else if (data?.messages && Array.isArray(data.messages)) {
            messages = data.messages
        } else if (data?.key) {
            // Evolution API v2: data É a mensagem diretamente
            messages = [data]
        } else {
            logger.warn({ data: JSON.stringify(data).substring(0, 500) }, 'Unknown MESSAGES_UPSERT payload structure')
            return
        }

        const organizationId = connection.organizationId

        for (const message of messages) {
            // Ignorar mensagens enviadas por nós
            if (message.key?.fromMe) {
                continue
            }

            // Ignorar mensagens de grupo
            const remoteJid = message.key?.remoteJid
            if (!remoteJid || remoteJid.includes('@g.us')) {
                continue
            }

            const messageId = message.key.id
            const messageText = extractMessageText(message)
            const phoneNumber = normalizePhoneNumber(remoteJid.replace('@s.whatsapp.net', ''))
            const senderName = message.pushName || phoneNumber

            // Ignorar mensagens sem texto (notificações do sistema etc.)
            if (!messageText) {
                logger.debug({ messageId, remoteJid }, 'Skipping message without text content')
                continue
            }

            // Verificar se mensagem já existe (dedup)
            const existingMessage = await prisma.whatsAppMessage.findFirst({
                where: { messageId, organizationId }
            })

            if (existingMessage) {
                logger.debug({ messageId }, 'Message already exists, skipping')
                continue
            }

            logger.info({
                organizationId,
                remoteJid,
                messageId,
                senderName,
                textPreview: messageText.substring(0, 50),
            }, 'Processing incoming WhatsApp message')

            // Buscar contato com normalização de telefone
            let contact = await findContactByPhone(organizationId, phoneNumber)

            if (!contact) {
                contact = await prisma.contact.create({
                    data: {
                        organizationId,
                        name: senderName,
                        phone: phoneNumber,
                    }
                })

                logger.info({ contactId: contact.id, phone: phoneNumber }, 'Created new contact from WhatsApp')
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
            await prisma.whatsAppMessage.create({
                data: {
                    contactId: contact.id,
                    organizationId,
                    remoteJid,
                    messageId,
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
                contactId: contact.id,
                messageId,
            }, 'WhatsApp message saved')
        }
    } catch (error: any) {
        logger.error({ error: error.message, stack: error.stack, organizationId: connection.organizationId }, 'Error handling incoming WhatsApp message')
    }
}

/**
 * Normaliza número de telefone para formato consistente
 * Remove código do país e caracteres especiais
 * Ex: "+5511999999999" -> "5511999999999"
 * Ex: "11999999999" -> "5511999999999"
 */
function normalizePhoneNumber(phone: string): string {
    // Remove tudo exceto números
    let cleaned = phone.replace(/\D/g, '')

    // Se tem 11 dígitos (DDD + número brasileiro), adicionar 55
    if (cleaned.length === 11 && !cleaned.startsWith('55')) {
        cleaned = '55' + cleaned
    }

    // Se tem 10 dígitos (DDD + número fixo brasileiro), adicionar 55
    if (cleaned.length === 10 && !cleaned.startsWith('55')) {
        cleaned = '55' + cleaned
    }

    return cleaned
}

/**
 * Busca contato por telefone com vários formatos
 */
async function findContactByPhone(organizationId: string, phone: string) {
    // Tentar busca exata primeiro
    let contact = await prisma.contact.findFirst({
        where: { organizationId, phone }
    })

    if (contact) return contact

    // Tentar sem código do país
    const withoutCountry = phone.startsWith('55') ? phone.substring(2) : phone
    contact = await prisma.contact.findFirst({
        where: { organizationId, phone: withoutCountry }
    })

    if (contact) return contact

    // Tentar com código do país
    if (!phone.startsWith('55')) {
        contact = await prisma.contact.findFirst({
            where: { organizationId, phone: '55' + phone }
        })
    }

    return contact
}

/**
 * Atualiza status de mensagem (entregue, lido)
 */
async function handleMessageStatusUpdate(connection: any, data: any) {
    try {
        const updates = data || []
        const organizationId = connection.organizationId

        for (const update of updates) {
            const messageId = update.key?.id
            if (!messageId) continue

            const status = update.update?.status

            // Atualizar status da mensagem
            if (status === 'DELIVERY_ACK' || status === 'DELIVERED') {
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

                logger.info({ messageId, status: 'DELIVERED' }, 'Updated message status')
            } else if (status === 'READ') {
                await prisma.whatsAppMessage.updateMany({
                    where: {
                        organizationId,
                        messageId,
                        direction: 'OUTBOUND',
                    },
                    data: {
                        status: 'READ',
                        readAt: new Date(),
                        deliveredAt: new Date(), // Se foi lido, foi entregue também
                    },
                })

                logger.info({ messageId, status: 'READ' }, 'Updated message status')
            }
        }
    } catch (error: any) {
        logger.error({ error, organizationId: connection.organizationId }, 'Error handling message status update')
    }
}

/**
 * Extrai texto da mensagem (suporta diferentes tipos)
 */
function extractMessageText(message: any): string {
    const msg = message.message

    if (!msg) return ''

    // Mensagem de texto simples
    if (msg.conversation) {
        return msg.conversation
    }

    // Mensagem de texto estendida
    if (msg.extendedTextMessage?.text) {
        return msg.extendedTextMessage.text
    }

    // Mensagem com imagem (caption)
    if (msg.imageMessage?.caption) {
        return `[Imagem] ${msg.imageMessage.caption}`
    }

    // Mensagem com vídeo (caption)
    if (msg.videoMessage?.caption) {
        return `[Vídeo] ${msg.videoMessage.caption}`
    }

    // Mensagem com documento
    if (msg.documentMessage?.fileName) {
        return `[Documento] ${msg.documentMessage.fileName}`
    }

    // Mensagem com áudio
    if (msg.audioMessage) {
        return '[Áudio]'
    }

    return '[Mensagem não suportada]'
}
