'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getSession } from "@/lib/auth"
import { sendDealCreatedEmail, sendDealStageChangedEmail, sendUpgradeNudgeEmail, sendEmailAsync, shouldSendUpgradeNudge } from '@/lib/email-automations'

const prisma = new PrismaClient()

async function getAuthenticatedUser() {
  const session = await getSession()
  if (!session || !session.user || !session.user.email) {
    throw new Error("Unauthorized")
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true }
  })
  if (!user) throw new Error("User not found")
  return user
}

export async function updateDealStage(dealId: string, stageId: string) {
  try {
    const user = await getAuthenticatedUser()

    // Security: Ensure deal belongs to user's org
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        stage: true,
        contact: true,
        user: true
      }
    })
    if (!deal || deal.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get old stage name before update
    const oldStageName = deal.stage.name

    // Get new stage
    const newStage = await prisma.pipelineStage.findUnique({
      where: { id: stageId }
    })

    if (!newStage) {
      return { success: false, error: 'Invalid stage' }
    }

    // Update deal
    await prisma.deal.update({
      where: { id: dealId },
      data: { stageId: stageId },
    })

    // Send email notification (async, non-blocking)
    // Only if stage actually changed
    if (oldStageName !== newStage.name && deal.user.name) {
      sendEmailAsync(
        sendDealStageChangedEmail({
          to: deal.user.email,
          assigneeName: deal.user.name,
          dealTitle: deal.title,
          dealValue: Number(deal.value || 0),
          oldStage: oldStageName,
          newStage: newStage.name,
          dealUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deal=${dealId}`,
          organizationId: user.organizationId,
          userId: deal.user.id
        })
      )
    }

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

    const user = await getAuthenticatedUser()

    if (!user.organizationId) {
      return { success: false, error: 'Usuário não pertence a uma organização' }
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
    const deal = await prisma.deal.create({
      data: {
        title,
        value,
        stageId,
        contactId: contactId || null,
        userId: user.id,
        organizationId: user.organizationId,
      },
      include: {
        stage: true,
        contact: true
      }
    })

    // Get updated deal count after creation
    const newDealCount = await prisma.deal.count({
      where: { organizationId: user.organizationId }
    })

    // Send deal created email (async, non-blocking)
    if (user.name) {
      sendEmailAsync(
        sendDealCreatedEmail({
          to: user.email,
          userName: user.name,
          dealTitle: deal.title,
          dealValue: Number(deal.value || 0),
          dealStage: deal.stage.name,
          contactName: deal.contact?.name || 'Sem contato',
          dealUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deal=${deal.id}`,
          organizationId: user.organizationId,
          userId: user.id
        })
      )

      // Check if should send upgrade nudge (at 8/10 deals for FREE tier)
      if (shouldSendUpgradeNudge(newDealCount, 10, user.organization.plan || 'FREE')) {
        sendEmailAsync(
          sendUpgradeNudgeEmail({
            to: user.email,
            userName: user.name,
            currentDeals: newDealCount,
            maxDeals: 10,
            organizationId: user.organizationId,
            userId: user.id
          })
        )
      }
    }

    revalidatePath('/dashboard')
    return { success: true, dealId: deal.id }
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
    const closeDateStr = formData.get('closeDate') as string
    const dueDateStr = formData.get('dueDate') as string

    if (!dealId || !title || !stageId) {
      return { success: false, error: 'Missing required fields' }
    }

    const user = await getAuthenticatedUser()

    // Security check
    const existingDeal = await prisma.deal.findUnique({ where: { id: dealId } })
    if (!existingDeal || existingDeal.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    const value = valueStr ? parseFloat(valueStr) : null
    const closeDate = closeDateStr ? new Date(closeDateStr) : null
    const dueDate = dueDateStr ? new Date(dueDateStr) : null

    await prisma.deal.update({
      where: { id: dealId },
      data: {
        title,
        value,
        stageId,
        contactId,
        closeDate,
        dueDate
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
    const user = await getAuthenticatedUser()

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
