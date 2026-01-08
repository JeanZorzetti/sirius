/**
 * WhatsApp Automations Library
 *
 * Funções para enviar mensagens automatizadas do WhatsApp:
 * - Mudança de stage
 * - Deal criado
 * - Deal ganho/perdido
 * - Lembretes de follow-up
 */

import { prisma } from '@/lib/prisma'
import {
    getEvolutionClient,
    formatWhatsAppNumber,
    logWhatsAppActivity,
    checkWhatsAppRateLimit
} from './evolution-client'
import { logger } from '@/lib/logger'

interface SendWhatsAppMessageParams {
    organizationId: string
    dealId: string
    message: string
}

/**
 * Envia mensagem manual do WhatsApp para o contato de um deal
 */
export async function sendWhatsAppMessage(params: SendWhatsAppMessageParams): Promise<{
    success: boolean
    error?: string
}> {
    const { organizationId, dealId, message } = params

    try {
        // Verificar rate limit
        const rateLimit = await checkWhatsAppRateLimit(organizationId)
        if (!rateLimit) {
            return {
                success: false,
                error: 'Limite de mensagens excedido. Tente novamente mais tarde.'
            }
        }

        // Buscar deal com contato
        const deal = await prisma.deal.findUnique({
            where: { id: dealId },
            include: { contact: true }
        })

        if (!deal || !deal.contact || !deal.contact.phone) {
            return {
                success: false,
                error: 'Deal ou contato sem telefone não encontrado'
            }
        }

        // Obter cliente Evolution
        const client = await getEvolutionClient(organizationId)
        if (!client) {
            return {
                success: false,
                error: 'WhatsApp não configurado para esta organização'
            }
        }

        // Formatar número WhatsApp
        const remoteJid = formatWhatsAppNumber(deal.contact.phone)

        // Enviar mensagem
        const response = await client.sendTextMessage(remoteJid, message)

        // Salvar mensagem no banco
        await prisma.whatsAppMessage.create({
            data: {
                organizationId,
                dealId,
                contactId: deal.contactId!,
                remoteJid,
                messageId: response.key.id,
                text: message,
                direction: 'OUTBOUND',
                status: 'SENT'
            }
        })

        // Log da atividade
        await logWhatsAppActivity(
            organizationId,
            'send_message',
            'SUCCESS',
            { dealId, message },
            { messageId: response.key.id }
        )

        logger.info({
            organizationId,
            dealId,
            messageId: response.key.id
        }, 'WhatsApp message sent successfully')

        return { success: true }

    } catch (error: any) {
        logger.error({ error, organizationId, dealId }, 'Error sending WhatsApp message')

        await logWhatsAppActivity(
            organizationId,
            'send_message',
            'FAILED',
            { dealId, message },
            null,
            error.message
        )

        return {
            success: false,
            error: error.message || 'Erro ao enviar mensagem'
        }
    }
}

/**
 * Envia mensagem automática quando o stage do deal muda
 */
export async function sendStageChangeMessage(
    organizationId: string,
    dealId: string,
    oldStageName: string,
    newStageName: string
): Promise<void> {
    try {
        const message = `Olá! Seu processo foi atualizado de "${oldStageName}" para "${newStageName}". Estamos trabalhando para te atender da melhor forma! 🚀`

        const result = await sendWhatsAppMessage({
            organizationId,
            dealId,
            message
        })

        if (result.success) {
            logger.info({
                organizationId,
                dealId,
                oldStageName,
                newStageName
            }, 'Stage change WhatsApp message sent')
        }
    } catch (error: any) {
        logger.error({
            error,
            organizationId,
            dealId
        }, 'Error sending stage change WhatsApp message')
    }
}

/**
 * Envia mensagem de boas-vindas quando um deal é criado
 */
export async function sendWelcomeMessage(
    organizationId: string,
    dealId: string,
    contactName: string
): Promise<void> {
    try {
        const message = `Olá ${contactName}! 👋\n\nSeja bem-vindo(a)! Recebemos seu contato e em breve retornaremos.\n\nObrigado pela preferência!`

        const result = await sendWhatsAppMessage({
            organizationId,
            dealId,
            message
        })

        if (result.success) {
            logger.info({
                organizationId,
                dealId,
                contactName
            }, 'Welcome WhatsApp message sent')
        }
    } catch (error: any) {
        logger.error({
            error,
            organizationId,
            dealId
        }, 'Error sending welcome WhatsApp message')
    }
}

/**
 * Envia mensagem de parabéns quando um deal é ganho
 */
export async function sendDealWonMessage(
    organizationId: string,
    dealId: string,
    contactName: string
): Promise<void> {
    try {
        const message = `Parabéns ${contactName}! 🎉\n\nFicamos muito felizes em fechar este negócio com você!\n\nEm breve entraremos em contato com os próximos passos.\n\nObrigado pela confiança!`

        const result = await sendWhatsAppMessage({
            organizationId,
            dealId,
            message
        })

        if (result.success) {
            logger.info({
                organizationId,
                dealId,
                contactName
            }, 'Deal won WhatsApp message sent')
        }
    } catch (error: any) {
        logger.error({
            error,
            organizationId,
            dealId
        }, 'Error sending deal won WhatsApp message')
    }
}

/**
 * Envia lembrete de follow-up
 */
export async function sendFollowUpReminder(
    organizationId: string,
    dealId: string,
    contactName: string
): Promise<void> {
    try {
        const message = `Olá ${contactName}! 👋\n\nPassando aqui para ver se você tem alguma dúvida ou se posso ajudar com algo.\n\nEstou à disposição!`

        const result = await sendWhatsAppMessage({
            organizationId,
            dealId,
            message
        })

        if (result.success) {
            logger.info({
                organizationId,
                dealId,
                contactName
            }, 'Follow-up reminder WhatsApp message sent')
        }
    } catch (error: any) {
        logger.error({
            error,
            organizationId,
            dealId
        }, 'Error sending follow-up reminder WhatsApp message')
    }
}

/**
 * Busca histórico de mensagens WhatsApp de um deal
 */
export async function getDealWhatsAppMessages(dealId: string) {
    return prisma.whatsAppMessage.findMany({
        where: { dealId },
        orderBy: { sentAt: 'asc' },
        include: {
            contact: {
                select: {
                    name: true,
                    phone: true
                }
            }
        }
    })
}

/**
 * Busca últimas mensagens WhatsApp de uma organização
 */
export async function getOrganizationWhatsAppMessages(organizationId: string, limit: number = 50) {
    return prisma.whatsAppMessage.findMany({
        where: { organizationId },
        orderBy: { sentAt: 'desc' },
        take: limit,
        include: {
            contact: {
                select: {
                    name: true,
                    phone: true
                }
            },
            deal: {
                select: {
                    title: true
                }
            }
        }
    })
}
