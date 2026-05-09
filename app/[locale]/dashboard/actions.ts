'use server'

import logger from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from "@/lib/auth"
import { sendDealCreatedEmail, sendDealStageChangedEmail, sendUpgradeNudgeEmail, sendEmailAsync, shouldSendUpgradeNudge } from '@/lib/email-automations'
import { dispatchWebhookAsync } from '@/lib/webhooks/dispatcher'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'
import { canCreateDeal } from '@/lib/plan-limits'
import { ERR } from '@/lib/error-messages'

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

    // Validation: stage must belong to the same pipeline as the deal
    if (newStage.pipelineId !== deal.pipelineId) {
      return {
        success: false,
        error: 'Stage must belong to the same pipeline as the deal. Use moveDealToPipeline to change pipelines.'
      }
    }

    // Validation: stage must belong to user's organization
    if (newStage.organizationId !== user.organizationId) {
      return { success: false, error: 'Invalid stage' }
    }

    // Update deal
    await prisma.deal.update({
      where: { id: dealId },
      data: { stageId: stageId },
    })

    // Log activity (only if stage actually changed)
    if (deal.stageId !== stageId) {
      await prisma.activity.create({
        data: {
          type: 'STAGE_CHANGE',
          description: `Moveu de "${oldStageName}" para "${newStage.name}"`,
          dealId,
          userId: user.id,
        }
      })
    }

    // Dispatch webhook (async, non-blocking)
    dispatchWebhookAsync(user.organizationId, WEBHOOK_EVENTS.DEAL_STAGE_CHANGED, {
      deal: {
        id: deal.id,
        title: deal.title,
        value: Number(deal.value || 0)
      },
      oldStage: { name: oldStageName },
      newStage: { id: newStage.id, name: newStage.name }
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
    logger.error({ err: error }, 'Failed to update deal stage')
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
    const closeDateStr = formData.get('closeDate') as string
    const contactId = formData.get('contactId') as string || null

    const user = await getAuthenticatedUser()

    if (!user.organizationId) {
      return { success: false, error: ERR.USER_NO_ORG, code: ERR.USER_NO_ORG }
    }

    // LIMIT CHECK — usa canCreateDeal (suporta trial + read-only)
    const limitCheck = await canCreateDeal(user.organizationId)
    if (!limitCheck.allowed) {
      if (limitCheck.reason === 'TRIAL_EXPIRED') {
        return { success: false, error: 'Seu período de trial expirou. Faça upgrade para continuar criando negócios.' }
      }
      return { success: false, error: limitCheck.reason || 'Limite de negócios atingido. Faça upgrade para continuar.' }
    }

    // Get stage to obtain pipelineId
    const stage = await prisma.pipelineStage.findUnique({
      where: { id: stageId }
    })

    if (!stage || stage.organizationId !== user.organizationId) {
      return { success: false, error: 'Invalid stage' }
    }

    // Create deal
    const deal = await prisma.deal.create({
      data: {
        title,
        value,
        stageId,
        pipelineId: stage.pipelineId,
        contactId: contactId || null,
        userId: user.id,
        organizationId: user.organizationId,
        closeDate: closeDateStr ? new Date(closeDateStr) : null,
      },
      include: {
        stage: true,
        contact: true
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'CREATE',
        description: `Criou o negócio em "${deal.stage.name}"${value ? ` com valor R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}`,
        dealId: deal.id,
        userId: user.id,
      }
    })

    // Dispatch webhook (async, non-blocking)
    dispatchWebhookAsync(user.organizationId, WEBHOOK_EVENTS.DEAL_CREATED, {
      deal: {
        id: deal.id,
        title: deal.title,
        value: Number(deal.value || 0),
        stage: {
          id: deal.stage.id,
          name: deal.stage.name
        },
        contact: deal.contact ? {
          id: deal.contact.id,
          name: deal.contact.name
        } : null
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
      if (shouldSendUpgradeNudge(newDealCount, 10, user.organization.tier || 'FREE')) {
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
    logger.error({ err: error }, 'Failed to create deal')
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
    const productId = formData.get('productId') as string || null
    const closeDateStr = formData.get('closeDate') as string
    const dueDateStr = formData.get('dueDate') as string
    const dueDateNote = formData.get('dueDateNote') as string | null

    if (!dealId || !title || !stageId) {
      return { success: false, error: 'Missing required fields' }
    }

    const user = await getAuthenticatedUser()

    // Security check
    const existingDeal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { stage: true }
    })
    if (!existingDeal || existingDeal.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    const value = valueStr ? parseFloat(valueStr) : null
    const closeDate = closeDateStr ? new Date(closeDateStr) : null
    const dueDate = dueDateStr ? new Date(dueDateStr) : null
    const observations = formData.get('observations') as string | null

    // Detect changes for activity log
    const oldValue = existingDeal.value !== null ? Number(existingDeal.value) : null
    const stageChanged = existingDeal.stageId !== stageId
    const valueChanged = oldValue !== value
    const oldStageName = existingDeal.stage.name

    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        title,
        value,
        stageId,
        contactId,
        productId,
        closeDate,
        dueDate,
        dueDateNote: dueDateNote || null,
        observations: observations || null,
      },
      include: {
        stage: true
      }
    })

    // Log activities for tracked changes
    const activitiesToLog: { type: string; description: string }[] = []
    if (stageChanged) {
      activitiesToLog.push({
        type: 'STAGE_CHANGE',
        description: `Moveu de "${oldStageName}" para "${updatedDeal.stage.name}"`,
      })
    }
    if (valueChanged) {
      const oldStr = oldValue !== null ? `R$ ${oldValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'sem valor'
      const newStr = value !== null ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'sem valor'
      activitiesToLog.push({
        type: 'VALUE_CHANGE',
        description: `Alterou valor de ${oldStr} para ${newStr}`,
      })
    }
    if (activitiesToLog.length > 0) {
      await prisma.activity.createMany({
        data: activitiesToLog.map(a => ({ ...a, dealId, userId: user.id }))
      })
    }

    // Dispatch webhook (async, non-blocking)
    dispatchWebhookAsync(user.organizationId, WEBHOOK_EVENTS.DEAL_UPDATED, {
      deal: {
        id: updatedDeal.id,
        title: updatedDeal.title,
        value: Number(updatedDeal.value || 0),
        stage: {
          id: updatedDeal.stage.id,
          name: updatedDeal.stage.name
        }
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    logger.error({ err: error }, 'Failed to update deal')
    return { success: false, error: 'Failed to update deal' }
  }
}
export async function updateDealStatus(dealId: string, status: 'ACTIVE' | 'LOST', lostReason?: string) {
  try {
    const user = await getAuthenticatedUser()
    const deal = await prisma.deal.findUnique({ where: { id: dealId } })
    if (!deal || deal.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }
    await prisma.deal.update({
      where: { id: dealId },
      data: {
        status,
        ...(status === 'LOST' && lostReason ? { lostReason } : {}),
        ...(status === 'ACTIVE' ? { lostReason: null } : {}),
      },
    })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    logger.error({ err: error }, 'Failed to update deal status')
    return { success: false, error: 'Failed to update deal status' }
  }
}

export async function moveDealToPipeline(dealId: string, newPipelineId: string, newStageId: string) {
  try {
    const user = await getAuthenticatedUser()

    // Security: Ensure deal belongs to user's org
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        stage: true,
        pipeline: true,
        user: true
      }
    })

    if (!deal || deal.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate new pipeline belongs to user's organization
    const newPipeline = await prisma.pipeline.findUnique({
      where: { id: newPipelineId }
    })

    if (!newPipeline || newPipeline.organizationId !== user.organizationId) {
      return { success: false, error: 'Invalid pipeline' }
    }

    // Validate new stage belongs to the new pipeline
    const newStage = await prisma.pipelineStage.findUnique({
      where: { id: newStageId }
    })

    if (!newStage || newStage.pipelineId !== newPipelineId) {
      return { success: false, error: 'Stage must belong to the selected pipeline' }
    }

    if (newStage.organizationId !== user.organizationId) {
      return { success: false, error: 'Invalid stage' }
    }

    // Store old values for email notification
    const oldPipelineName = deal.pipeline.name
    const oldStageName = deal.stage.name

    // Update deal with new pipeline and stage
    await prisma.deal.update({
      where: { id: dealId },
      data: {
        pipelineId: newPipelineId,
        stageId: newStageId
      }
    })

    // Log activity — pipeline + stage move
    await prisma.activity.create({
      data: {
        type: 'PIPELINE_CHANGE',
        description: `Moveu de "${oldPipelineName} - ${oldStageName}" para "${newPipeline.name} - ${newStage.name}"`,
        dealId,
        userId: user.id,
      }
    })

    // Send email notification if deal was assigned to someone
    if (deal.user.name) {
      sendEmailAsync(
        sendDealStageChangedEmail({
          to: deal.user.email,
          assigneeName: deal.user.name,
          dealTitle: deal.title,
          dealValue: Number(deal.value || 0),
          oldStage: `${oldPipelineName} - ${oldStageName}`,
          newStage: `${newPipeline.name} - ${newStage.name}`,
          dealUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deal=${dealId}`,
          organizationId: user.organizationId,
          userId: deal.user.id
        })
      )
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    logger.error({ err: error }, 'Failed to move deal to pipeline')
    return { success: false, error: 'Failed to move deal to pipeline' }
  }
}

export async function deleteDeal(dealId: string) {
  try {
    const user = await getAuthenticatedUser()

    // Security check
    const existingDeal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { stage: true }
    })
    if (!existingDeal || existingDeal.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Delete deal
    await prisma.deal.delete({
      where: { id: dealId },
    })

    // Dispatch webhook (async, non-blocking)
    dispatchWebhookAsync(user.organizationId, WEBHOOK_EVENTS.DEAL_DELETED, {
      deal: {
        id: existingDeal.id,
        title: existingDeal.title,
        value: Number(existingDeal.value || 0)
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete deal')
    return { success: false, error: 'Failed to delete deal' }
  }
}
