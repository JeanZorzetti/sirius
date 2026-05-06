'use server'

import logger from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { dispatchWebhookAsync } from '@/lib/webhooks/dispatcher'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'
import { canCreateContact } from '@/lib/plan-limits'

async function getAuthenticatedUser() {
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
        return null
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { organization: true }
    })

    if (!user || !user.organizationId) {
        return null
    }

    return user
}

export async function createContact(formData: FormData) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const company = formData.get('company') as string
        const city = formData.get('city') as string
        const state = formData.get('state') as string
        const zipCode = formData.get('zipCode') as string
        const street = formData.get('street') as string
        const streetNumber = formData.get('streetNumber') as string
        const complement = formData.get('complement') as string

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: {
                name,
                email: email || null,
                phone: phone || null,
                company: company || null,
                city: city || null,
                state: state ? state.toUpperCase().slice(0, 2) : null,
                zipCode: zipCode || null,
                street: street || null,
                streetNumber: streetNumber || null,
                complement: complement || null,
                organizationId: user.organizationId
            } as any
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

export async function updateContact(contactId: string, formData: FormData) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const company = formData.get('company') as string
        const city = formData.get('city') as string
        const state = formData.get('state') as string
        const zipCode = formData.get('zipCode') as string
        const street = formData.get('street') as string
        const streetNumber = formData.get('streetNumber') as string
        const complement = formData.get('complement') as string

        if (!name?.trim()) {
            return { success: false, error: 'Nome é obrigatório' }
        }

        // Verify the contact belongs to the user's organization
        const existing = await prisma.contact.findUnique({
            where: { id: contactId },
            select: { id: true, organizationId: true, email: true }
        })

        if (!existing) {
            return { success: false, error: 'Contato não encontrado.' }
        }

        if (existing.organizationId !== user.organizationId) {
            return { success: false, error: 'Sem permissão para editar este contato.' }
        }

        // Check email uniqueness (only if email changed)
        const newEmail = email?.trim() || null
        if (newEmail && newEmail !== existing.email) {
            const emailConflict = await prisma.contact.findFirst({
                where: {
                    organizationId: user.organizationId,
                    email: newEmail,
                    id: { not: contactId }
                }
            })
            if (emailConflict) {
                return { success: false, error: 'Já existe um contato com este email.' }
            }
        }

        const contact = await prisma.contact.update({
            where: { id: contactId },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: {
                name: name.trim(),
                email: newEmail,
                phone: phone?.trim() || null,
                company: company?.trim() || null,
                city: city?.trim() || null,
                state: state?.trim() ? state.trim().toUpperCase().slice(0, 2) : null,
                zipCode: zipCode?.trim() || null,
                street: street?.trim() || null,
                streetNumber: streetNumber?.trim() || null,
                complement: complement?.trim() || null,
            } as any
        })

        dispatchWebhookAsync(user.organizationId, WEBHOOK_EVENTS.CONTACT_UPDATED, {
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

        return { success: true }
    } catch (error: any) {
        console.error('[UPDATE_CONTACT] Error:', error?.message, error?.stack)
        logger.error({ err: error }, 'Failed to update contact')
        return { success: false, error: `Falha ao atualizar contato: ${error?.message || 'Erro desconhecido'}` }
    }
}

export async function bulkDeleteContacts(contactIds: string[]) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        if (!contactIds.length) return { success: false, error: 'Nenhum contato selecionado.' }

        // Verify all contacts belong to this org
        const contacts = await prisma.contact.findMany({
            where: { id: { in: contactIds }, organizationId: user.organizationId },
            select: { id: true, name: true }
        })

        if (contacts.length !== contactIds.length) {
            return { success: false, error: 'Alguns contatos não foram encontrados.' }
        }

        // Check for linked deals
        const dealsCount = await prisma.deal.count({
            where: { contactId: { in: contactIds } }
        })

        if (dealsCount > 0) {
            return { success: false, error: `${dealsCount} contato(s) possuem negócios vinculados. Remova os negócios antes de excluir.` }
        }

        await prisma.contact.deleteMany({
            where: { id: { in: contactIds }, organizationId: user.organizationId }
        })

        revalidatePath('/dashboard/contacts')
        revalidatePath('/dashboard')

        return { success: true, deleted: contacts.length }
    } catch (error: any) {
        console.error('[BULK_DELETE_CONTACTS] Error:', error?.message)
        return { success: false, error: `Falha ao excluir contatos: ${error?.message || 'Erro desconhecido'}` }
    }
}

export async function deleteContact(contactId: string) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify the contact belongs to the user's organization
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
            select: { id: true, organizationId: true, name: true }
        })

        if (!contact) {
            return { success: false, error: 'Contato não encontrado.' }
        }

        if (contact.organizationId !== user.organizationId) {
            return { success: false, error: 'Sem permissão para excluir este contato.' }
        }

        // Check if contact has deals linked
        const dealCount = await prisma.deal.count({
            where: { contactId }
        })

        if (dealCount > 0) {
            return {
                success: false,
                error: `Este contato possui ${dealCount} negócio(s) vinculado(s). Remova os negócios antes de excluir.`
            }
        }

        await prisma.contact.delete({
            where: { id: contactId }
        })

        // Dispatch webhook (async, non-blocking)
        dispatchWebhookAsync(user.organizationId, WEBHOOK_EVENTS.CONTACT_DELETED, {
            contact: {
                id: contact.id,
                name: contact.name,
            }
        })

        revalidatePath('/dashboard/contacts')
        revalidatePath('/dashboard')

        return { success: true }
    } catch (error: any) {
        console.error('[DELETE_CONTACT] Error:', error?.message, error?.stack)
        logger.error({ err: error }, 'Failed to delete contact')
        return { success: false, error: `Falha ao excluir contato: ${error?.message || 'Erro desconhecido'}` }
    }
}
