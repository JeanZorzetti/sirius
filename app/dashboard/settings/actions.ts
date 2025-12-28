'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    try {
        // MVP: Get first user. In prod: await getServerSession...
        const user = await prisma.user.findFirst()
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
