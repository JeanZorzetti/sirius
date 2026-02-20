'use server'

import logger from '@/lib/logger'
import { prisma } from "@/lib/prisma"
import { getSession, login } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function checkAdmin() {
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
        throw new Error("Unauthorized")
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    })

    if (!user || user.role !== "ADMIN") {
        throw new Error("Forbidden")
    }

    return user
}

export async function updateOrganizationPlan(orgId: string, plan: "FREE" | "STARTER" | "PRO" | "BUSINESS") {
    await checkAdmin()

    // FIX: Atualizar AMBOS os campos - 'tier' (novo) e 'plan' (legado)
    await prisma.organization.update({
        where: { id: orgId },
        data: {
            tier: plan,  // Campo correto usado pelo sistema de entitlements
            plan: plan,  // Campo legado (manter sincronizado para compatibilidade)
        },
    })

    revalidatePath("/admin/organizations")
    return { success: true }
}

export async function deleteOrganization(orgId: string) {
    await checkAdmin()

    // Cascade delete is handled by Prisma schema if configured, 
    // but usually better to be explicit or use onDelete: Cascade in schema.
    // Assuming schema handles relations or we might fail if not cleared.
    // For now, let's try direct deletion.

    // Note: If you have strict Foreign Keys without Cascade, this will throw.
    // In a real prod env, we should delete related records first.

    // Let's safe delete: Delete users, deals, contacts first? 
    // Or just trust the schema has cascades? 
    // Looking at schema from previous context, relations don't explicitly show onDelete: Cascade in the view I saw.
    // Let's try to delete. If it fails, I'll update to delete related data.

    try {
        await prisma.contact.deleteMany({ where: { organizationId: orgId } })
        await prisma.deal.deleteMany({ where: { organizationId: orgId } })
        await prisma.pipelineStage.deleteMany({ where: { organizationId: orgId } })
        await prisma.user.deleteMany({ where: { organizationId: orgId } })
        await prisma.organization.delete({
            where: { id: orgId },
        })
    } catch (e) {
        logger.error({ err: e }, 'Failed to delete organization')
        throw new Error("Failed to delete organization")
    }

    revalidatePath("/admin/organizations")
    return { success: true }
}

export async function moveUserToOrganization(userId: string, newOrgId: string) {
    await checkAdmin()

    const [user, org] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.organization.findUnique({ where: { id: newOrgId } }),
    ])

    if (!user) throw new Error("Usuário não encontrado")
    if (!org) throw new Error("Organização não encontrada")
    if (user.organizationId === newOrgId) throw new Error("Usuário já está nessa organização")

    await prisma.user.update({
        where: { id: userId },
        data: {
            organizationId: newOrgId,
            orgRole: 'MEMBER', // Downgrade to MEMBER when moved
            pipelineRestricted: false,
            allowedPipelineIds: [],
        },
    })

    revalidatePath("/admin/users")
    return { success: true }
}

export async function impersonateUser(userId: string) {
    await checkAdmin()

    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
    })

    if (!targetUser) {
        throw new Error("User not found")
    }

    // Set cookie as if we were this user
    await login(targetUser)

    // Redirect to their dashboard
    redirect("/dashboard")
}
