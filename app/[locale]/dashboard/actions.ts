'use server'

import logger from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from "@/lib/auth"
import { sendUpgradeNudgeEmail, sendEmailAsync, shouldSendUpgradeNudge } from '@/lib/email-automations'
import { dispatchWebhookAsync } from '@/lib/webhooks/dispatcher'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'
import { canCreateDeal } from '@/lib/entitlements'
import { chaveDeNegocioForaDaConta } from '@/lib/pipeline/chaves'
import { ERR } from '@/lib/error-messages'
import { moverNegocio, aoCriarNegocio } from '@/lib/pipeline/mover-negocio'

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

    // Spec 014: the one door for moves (history, status by stage type, automations)
    const r = await moverNegocio({
      organizationId: user.organizationId,
      dealId,
      paraEtapaId: stageId,
      autor: { userId: user.id, tipo: 'USER' },
    })
    if (!r.ok) {
      return { success: false, error: r.erro === 'NAO_ENCONTRADO' ? 'Unauthorized' : 'Invalid stage' }
    }

    if (r.mudou) {
      // isolamento: deal and stage checked inside the organization by moverNegocio
      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        select: { id: true, title: true, value: true, stage: { select: { id: true, name: true } } },
      })
      if (deal) {
        dispatchWebhookAsync(user.organizationId, WEBHOOK_EVENTS.DEAL_STAGE_CHANGED, {
          deal: { id: deal.id, title: deal.title, value: Number(deal.value || 0) },
          oldStage: { name: r.deAnterior.stageName },
          newStage: { id: deal.stage.id, name: deal.stage.name },
        })
      }
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

    if (await chaveDeNegocioForaDaConta(user.organizationId, stage.pipelineId, { contactId })) {
      return { success: false, error: 'Invalid contact' }
    }

    // Create deal
    // isolamento: stage checked above; contactId checked by chaveDeNegocioForaDaConta
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

    // Spec 014: history + DEAL_CREATED automations
    await aoCriarNegocio({ deal, nomeDaEtapa: deal.stage.name, autor: { userId: user.id, tipo: 'USER' } })

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

    // FR-007: no "deal created" e-mail to the person who just created it
    if (user.name) {
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

    // The stage must be in the deal's pipeline, and the contact and product in the organization
    const foraDaConta = await chaveDeNegocioForaDaConta(user.organizationId, existingDeal.pipelineId, { stageId, contactId, productId })
    if (foraDaConta) {
      return { success: false, error: `Invalid ${foraDaConta}` }
    }

    const value = valueStr ? parseFloat(valueStr) : null
    const closeDate = closeDateStr ? new Date(closeDateStr) : null
    const dueDate = dueDateStr ? new Date(dueDateStr) : null
    const observations = formData.get('observations') as string | null

    // Detect changes for activity log
    const oldValue = existingDeal.value !== null ? Number(existingDeal.value) : null
    const stageChanged = existingDeal.stageId !== stageId
    const valueChanged = oldValue !== value

    // isolamento: stageId, contactId and productId checked by chaveDeNegocioForaDaConta above
    await prisma.deal.update({
      where: { id: dealId },
      data: {
        title,
        value,
        contactId,
        productId,
        closeDate,
        dueDate,
        dueDateNote: dueDateNote || null,
        observations: observations || null,
      },
    })

    // Spec 014: a stage change in the edit dialog is a move like any other
    if (stageChanged) {
      await moverNegocio({ organizationId: user.organizationId, dealId, paraEtapaId: stageId, autor: { userId: user.id, tipo: 'USER' } })
    }
    // isolamento: deal checked above (existingDeal.organizationId)
    const updatedDeal = await prisma.deal.findUniqueOrThrow({ where: { id: dealId }, include: { stage: true } })

    // Log activities for tracked changes
    const activitiesToLog: { type: string; description: string }[] = []
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
export async function updateDealStatus(dealId: string, status: 'ACTIVE' | 'LOST' | 'WON', lostReason?: string) {
  try {
    const user = await getAuthenticatedUser()
    // Spec 014: won, lost and reopen are moves too (history + DEAL_WON / DEAL_LOST automations)
    const r = await moverNegocio({
      organizationId: user.organizationId,
      dealId,
      status,
      motivoPerda: status === 'LOST' ? lostReason : undefined,
      autor: { userId: user.id, tipo: 'USER' },
    })
    if (!r.ok) {
      return { success: false, error: 'Unauthorized' }
    }
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    logger.error({ err: error }, 'Failed to update deal status')
    return { success: false, error: 'Failed to update deal status' }
  }
}

export async function markDealWon(dealId: string) {
  return updateDealStatus(dealId, 'WON')
}

export async function moveDealToPipeline(dealId: string, newPipelineId: string, newStageId: string) {
  try {
    const user = await getAuthenticatedUser()
    // Spec 014: pipeline and stage are checked inside the organization by moverNegocio
    const r = await moverNegocio({
      organizationId: user.organizationId,
      dealId,
      paraPipelineId: newPipelineId,
      paraEtapaId: newStageId,
      autor: { userId: user.id, tipo: 'USER' },
    })
    if (!r.ok) {
      return { success: false, error: r.erro === 'NAO_ENCONTRADO' ? 'Unauthorized' : 'Stage must belong to the selected pipeline' }
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
