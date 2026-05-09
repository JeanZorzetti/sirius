'use server'

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"
import { sendEmail } from "@/lib/email"
import { InviteEmail } from "@/emails/templates/invite"
import { OrgRole } from "@prisma/client"
import { resolveUserLocale } from "@/lib/i18n-server"
import { defaultLocale } from "@/i18n/config"
import {
    canManageRole,
    normalizeRole,
    CONFIGURABLE_ROLES,
} from "@/lib/role-permissions"
import { updateTag } from "next/cache"

async function getActor() {
    const session = await getSession()
    if (!session?.user?.email) {
        throw new Error("Unauthorized")
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    })

    if (!user) {
        throw new Error("Unauthorized")
    }

    return user
}

async function checkOwner() {
    const user = await getActor()
    if (normalizeRole(user.orgRole) !== "OWNER") {
        throw new Error("Forbidden: Action requires OWNER role")
    }
    return user
}

export async function createInvite(email: string, role: OrgRole = 'VENDEDOR') {
    const actor = await getActor()

    if (!email) throw new Error("Email é obrigatório")

    // Hierarchy guard: actor must be able to manage the role being assigned
    if (!canManageRole(actor.orgRole, role)) {
        throw new Error("Você não tem permissão para convidar com essa função")
    }

    // Check if duplicate
    const existing = await prisma.invite.findFirst({
        where: {
            email,
            organizationId: actor.organizationId
        }
    })

    if (existing) {
        throw new Error("Já existe um convite para esse email")
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const organization = await prisma.organization.findUnique({
        where: { id: actor.organizationId },
        select: { name: true }
    })

    await prisma.invite.create({
        data: {
            email,
            token,
            organizationId: actor.organizationId,
            expiresAt,
            role,
        }
    })

    const inviteUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://siriuscrm.com.br'}/register?invite=${token}`
    const locale = (actor.locale as 'pt-BR' | 'en') ?? defaultLocale
    const inviterName = actor.name ?? (locale === 'en' ? 'A colleague' : 'Um colega')
    const orgName = organization?.name ?? 'Sirius CRM'
    const subject = locale === 'en'
        ? `${inviterName} invited you to ${orgName}`
        : `${inviterName} convidou você para o ${orgName}`
    await sendEmail({
        to: email,
        subject,
        react: InviteEmail({
            inviterName,
            organizationName: orgName,
            inviteUrl,
            locale,
        }),
    })

    revalidatePath("/dashboard/settings/team")
    return { success: true, token }
}

export async function resendInvite(inviteId: string) {
    const actor = await getActor()

    const invite = await prisma.invite.findUnique({
        where: { id: inviteId, organizationId: actor.organizationId }
    })

    if (!invite) throw new Error("Convite não encontrado")
    if (!canManageRole(actor.orgRole, invite.role as OrgRole)) {
        throw new Error("Você não tem permissão para gerenciar esse convite")
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await prisma.invite.update({
        where: { id: inviteId },
        data: { token, expiresAt }
    })

    const organization = await prisma.organization.findUnique({
        where: { id: actor.organizationId },
        select: { name: true }
    })

    const inviteUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://siriuscrm.com.br'}/register?invite=${token}`
    const locale = (actor.locale as 'pt-BR' | 'en') ?? defaultLocale
    const inviterName = actor.name ?? (locale === 'en' ? 'A colleague' : 'Um colega')
    const orgName = organization?.name ?? 'Sirius CRM'
    const resendSubject = locale === 'en'
        ? `${inviterName} invited you to ${orgName}`
        : `${inviterName} convidou você para o ${orgName}`
    await sendEmail({
        to: invite.email,
        subject: resendSubject,
        react: InviteEmail({
            inviterName,
            organizationName: orgName,
            inviteUrl,
            locale,
        }),
    })

    revalidatePath("/dashboard/settings/team")
    return { success: true }
}

export async function revokeInvite(inviteId: string) {
    const actor = await getActor()

    const invite = await prisma.invite.findUnique({
        where: { id: inviteId, organizationId: actor.organizationId }
    })
    if (!invite) throw new Error("Convite não encontrado")
    if (!canManageRole(actor.orgRole, invite.role as OrgRole)) {
        throw new Error("Você não tem permissão para revogar esse convite")
    }

    await prisma.invite.delete({
        where: { id: inviteId }
    })

    revalidatePath("/dashboard/settings/team")
    return { success: true }
}

export async function updateUserPipelineVisibility(
    targetUserId: string,
    restricted: boolean,
    allowedPipelineIds: string[]
) {
    const actor = await getActor()

    const target = await prisma.user.findUnique({
        where: { id: targetUserId }
    })

    if (!target || target.organizationId !== actor.organizationId) {
        throw new Error("Usuário não encontrado na organização")
    }

    if (!canManageRole(actor.orgRole, target.orgRole)) {
        throw new Error("Você não tem permissão para gerenciar esse usuário")
    }

    await prisma.user.update({
        where: { id: targetUserId },
        data: {
            pipelineRestricted: restricted,
            allowedPipelineIds: restricted ? allowedPipelineIds : [],
        }
    })

    revalidatePath("/dashboard/settings/team")
    return { success: true }
}

export async function updateMemberRole(targetUserId: string, newRole: OrgRole) {
    const actor = await getActor()

    const target = await prisma.user.findUnique({
        where: { id: targetUserId }
    })

    if (!target || target.organizationId !== actor.organizationId) {
        throw new Error("Usuário não encontrado na organização")
    }

    // Actor must be able to manage both the current role AND the new role
    if (!canManageRole(actor.orgRole, target.orgRole)) {
        throw new Error("Você não tem permissão para alterar a função desse usuário")
    }
    if (!canManageRole(actor.orgRole, newRole)) {
        throw new Error("Você não tem permissão para atribuir essa função")
    }

    // Guard: never leave the org without an OWNER
    if (target.orgRole === 'OWNER' && newRole !== 'OWNER') {
        const ownerCount = await prisma.user.count({
            where: { organizationId: actor.organizationId, orgRole: 'OWNER' }
        })
        if (ownerCount <= 1) {
            throw new Error("Não é possível rebaixar o último OWNER da organização")
        }
    }

    await prisma.user.update({
        where: { id: targetUserId },
        data: { orgRole: newRole }
    })

    // Invalidate cached dashboard user so the new role's features apply on next render
    updateTag(`user:${target.email}`)
    revalidatePath("/dashboard/settings/team")
    return { success: true }
}

export async function updateRolePermissions(
    role: OrgRole,
    perms: { canAccessAgenda: boolean; canAccessTasks: boolean }
) {
    const owner = await checkOwner()

    if (!CONFIGURABLE_ROLES.includes(role)) {
        throw new Error("Função não configurável")
    }

    await prisma.rolePermissions.upsert({
        where: { organizationId_role: { organizationId: owner.organizationId, role } },
        update: {
            canAccessAgenda: perms.canAccessAgenda,
            canAccessTasks: perms.canAccessTasks,
        },
        create: {
            organizationId: owner.organizationId,
            role,
            canAccessAgenda: perms.canAccessAgenda,
            canAccessTasks: perms.canAccessTasks,
        }
    })

    // Invalidate cached dashboard user for every member with this role so feature flags refresh
    const affected = await prisma.user.findMany({
        where: { organizationId: owner.organizationId, orgRole: role },
        select: { email: true }
    })
    for (const u of affected) updateTag(`user:${u.email}`)

    revalidatePath("/dashboard/settings/team")
    return { success: true }
}

export async function removeMember(userId: string) {
    const actor = await getActor()

    if (userId === actor.id) {
        throw new Error("Você não pode remover a si mesmo")
    }

    const target = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!target || target.organizationId !== actor.organizationId) {
        throw new Error("Usuário não encontrado na organização")
    }

    if (!canManageRole(actor.orgRole, target.orgRole)) {
        throw new Error("Você não tem permissão para remover esse usuário")
    }

    // Don't allow removing the last OWNER
    if (target.orgRole === 'OWNER') {
        const ownerCount = await prisma.user.count({
            where: { organizationId: actor.organizationId, orgRole: 'OWNER' }
        })
        if (ownerCount <= 1) {
            throw new Error("Não é possível remover o último OWNER da organização")
        }
    }

    await prisma.user.delete({
        where: { id: userId }
    })

    revalidatePath("/dashboard/settings/team")
    return { success: true }
}
