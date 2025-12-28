'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function updateDealStage(dealId: string, stageId: string) {
  try {
    const user = await prisma.user.findFirst()
    if (!user) return { success: false, error: 'User not found' }

    // Security: Ensure deal belongs to user's org
    const deal = await prisma.deal.findUnique({ where: { id: dealId } })
    if (!deal || deal.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.deal.update({
      where: { id: dealId },
      data: { stageId: stageId },
    })

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to update deal stage:', error)
    return { success: false, error: 'Failed to update deal stage' }
  }
}

export async function createDeal(formData: FormData) {
  try {
    const title = formData.get('title') as string
    const valueStr = formData.get('value') as string
    const stageId = formData.get('stageId') as string

    if (!title || !stageId) {
      return { success: false, error: 'Title and stage are required' }
    }

    const value = valueStr ? parseFloat(valueStr) : null
    // stageId declared above at line 28
    const contactId = formData.get('contactId') as string || null

    // MVP: Get first user with org
    const user = await prisma.user.findFirst({
      include: { organization: true }
    })

    if (!user || !user.organizationId) {
      return { success: false, error: 'Usuário ou Organização não encontrados' }
    }

    // LIMIT CHECK (FREEMIUM)
    // If Plan is FREE (or null), limit to 10 deals.
    const isPro = user.organization.plan === 'PRO'

    if (!isPro) {
      const dealCount = await prisma.deal.count({
        where: { organizationId: user.organizationId }
      })

      if (dealCount >= 10) {
        return { success: false, error: 'Limite de 10 negócios no plano Gratuito. Faça upgrade para continuar!' }
      }
    }

    // Create deal
    await prisma.deal.create({
      data: {
        title,
        value,
        stageId,
        contactId: contactId || null,
        userId: user.id,
        organizationId: user.organizationId,
      },
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to create deal:', error)
    return { success: false, error: 'Failed to create deal' }
  }
}

export async function updateDeal(formData: FormData) {
  try {
    const dealId = formData.get('dealId') as string
    const title = formData.get('title') as string
    const valueStr = formData.get('value') as string
    const stageId = formData.get('stageId') as string
    const contactId = formData.get('contactId') as string || null

    if (!dealId || !title || !stageId) {
      return { success: false, error: 'Missing required fields' }
    }

    const user = await prisma.user.findFirst()
    if (!user) return { success: false, error: 'User not found' }

    // Security check
    const existingDeal = await prisma.deal.findUnique({ where: { id: dealId } })
    if (!existingDeal || existingDeal.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    const value = valueStr ? parseFloat(valueStr) : null

    await prisma.deal.update({
      where: { id: dealId },
      data: {
        title,
        value,
        stageId,
        contactId
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to update deal:', error)
    return { success: false, error: 'Failed to update deal' }
  }
}
export async function deleteDeal(dealId: string) {
  try {
    const user = await prisma.user.findFirst()
    if (!user) return { success: false, error: 'User not found' }

    // Security check
    const existingDeal = await prisma.deal.findUnique({ where: { id: dealId } })
    if (!existingDeal || existingDeal.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.deal.delete({
      where: { id: dealId },
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete deal:', error)
    return { success: false, error: 'Failed to delete deal' }
  }
}
