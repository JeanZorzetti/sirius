'use server'

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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

    if (!deal || deal.organizationId !== user.organizationId) {
        throw new Error("Deal not found")
    }

    // Visibility check (MEMBER can only see own deals?)
    // For now keeping simple: MEMBER sees own deals OR we expand this later based on settings.
    // The Dashboard main query already filters. Here if they have ID they can see details?
    // Let's enforce strict ownership for now if role is MEMBER.
    if (user.orgRole === "MEMBER" && deal.userId !== user.id) {
        throw new Error("Access denied")
    }

    // Force serialization to simple types to prevent Next.js boundaries errors
    return {
        ...deal,
        value: deal.value ? Number(deal.value) : null,
        closeDate: deal.closeDate ? deal.closeDate.toISOString() : null,
        dueDate: deal.dueDate ? deal.dueDate.toISOString() : null,
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
