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

export async function updateStageOrder(stages: { id: string, order: number }[]) {
    const user = await checkPermission()

    // Transaction to update all orders
    await prisma.$transaction(
        stages.map((stage) =>
            prisma.pipelineStage.update({
                where: { id: stage.id, organizationId: user.organizationId },
                data: { order: stage.order }
            })
        )
    )

    revalidatePath("/dashboard")
    return { success: true }
}

export async function createStage(name: string) {
    const user = await checkPermission()
    if (!name) return { success: false, error: "Nome obrigatório" }

    // Get default pipeline
    const defaultPipeline = await prisma.pipeline.findFirst({
        where: {
            organizationId: user.organizationId,
            isDefault: true
        }
    })

    if (!defaultPipeline) {
        return { success: false, error: "Pipeline padrão não encontrado" }
    }

    // Find max order for this pipeline
    const maxOrder = await prisma.pipelineStage.findFirst({
        where: {
            organizationId: user.organizationId,
            pipelineId: defaultPipeline.id
        },
        orderBy: { order: 'desc' }
    })

    const newOrder = maxOrder ? maxOrder.order + 1 : 0

    await prisma.pipelineStage.create({
        data: {
            name,
            order: newOrder,
            organizationId: user.organizationId,
            pipelineId: defaultPipeline.id
        }
    })

    revalidatePath("/dashboard")
    return { success: true }
}

export async function updateStage(stageId: string, name: string) {
    const user = await checkPermission()

    await prisma.pipelineStage.update({
        where: { id: stageId, organizationId: user.organizationId },
        data: { name }
    })

    revalidatePath("/dashboard")
    return { success: true }
}

export async function deleteStage(stageId: string) {
    const user = await checkPermission()

    // Check if stage has deals
    const stage = await prisma.pipelineStage.findUnique({
        where: { id: stageId, organizationId: user.organizationId },
        include: { _count: { select: { deals: true } } }
    })

    if (!stage) return { success: false, error: "Stage not found" }
    if (stage._count.deals > 0) return { success: false, error: "Etapa não está vazia" }

    await prisma.pipelineStage.delete({
        where: { id: stageId }
    })

    revalidatePath("/dashboard")
    return { success: true }
}
