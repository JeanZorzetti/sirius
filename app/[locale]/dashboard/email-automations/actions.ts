'use server'

import logger from '@/lib/logger'
import { EmailAutomationType, EmailStatus, Prisma } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getAuthenticatedUser() {
  const session = await getSession()
  if (!session || !session.user || !session.user.email) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true }
  })

  if (!user) throw new Error('User not found')
  return user
}

export async function getEmailAutomationSettings() {
  try {
    const user = await getAuthenticatedUser()

    // Get existing settings
    const settings = await prisma.emailAutomationSetting.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { type: 'asc' }
    })

    // Ensure all automation types have a setting (create defaults if missing)
    const allTypes: EmailAutomationType[] = [
      'WELCOME_EMAIL',
      'DEAL_CREATED',
      'DEAL_STAGE_CHANGED',
      'UPGRADE_NUDGE'
    ]

    const existingTypes = settings.map(s => s.type)
    const missingTypes = allTypes.filter(t => !existingTypes.includes(t))

    // Create missing automation settings with defaults
    if (missingTypes.length > 0) {
      await prisma.emailAutomationSetting.createMany({
        data: missingTypes.map(type => ({
          type,
          organizationId: user.organizationId,
          enabled: true,
          sendDelayMinutes: 0
        }))
      })

      // Re-fetch all settings
      return await prisma.emailAutomationSetting.findMany({
        where: { organizationId: user.organizationId },
        orderBy: { type: 'asc' }
      })
    }

    return settings
  } catch (error) {
    logger.error({ err: error }, 'Failed to get email automation settings')
    throw error
  }
}

export async function toggleAutomation(automationId: string, enabled: boolean) {
  try {
    const user = await getAuthenticatedUser()

    // Security: Ensure automation belongs to user's org
    const automation = await prisma.emailAutomationSetting.findUnique({
      where: { id: automationId }
    })

    if (!automation || automation.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.emailAutomationSetting.update({
      where: { id: automationId },
      data: { enabled }
    })

    return { success: true }
  } catch (error) {
    logger.error({ err: error }, 'Failed to toggle automation')
    return { success: false, error: 'Failed to toggle automation' }
  }
}

export async function updateAutomationTemplate(
  automationId: string,
  customSubject: string | null,
  customBody: string | null
) {
  try {
    const user = await getAuthenticatedUser()

    // Security: Ensure automation belongs to user's org
    const automation = await prisma.emailAutomationSetting.findUnique({
      where: { id: automationId }
    })

    if (!automation || automation.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.emailAutomationSetting.update({
      where: { id: automationId },
      data: {
        customSubject: customSubject || null,
        customBody: customBody || null
      }
    })

    return { success: true }
  } catch (error) {
    logger.error({ err: error }, 'Failed to update automation template')
    return { success: false, error: 'Failed to update template' }
  }
}

export async function updateAutomationConfig(
  automationId: string,
  config: {
    sendDelayMinutes?: number
    triggerConditions?: any
  }
) {
  try {
    const user = await getAuthenticatedUser()

    // Security: Ensure automation belongs to user's org
    const automation = await prisma.emailAutomationSetting.findUnique({
      where: { id: automationId }
    })

    if (!automation || automation.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.emailAutomationSetting.update({
      where: { id: automationId },
      data: {
        sendDelayMinutes: config.sendDelayMinutes,
        triggerConditions: config.triggerConditions
      }
    })

    return { success: true }
  } catch (error) {
    logger.error({ err: error }, 'Failed to update automation config')
    return { success: false, error: 'Failed to update config' }
  }
}

export async function getEmailHistory(limit: number = 50) {
  try {
    const user = await getAuthenticatedUser()

    const logs = await prisma.emailLog.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Calculate analytics
    const totalSent = logs.length
    const delivered = logs.filter(l => l.status === 'DELIVERED' || l.status === 'OPENED' || l.status === 'CLICKED').length
    const opened = logs.filter(l => l.status === 'OPENED' || l.status === 'CLICKED').length
    const clicked = logs.filter(l => l.status === 'CLICKED').length
    const failed = logs.filter(l => l.status === 'FAILED' || l.status === 'BOUNCED').length

    const analytics = {
      totalSent,
      deliveryRate: totalSent > 0 ? (delivered / totalSent * 100).toFixed(1) : '0',
      openRate: delivered > 0 ? (opened / delivered * 100).toFixed(1) : '0',
      clickRate: opened > 0 ? (clicked / opened * 100).toFixed(1) : '0',
      failureRate: totalSent > 0 ? (failed / totalSent * 100).toFixed(1) : '0'
    }

    return {
      success: true,
      logs,
      analytics,
      isPro: ['PRO', 'BUSINESS'].includes(user.organization.tier)
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to get email history')
    return { success: false, error: 'Failed to get email history', logs: [], analytics: null }
  }
}

export async function resetAutomationToDefault(automationId: string) {
  try {
    const user = await getAuthenticatedUser()

    // Security: Ensure automation belongs to user's org
    const automation = await prisma.emailAutomationSetting.findUnique({
      where: { id: automationId }
    })

    if (!automation || automation.organizationId !== user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.emailAutomationSetting.update({
      where: { id: automationId },
      data: {
        customSubject: null,
        customBody: null,
        sendDelayMinutes: 0,
        triggerConditions: Prisma.DbNull
      }
    })

    return { success: true }
  } catch (error) {
    logger.error({ err: error }, 'Failed to reset automation')
    return { success: false, error: 'Failed to reset automation' }
  }
}
