import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { parseWhatsAppJid } from '@/lib/integrations/evolution-client'

/**
 * Webhook receiver para Evolution API
 *
 * Recebe eventos:
 * - messages.upsert: Novas mensagens recebidas
 * - messages.update: Atualização de status de mensagens (entregue, lido)
 */
export async function POST(request: Request) {
    try {
        const payload = await request.json()
        const { event, data, instance } = payload

        logger.info({ event, instance }, 'Evolution webhook received')

        // Encontrar organização pela instância
        const org = await prisma.organization.findFirst({
            where: {
                evolutionInstance: instance,
                evolutionEnabled: true
            }
        })

        if (!org) {
            logger.warn({ instance }, 'Organization not found for Evolution instance')
            return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
        }

        // Processar diferentes tipos de eventos
        switch (event) {
            case 'messages.upsert':
                await handleIncomingMessage(org.id, data)
                break

            case 'messages.update':
                await handleMessageStatusUpdate(org.id, data)
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
 * Processa mensagem recebida
 * - Cria/atualiza contato
 * - Salva mensagem no banco
 * - Cria deal automaticamente se configurado
 */
async function handleIncomingMessage(organizationId: string, data: any) {
    try {
        const messages = data.messages || []

        for (const message of messages) {
            // Ignorar mensagens enviadas por nós
            if (message.key.fromMe) {
                continue
            }

            const remoteJid = message.key.remoteJid
            const messageId = message.key.id
            const messageText = extractMessageText(message)
            const phoneNumber = parseWhatsAppJid(remoteJid)
            const senderName = message.pushName || 'Desconhecido'

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
                        phone: phoneNumber
                    }
                })

                logger.info({ contactId: contact.id, phone: phoneNumber }, 'Created new contact from WhatsApp')
            }

            // Salvar mensagem no banco
            await prisma.whatsAppMessage.create({
                data: {
                    organizationId,
                    contactId: contact.id,
                    remoteJid,
                    messageId,
                    text: messageText,
                    direction: 'INBOUND',
                    status: 'DELIVERED',
                    sentAt: new Date(message.messageTimestamp * 1000)
                }
            })

            // Auto-criar deal se não houver deal ativo para este contato
            const existingDeal = await prisma.deal.findFirst({
                where: {
                    organizationId,
                    contactId: contact.id
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })

            // Criar novo deal apenas se não houver nenhum ou se o último está fechado
            if (!existingDeal) {
                await createDealFromWhatsApp(organizationId, contact.id, senderName, messageText)
            }
        }
    } catch (error: any) {
        logger.error({ error, organizationId }, 'Error handling incoming WhatsApp message')
    }
}

/**
 * Atualiza status de mensagem (entregue, lido)
 */
async function handleMessageStatusUpdate(organizationId: string, data: any) {
    try {
        const updates = data || []

        for (const update of updates) {
            const messageId = update.key?.id
            if (!messageId) continue

            const status = update.update?.status

            if (status === 'DELIVERY_ACK' || status === 'DELIVERED') {
                // Mensagem entregue
                await prisma.whatsAppMessage.updateMany({
                    where: {
                        organizationId,
                        messageId,
                        direction: 'OUTBOUND'
                    },
                    data: {
                        status: 'DELIVERED',
                        deliveredAt: new Date()
                    }
                })
            } else if (status === 'READ') {
                // Mensagem lida
                await prisma.whatsAppMessage.updateMany({
                    where: {
                        organizationId,
                        messageId,
                        direction: 'OUTBOUND'
                    },
                    data: {
                        status: 'READ',
                        readAt: new Date()
                    }
                })
            }
        }
    } catch (error: any) {
        logger.error({ error, organizationId }, 'Error handling message status update')
    }
}

/**
 * Cria deal automaticamente a partir de mensagem do WhatsApp
 */
async function createDealFromWhatsApp(
    organizationId: string,
    contactId: string,
    contactName: string,
    messageText: string
) {
    try {
        // Buscar pipeline padrão
        const defaultPipeline = await prisma.pipeline.findFirst({
            where: {
                organizationId,
                isDefault: true
            },
            include: {
                stages: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        })

        if (!defaultPipeline || defaultPipeline.stages.length === 0) {
            logger.warn({ organizationId }, 'No default pipeline found for WhatsApp auto-deal creation')
            return
        }

        const firstStage = defaultPipeline.stages[0]

        // Buscar primeiro usuário da organização como responsável
        const owner = await prisma.user.findFirst({
            where: { organizationId }
        })

        if (!owner) {
            logger.warn({ organizationId }, 'No user found for WhatsApp auto-deal creation')
            return
        }

        // Criar deal
        const deal = await prisma.deal.create({
            data: {
                title: `WhatsApp: ${contactName}`,
                organizationId,
                pipelineId: defaultPipeline.id,
                stageId: firstStage.id,
                contactId,
                userId: owner.id
            }
        })

        logger.info({
            dealId: deal.id,
            contactId,
            organizationId
        }, 'Auto-created deal from WhatsApp message')

        // Criar nota com a mensagem recebida
        await prisma.note.create({
            data: {
                dealId: deal.id,
                userId: owner.id,
                content: `Mensagem recebida via WhatsApp:\n\n${messageText}`
            }
        })

    } catch (error: any) {
        logger.error({ error, organizationId, contactId }, 'Error creating deal from WhatsApp')
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
