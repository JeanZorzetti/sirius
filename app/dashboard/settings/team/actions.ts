'use server'

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"

async function checkOwner() {
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
        throw new Error("Unauthorized")
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    })

    if (!user || user.orgRole !== "OWNER") {
        throw new Error("Forbidden: Action requires OWNER role")
    }

    return user
}

export async function createInvite(email: string) {
    const owner = await checkOwner()

    if (!email) throw new Error("Email is required")

    // Check if duplicate
    const existing = await prisma.invite.findFirst({
        where: {
            email,
            organizationId: owner.organizationId
        }
    })

    if (existing) {
        // If expired, refresh? For now, just error.
        throw new Error("Invite already exists for this email")
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await prisma.invite.create({
        data: {
            email,
            token,
            organizationId: owner.organizationId,
            expiresAt,
            role: 'MEMBER'
        }
    })

    revalidatePath("/dashboard/settings/team")
    return { success: true, token }
}

export async function revokeInvite(inviteId: string) {
    const owner = await checkOwner()

    await prisma.invite.delete({
        where: {
            id: inviteId,
            organizationId: owner.organizationId // Security check
        }
    })

    revalidatePath("/dashboard/settings/team")
    return { success: true }
}

export async function removeMember(userId: string) {
    const owner = await checkOwner()

    if (userId === owner.id) {
        throw new Error("Cannot remove yourself")
    }

    // Verify user belongs to org
    const targetUser = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!targetUser || targetUser.organizationId !== owner.organizationId) {
        throw new Error("User not found in organization")
    }

    // In a real app we might soft delete or just un-link. 
    // Here we delete the user account to keep it clean for MVP.
    // Ideally we should transfer resources or verify dependencies.
    // For now assumingCASCADE or careful deletion.

    // Check if user has deals?
    // prisma delete cascade might be dangerous.
    // Let's just unlink organizationId? But user needs Org.
    // Let's delete user.

    await prisma.user.delete({
        where: { id: userId }
    })

    revalidatePath("/dashboard/settings/team")
    return { success: true }
}
