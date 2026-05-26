'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

async function getAuthUser() {
    const session = await getSession()
    if (!session?.user?.email) return null
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, organizationId: true },
    })
    if (!user?.organizationId) return null
    return user
}

export async function listCustomSegments() {
    const user = await getAuthUser()
    if (!user) return []
    return (prisma.customSegment as any).findMany({
        where: { organizationId: user.organizationId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    })
}

export async function createCustomSegment(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return { success: false, error: 'Nome inválido' }

    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    const existing = await (prisma.customSegment as any).findFirst({
        where: {
            organizationId: user.organizationId,
            name: { equals: trimmed, mode: 'insensitive' },
        },
        select: { name: true },
    })
    if (existing) return { success: false, error: `"${existing.name}" já existe.`, code: 'DUPLICATE' }

    const segment = await (prisma.customSegment as any).create({
        data: {
            name: trimmed,
            organizationId: user.organizationId,
            createdById: user.id,
        },
        select: { id: true, name: true },
    })

    revalidatePath('/[locale]/dashboard/contacts', 'page')
    return { success: true, segment }
}

export async function deleteCustomSegment(id: string) {
    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    const segment = await (prisma.customSegment as any).findFirst({
        where: { id, organizationId: user.organizationId },
        select: { id: true },
    })
    if (!segment) return { success: false, error: 'Segmento não encontrado' }

    await (prisma.customSegment as any).delete({ where: { id } })
    revalidatePath('/[locale]/dashboard/contacts', 'page')
    return { success: true }
}
