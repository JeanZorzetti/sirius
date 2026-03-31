'use server'

import logger from '@/lib/logger'
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { canCreatePipeline } from "@/lib/plan-limits"

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

export async function getPipelines() {
    try {
        const user = await checkPermission()

        const pipelines = await prisma.pipeline.findMany({
            where: { organizationId: user.organizationId },
            include: {
                _count: {
                    select: {
                        stages: true,
                        deals: true
                    }
                }
            },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'asc' }
            ]
        })

        return { success: true, pipelines }
    } catch (error) {
        logger.error({ err: error }, 'Failed to get pipelines')
        return { success: false, error: 'Failed to get pipelines' }
    }
}

export async function createPipeline(name: string) {
    try {
        const user = await checkPermission()

        if (!name || name.trim().length === 0) {
            return { success: false, error: 'Nome do pipeline é obrigatório' }
        }

        // Check plan limits before creating
        const limitCheck = await canCreatePipeline(user.organizationId)
        if (!limitCheck.allowed) {
            return {
                success: false,
                error: limitCheck.reason,
                code: 'PLAN_LIMIT_REACHED',
                current: limitCheck.current,
                limit: limitCheck.limit,
            }
        }

        // Check if this is the first pipeline (should be default)
        const existingPipelines = await prisma.pipeline.count({
            where: { organizationId: user.organizationId }
        })

        const isDefault = existingPipelines === 0

        const pipeline = await prisma.pipeline.create({
            data: {
                name: name.trim(),
                isDefault,
                organizationId: user.organizationId
            }
        })

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/pipelines')
        return { success: true, pipeline }
    } catch (error) {
        logger.error({ err: error }, 'Failed to create pipeline')
        return { success: false, error: 'Failed to create pipeline' }
    }
}

export async function updatePipeline(id: string, name: string) {
    try {
        const user = await checkPermission()

        if (!name || name.trim().length === 0) {
            return { success: false, error: 'Nome do pipeline é obrigatório' }
        }

        // Security check: ensure pipeline belongs to user's organization
        const existingPipeline = await prisma.pipeline.findUnique({
            where: { id }
        })

        if (!existingPipeline || existingPipeline.organizationId !== user.organizationId) {
            return { success: false, error: 'Pipeline não encontrado' }
        }

        const pipeline = await prisma.pipeline.update({
            where: { id },
            data: { name: name.trim() }
        })

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/pipelines')
        return { success: true, pipeline }
    } catch (error) {
        logger.error({ err: error }, 'Failed to update pipeline')
        return { success: false, error: 'Failed to update pipeline' }
    }
}

export async function deletePipeline(id: string) {
    try {
        const user = await checkPermission()

        // Security check: ensure pipeline belongs to user's organization
        const pipeline = await prisma.pipeline.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        deals: true,
                        stages: true
                    }
                }
            }
        })

        if (!pipeline || pipeline.organizationId !== user.organizationId) {
            return { success: false, error: 'Pipeline não encontrado' }
        }

        // Validation: cannot delete pipeline with deals
        if (pipeline._count.deals > 0) {
            return {
                success: false,
                error: `Não é possível deletar pipeline com ${pipeline._count.deals} negócio(s). Mova ou delete os negócios primeiro.`
            }
        }

        // Validation: cannot delete the only pipeline
        const pipelineCount = await prisma.pipeline.count({
            where: { organizationId: user.organizationId }
        })

        if (pipelineCount <= 1) {
            return {
                success: false,
                error: 'Não é possível deletar o único pipeline. Crie outro pipeline primeiro.'
            }
        }

        // Validation: cannot delete default pipeline
        if (pipeline.isDefault) {
            return {
                success: false,
                error: 'Não é possível deletar o pipeline padrão. Defina outro pipeline como padrão primeiro.'
            }
        }

        // Delete pipeline (stages will cascade delete due to schema)
        await prisma.pipeline.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/pipelines')
        return { success: true }
    } catch (error) {
        logger.error({ err: error }, 'Failed to delete pipeline')
        return { success: false, error: 'Failed to delete pipeline' }
    }
}

export async function setDefaultPipeline(id: string) {
    try {
        const user = await checkPermission()

        // Security check: ensure pipeline belongs to user's organization
        const pipeline = await prisma.pipeline.findUnique({
            where: { id }
        })

        if (!pipeline || pipeline.organizationId !== user.organizationId) {
            return { success: false, error: 'Pipeline não encontrado' }
        }

        // Transaction: unset current default and set new default
        await prisma.$transaction([
            // Unset all defaults for this organization
            prisma.pipeline.updateMany({
                where: {
                    organizationId: user.organizationId,
                    isDefault: true
                },
                data: { isDefault: false }
            }),
            // Set new default
            prisma.pipeline.update({
                where: { id },
                data: { isDefault: true }
            })
        ])

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/pipelines')
        return { success: true }
    } catch (error) {
        logger.error({ err: error }, 'Failed to set default pipeline')
        return { success: false, error: 'Failed to set default pipeline' }
    }
}
