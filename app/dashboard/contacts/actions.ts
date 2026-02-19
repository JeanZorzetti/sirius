'use server'

import logger from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { dispatchWebhookAsync } from '@/lib/webhooks/dispatcher'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'
import { canCreateContact } from '@/lib/plan-limits'

export async function createContact(formData: FormData) {
    try {
        const session = await getSession()
        if (!session || !session.user || !session.user.email) {
            return { success: false, error: 'Unauthorized' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'Usuário não pertence a uma organização.' }
        }

        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const company = formData.get('company') as string

        if (!name) {
            return { success: false, error: 'Nome é obrigatório' }
        }

        // Check plan limits before creating
        const limitCheck = await canCreateContact(user.organizationId)
        if (!limitCheck.allowed) {
            return {
                success: false,
                error: limitCheck.reason,
                code: 'PLAN_LIMIT_REACHED',
                current: limitCheck.current,
                limit: limitCheck.limit,
            }
        }

        const contact = await prisma.contact.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                company: company || null,
                organizationId: user.organizationId
            }
        })

        // Dispatch webhook (async, non-blocking)
        dispatchWebhookAsync(user.organizationId, WEBHOOK_EVENTS.CONTACT_CREATED, {
            contact: {
                id: contact.id,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                company: contact.company
            }
        })

        revalidatePath('/dashboard/contacts')
        revalidatePath('/dashboard')

        // Return the created contact for immediate use
        return {
            success: true,
            contact: {
                id: contact.id,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                company: contact.company,
                createdAt: contact.createdAt.toISOString(),
                updatedAt: contact.updatedAt.toISOString()
            }
        }
    } catch (error: any) {
        console.error('[CREATE_CONTACT] Error:', error?.message, error?.stack)
        logger.error({ err: error }, 'Failed to create contact')
        return { success: false, error: `Failed to create contact: ${error?.message || 'Unknown error'}` }
    }
}
