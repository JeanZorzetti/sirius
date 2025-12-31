'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

export async function updateProfile(formData: FormData) {
    try {
        // CRITICAL FIX: Get authenticated user from session
        const session = await getSession()
        if (!session || !session.user || !session.user.email) {
            return { success: false, error: 'Não autorizado' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })
        if (!user) {
            return { success: false, error: 'Usuário não encontrado' }
        }

        const name = formData.get('name') as string
        const email = formData.get('email') as string

        await prisma.user.update({
            where: { id: user.id },
            data: { name, email },
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Update profile error:', error)
        return { success: false, error: 'Falha ao atualizar perfil' }
    }
}
