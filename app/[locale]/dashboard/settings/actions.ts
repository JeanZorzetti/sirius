'use server'

import logger from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { ERR } from '@/lib/error-messages'

export async function updateProfile(formData: FormData) {
    try {
        // CRITICAL FIX: Get authenticated user from session
        const session = await getSession()
        if (!session || !session.user || !session.user.email) {
            return { success: false, error: ERR.UNAUTHORIZED }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })
        if (!user) {
            return { success: false, error: ERR.NOT_FOUND }
        }

        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const organizationName = formData.get('organizationName') as string | null

        await prisma.user.update({
            where: { id: user.id },
            data: { name, email },
        })

        if (organizationName?.trim() && user.organizationId) {
            await prisma.organization.update({
                where: { id: user.organizationId },
                data: { name: organizationName.trim() },
            })
        }

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error) {
        logger.error({ err: error }, 'Update profile error')
        return { success: false, error: 'Falha ao atualizar perfil' }
    }
}
