/**
 * WhatsApp Automations Library
 *
 * Funções para enviar mensagens automatizadas do WhatsApp via Whatsmeow Gateway:
 * - Mudança de stage
 * - Deal criado
 * - Deal ganho/perdido
 * - Lembretes de follow-up
 */

import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { normalizePhoneNumber } from '@/lib/whatsapp-sync'
import logger from '@/lib/logger'

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

        // Obter conexão ativa da organização
        const connection = await prismaWa.whatsAppConnection.findFirst({
            where: { organizationId, status: 'CONNECTED' }
        })

        if (!connection) {
            return {
                success: false,
                error: 'WhatsApp não conectado para esta organização'
            }
        }

        // O envio via gateway QR (whatsmeow) foi descontinuado. Automação de
        // WhatsApp voltará quando o caminho WABA for implementado aqui.
        void connection
        return {
            success: false,
            error: 'Envio automático via conexão QR foi descontinuado. Use a API Oficial Meta (WABA).'
        }

    } catch (error) {
        logger.error({ error, organizationId, dealId }, 'Error sending WhatsApp message')

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao enviar mensagem'
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
    const messages = await prismaWa.whatsAppMessage.findMany({
        where: { dealId },
        orderBy: { sentAt: 'asc' },
    })

    // Enrich with contact data from CRM DB
    const contactIds = [...new Set(messages.map(m => m.contactId).filter(Boolean))] as string[]
    const contacts = contactIds.length > 0
        ? await prisma.contact.findMany({
              where: { id: { in: contactIds } },
              select: { id: true, name: true, phone: true },
          })
        : []
    const contactMap = new Map(contacts.map(c => [c.id, c]))

    return messages.map(m => ({
        ...m,
        contact: m.contactId ? contactMap.get(m.contactId) || null : null,
    }))
}

/**
 * Busca últimas mensagens WhatsApp de uma organização
 */
export async function getOrganizationWhatsAppMessages(organizationId: string, limit: number = 50) {
    const messages = await prismaWa.whatsAppMessage.findMany({
        where: { organizationId },
        orderBy: { sentAt: 'desc' },
        take: limit,
    })

    // Enrich with contact and deal data from CRM DB
    const contactIds = [...new Set(messages.map(m => m.contactId).filter(Boolean))] as string[]
    const dealIds = [...new Set(messages.map(m => m.dealId).filter(Boolean))] as string[]

    const [contacts, deals] = await Promise.all([
        contactIds.length > 0
            ? prisma.contact.findMany({
                  where: { id: { in: contactIds } },
                  select: { id: true, name: true, phone: true },
              })
            : [],
        dealIds.length > 0
            ? prisma.deal.findMany({
                  where: { id: { in: dealIds } },
                  select: { id: true, title: true },
              })
            : [],
    ])

    const contactMap = new Map(contacts.map(c => [c.id, c]))
    const dealMap = new Map(deals.map(d => [d.id, d]))

    return messages.map(m => ({
        ...m,
        contact: m.contactId ? contactMap.get(m.contactId) || null : null,
        deal: m.dealId ? dealMap.get(m.dealId) || null : null,
    }))
}
