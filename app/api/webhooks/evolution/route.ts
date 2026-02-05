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

        logger.info({ event, instance }, 'Evolution webhook received')

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

        // Processar diferentes tipos de eventos
        switch (event) {
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
                logger.debug({ event }, 'Unhandled Evolution webhook event')
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

    logger.info({ instanceName: connection.instanceName, state }, 'Connection state updated')

    let status = 'DISCONNECTED'
    if (state === 'open') {
        status = 'CONNECTED'
    } else if (state === 'connecting') {
        status = 'CONNECTING'
    }

    await prisma.whatsAppConnection.update({
        where: { id: connection.id },
        data: {
            status,
            phoneNumber: data.statusReason?.phoneNumber || null,
            connectedAt: status === 'CONNECTED' ? new Date() : null,
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
        const messages = data.messages || []
        const organizationId = connection.organizationId

        for (const message of messages) {
            // Ignorar mensagens enviadas por nós
            if (message.key.fromMe) {
                continue
            }

            const remoteJid = message.key.remoteJid
            const messageId = message.key.id
            const messageText = extractMessageText(message)
            const phoneNumber = remoteJid.replace('@s.whatsapp.net', '')
            const senderName = message.pushName || phoneNumber

            logger.info({
                organizationId,
                remoteJid,
                messageId,
                senderName
            }, 'Processing incoming WhatsApp message')

            // Buscar ou criar contato
            let contact = await prisma.contact.findFirst({
                where: {
                    organizationId,
                    phone: phoneNumber
                }
            })

            if (!contact) {
                contact = await prisma.contact.create({
                    data: {
                        organizationId,
                        name: senderName,
                        phone: phoneNumber,
                        whatsappPhone: phoneNumber,
                        source: 'WHATSAPP',
                        stage: 'LEAD',
                    }
                })

                logger.info({ contactId: contact.id, phone: phoneNumber }, 'Created new contact from WhatsApp')
            }

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
                    sentAt: new Date(message.messageTimestamp * 1000),
                }
            })

            logger.info({
                contactId: contact.id,
                messageId,
            }, 'WhatsApp message saved')
        }
    } catch (error: any) {
        logger.error({ error, organizationId: connection.organizationId }, 'Error handling incoming WhatsApp message')
    }
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
