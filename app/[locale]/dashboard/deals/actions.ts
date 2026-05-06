'use server'

import logger from '@/lib/logger'
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { dispatchWebhookAsync } from "@/lib/webhooks/dispatcher"
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events"
import { executeDealAutomations } from "@/lib/automations/engine"

async function checkPermission() {
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
        throw new Error("Unauthorized")
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    })

    if (!user) throw new Error("Unauthorized")
    return user
}

export async function getDealDetails(dealId: string) {
    const user = await checkPermission()

    // Validate dealId format
    if (!dealId || typeof dealId !== 'string' || dealId.trim() === '') {
        logger.error({ err: dealId }, 'Invalid dealId provided')
        throw new Error("Deal not found")
    }

    const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: {
            stage: true,
            contact: true,
            user: true, // owner
            notes: {
                include: { user: true },
                orderBy: { createdAt: 'desc' }
            },
            activities: {
                include: { user: true },
                orderBy: { createdAt: 'desc' }
            },
            tags: true
        }
    })

    if (!deal) {
        logger.error({ dealId, userId: user.id, userOrg: user.organizationId }, 'Deal not found in database')
        throw new Error("Deal not found")
    }

    if (deal.organizationId !== user.organizationId) {
        logger.error({ dealId, userId: user.id, userOrg: user.organizationId, dealOrg: deal.organizationId }, 'Deal organization mismatch')
        throw new Error("Deal not found")
    }

    // All org members can view deal details — the kanban shows all org deals regardless of userId.

    // Force serialization to simple types to prevent Next.js boundaries errors
    return {
        ...deal,
        value: deal.value ? Number(deal.value) : null,
        closeDate: deal.closeDate ? deal.closeDate.toISOString() : null,
        dueDate: deal.dueDate ? deal.dueDate.toISOString() : null,
        dueDateNote: deal.dueDateNote ?? null,
        createdAt: deal.createdAt.toISOString(),
        updatedAt: deal.updatedAt.toISOString(),
        stage: { ...deal.stage, createdAt: deal.stage.createdAt.toISOString(), updatedAt: deal.stage.updatedAt.toISOString() },
        contact: deal.contact ? { ...deal.contact, createdAt: deal.contact.createdAt.toISOString(), updatedAt: deal.contact.updatedAt.toISOString() } : null,
        notes: deal.notes.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })),
        activities: deal.activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() }))
    }
}

export async function addNote(dealId: string, content: string) {
    const user = await checkPermission()

    if (!content) throw new Error("Content is empty")

    const note = await prisma.note.create({
        data: {
            content,
            dealId,
            userId: user.id
        }
    })

    // Log Activity
    await prisma.activity.create({
        data: {
            type: "NOTE_ADDED",
            description: "Adicionou uma observação",
            dealId,
            userId: user.id
        }
    })

    // Dispatch webhook (async, non-blocking)
    if (user.organizationId) {
        dispatchWebhookAsync(user.organizationId, WEBHOOK_EVENTS.DEAL_NOTE_ADDED, {
            note: {
                id: note.id,
                content: note.content,
                dealId: note.dealId
            },
            user: {
                id: user.id,
                name: user.name
            }
        })
    }

    revalidatePath("/dashboard")
    return note
}

export async function updateDealStage(dealId: string, stageId: string) {
    const user = await checkPermission()

    const deal = await prisma.deal.findUnique({ where: { id: dealId }, include: { stage: true } })
    if (!deal) throw new Error("Deal not found")

    const oldStageName = deal.stage.name

    const newStage = await prisma.pipelineStage.findUnique({ where: { id: stageId } })
    if (!newStage) throw new Error("Stage not found")

    await prisma.deal.update({
        where: { id: dealId },
        data: { stageId }
    })

    await prisma.activity.create({
        data: {
            type: "STAGE_CHANGE",
            description: `Moveu de "${oldStageName}" para "${newStage.name}"`,
            dealId,
            userId: user.id
        }
    })

    // Fire-and-forget automation triggers
    const automationContext = {
        organizationId: deal.organizationId,
        value: deal.value ? Number(deal.value) : 0,
        stageId: stageId,
        pipelineId: deal.pipelineId,
        title: deal.title,
        userId: deal.userId
    }

    executeDealAutomations(dealId, 'DEAL_MOVED', automationContext).catch(() => {})

    const newStageName = newStage.name.toLowerCase()
    if (newStageName.includes('ganho') || newStageName.includes('won') || newStageName.includes('fechado')) {
        executeDealAutomations(dealId, 'DEAL_WON', automationContext).catch(() => {})
    }
    if (newStageName.includes('perdido') || newStageName.includes('lost') || newStageName.includes('cancelado')) {
        executeDealAutomations(dealId, 'DEAL_LOST', automationContext).catch(() => {})
    }

    revalidatePath("/dashboard")
}

export async function updateDealValue(dealId: string, value: number) {
    const user = await checkPermission()

    const deal = await prisma.deal.findUnique({ where: { id: dealId } })
    if (!deal) throw new Error("Deal not found")

    await prisma.deal.update({
        where: { id: dealId },
        data: { value }
    })

    await prisma.activity.create({
        data: {
            type: "VALUE_CHANGE",
            description: `Alterou valor para R$ ${value}`,
            dealId,
            userId: user.id
        }
    })

    revalidatePath("/dashboard")
}

export async function deleteNote(noteId: string) {
    const user = await checkPermission()

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) throw new Error("Note not found")

    if (note.userId !== user.id) {
        throw new Error("Unauthorized: Can only delete own notes")
    }

    await prisma.note.delete({ where: { id: noteId } })
    revalidatePath("/dashboard")
    return { success: true }
}

export async function addDealClosing(dealId: string, date: string, value: number, note?: string) {
    const user = await checkPermission()

    const deal = await prisma.deal.findUnique({ where: { id: dealId } })
    if (!deal) throw new Error("Deal not found")
    if (deal.organizationId !== user.organizationId) throw new Error("Unauthorized")

    const closing = await prisma.dealClosing.create({
        data: { dealId, date: new Date(date), value, note: note || null, userId: user.id }
    })

    const valueStr = `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    const noteStr = note ? ` — ${note}` : ''
    await prisma.activity.create({
        data: {
            type: "CLOSING_ADDED",
            description: `Registrou fechamento de ${valueStr}${noteStr}`,
            dealId,
            userId: user.id
        }
    })

    revalidatePath("/dashboard")
    return { ...closing, value: Number(closing.value), date: closing.date.toISOString(), createdAt: closing.createdAt.toISOString() }
}

export async function deleteDealClosing(closingId: string) {
    const user = await checkPermission()

    const closing = await prisma.dealClosing.findUnique({
        where: { id: closingId },
        include: { deal: true }
    })
    if (!closing) throw new Error("Closing not found")
    if (closing.deal.organizationId !== user.organizationId) throw new Error("Unauthorized")

    await prisma.dealClosing.delete({ where: { id: closingId } })

    const valueStr = `R$ ${Number(closing.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    await prisma.activity.create({
        data: {
            type: "CLOSING_REMOVED",
            description: `Removeu fechamento de ${valueStr}`,
            dealId: closing.dealId,
            userId: user.id
        }
    })

    revalidatePath("/dashboard")
    return { success: true }
}

export async function getDealClosings(dealId: string) {
    const user = await checkPermission()

    const deal = await prisma.deal.findUnique({ where: { id: dealId } })
    if (!deal || deal.organizationId !== user.organizationId) throw new Error("Unauthorized")

    const closings = await prisma.dealClosing.findMany({
        where: { dealId },
        orderBy: { date: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } }
    })

    return closings.map(c => ({
        ...c,
        value: Number(c.value),
        date: c.date.toISOString(),
        createdAt: c.createdAt.toISOString(),
        userName: c.user?.name ?? c.user?.email ?? null,
    }))
}

export async function reorderDeals(stageId: string, dealOrders: { id: string, order: number }[]) {
    const user = await checkPermission()

    // Verify that the stage belongs to the user's organization
    const stage = await prisma.pipelineStage.findUnique({
        where: { id: stageId }
    })

    if (!stage || stage.organizationId !== user.organizationId) {
        throw new Error("Unauthorized")
    }

    // Update each deal's order
    await prisma.$transaction(
        dealOrders.map(({ id, order }) =>
            prisma.deal.update({
                where: { id },
                data: { order }
            })
        )
    )

    revalidatePath("/dashboard")
    return { success: true }
}

export async function getOrganizationProducts() {
    const user = await checkPermission()
    return prisma.product.findMany({
        where: { organizationId: user.organizationId, isActive: true },
        select: { id: true, name: true, price: true },
        orderBy: { name: 'asc' },
    })
}
