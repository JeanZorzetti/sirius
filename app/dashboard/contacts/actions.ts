'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function createContact(formData: FormData) {
    try {
        const user = await prisma.user.findFirst({
            include: { organization: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'Usuário não pertence a uma organização.' }
        }

        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const company = formData.get('company') as string

        await prisma.contact.create({
            data: {
                name,
                email,
                phone,
                company,
                organizationId: user.organizationId
            }
        })

        revalidatePath('/dashboard/contacts')
        return { success: true }
    } catch (error) {
        console.error('Failed to create contact:', error)
        return { success: false, error: 'Failed to create contact' }
    }
}
