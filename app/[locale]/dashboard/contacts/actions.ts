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
        const status = formData.get('status') as string

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
                status: (status && status !== 'none') ? status : null,
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
        const status = formData.get('status') as string
        const assignedToId = formData.get('assignedToId') as string

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
                status: (status?.trim() && status !== 'none') ? status.trim() : null,
                assignedToId: (assignedToId && assignedToId !== 'none') ? assignedToId : null,
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

export async function addContactClosing(contactId: string, data: {
    dealId: string | null
    date: string
    value: number
    note: string | null
}) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        // Resolve which deal to attach closing to
        let targetDealId = data.dealId

        if (!targetDealId) {
            // Use first active deal linked to contact
            const activeDeal = await prisma.deal.findFirst({
                where: { contactId, organizationId: user.organizationId, status: 'ACTIVE', archived: false },
                orderBy: { createdAt: 'desc' },
                select: { id: true },
            })
            if (activeDeal) {
                targetDealId = activeDeal.id
            } else {
                // No active deal — create a placeholder deal to hold the closing
                const firstStage = await prisma.pipelineStage.findFirst({
                    where: { organizationId: user.organizationId },
                    orderBy: { order: 'asc' },
                    select: { id: true, pipelineId: true },
                })
                if (!firstStage) return { success: false, error: 'Nenhuma etapa encontrada no pipeline.' }

                const newDeal = await (prisma.deal.create as any)({
                    data: {
                        title: data.note?.trim() || 'Fechamento registrado',
                        value: data.value,
                        status: 'WON',
                        wonAt: new Date(data.date),
                        contactId,
                        organizationId: user.organizationId,
                        stageId: firstStage.id,
                        pipelineId: firstStage.pipelineId,
                        userId: user.id,
                    },
                    select: { id: true },
                })
                targetDealId = newDeal.id
            }
        }

        // Verify deal belongs to org
        const deal = await prisma.deal.findUnique({
            where: { id: targetDealId },
            select: { id: true, title: true, organizationId: true },
        })
        if (!deal || deal.organizationId !== user.organizationId) {
            return { success: false, error: 'Deal não encontrado.' }
        }

        const closing = await prisma.dealClosing.create({
            data: {
                dealId: targetDealId,
                date: new Date(data.date),
                value: data.value,
                note: data.note || null,
                userId: user.id,
            },
        })

        await prisma.activity.create({
            data: {
                type: 'CLOSING_ADDED',
                description: `Registrou fechamento de R$ ${data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${data.note ? ` — ${data.note}` : ''}`,
                dealId: targetDealId,
                userId: user.id,
            },
        })

        revalidatePath('/dashboard/contacts')
        revalidatePath('/dashboard')

        return {
            success: true,
            closing: {
                id: closing.id,
                dealId: targetDealId,
                dealTitle: deal.title,
                date: closing.date.toISOString(),
                value: Number(closing.value),
                note: closing.note ?? null,
                userName: null,
            },
        }
    } catch (error: any) {
        console.error('[ADD_CONTACT_CLOSING]', error?.message)
        return { success: false, error: error?.message || 'Erro ao registrar fechamento' }
    }
}

export async function removeContactClosing(closingId: string) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        const closing = await prisma.dealClosing.findUnique({
            where: { id: closingId },
            include: { deal: { select: { organizationId: true, id: true } } },
        })
        if (!closing || closing.deal.organizationId !== user.organizationId) {
            return { success: false, error: 'Fechamento não encontrado.' }
        }

        await prisma.dealClosing.delete({ where: { id: closingId } })

        revalidatePath('/dashboard/contacts')
        revalidatePath('/dashboard')

        return { success: true }
    } catch (error: any) {
        console.error('[REMOVE_CONTACT_CLOSING]', error?.message)
        return { success: false, error: error?.message || 'Erro ao remover fechamento' }
    }
}

export async function addWonDeal(contactId: string, data: {
    title: string
    value: number | null
    productName: string | null
    wonAt: string
}) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        // Verify contact belongs to org
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
            select: { organizationId: true },
        })
        if (!contact || contact.organizationId !== user.organizationId) {
            return { success: false, error: 'Contato não encontrado.' }
        }

        // Get first pipeline stage as default
        const firstStage = await prisma.pipelineStage.findFirst({
            where: { organizationId: user.organizationId },
            orderBy: { order: 'asc' },
            select: { id: true, pipelineId: true },
        })
        if (!firstStage) return { success: false, error: 'Nenhuma etapa encontrada no pipeline.' }

        // Find or create product if provided
        let productId: string | null = null
        if (data.productName?.trim()) {
            const existing = await prisma.product.findFirst({
                where: { organizationId: user.organizationId, name: data.productName.trim() },
                select: { id: true },
            })
            if (existing) {
                productId = existing.id
            } else {
                const created = await (prisma.product.create as any)({
                    data: { name: data.productName.trim(), organizationId: user.organizationId },
                    select: { id: true },
                })
                productId = created.id
            }
        }

        const created = await (prisma.deal.create as any)({
            data: {
                title: data.title.trim(),
                value: data.value ?? null,
                status: 'WON',
                wonAt: new Date(data.wonAt),
                contactId,
                organizationId: user.organizationId,
                stageId: firstStage.id,
                pipelineId: firstStage.pipelineId,
                userId: user.id,
                ...(productId ? { productId } : {}),
            },
            include: {
                product: { select: { name: true } },
            },
        })

        revalidatePath('/dashboard/contacts')
        return {
            success: true,
            deal: {
                id: created.id,
                title: created.title,
                value: created.value ? Number(created.value) : null,
                wonAt: created.wonAt ?? null,
                productName: created.product?.name ?? (data.productName ?? null),
                representativeName: null,
            },
        }
    } catch (error: any) {
        console.error('[ADD_WON_DEAL]', error?.message)
        return { success: false, error: error?.message || 'Erro ao registrar venda' }
    }
}

export async function removeWonDeal(dealId: string) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        const deal = await prisma.deal.findUnique({
            where: { id: dealId },
            select: { organizationId: true, status: true },
        })
        if (!deal || deal.organizationId !== user.organizationId) {
            return { success: false, error: 'Negócio não encontrado.' }
        }
        if (deal.status !== 'WON') {
            return { success: false, error: 'Apenas vendas ganhas podem ser removidas do histórico aqui.' }
        }

        await prisma.deal.delete({ where: { id: dealId } })
        revalidatePath('/dashboard/contacts')
        return { success: true }
    } catch (error: any) {
        console.error('[REMOVE_WON_DEAL]', error?.message)
        return { success: false, error: error?.message || 'Erro ao remover venda' }
    }
}
