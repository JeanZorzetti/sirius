import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * GET /api/push/preferences
 * Get user's notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    // Get or create preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    })

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          newDealEnabled: true,
          dealWonEnabled: true,
          whatsappMessageEnabled: true,
          calendarReminderEnabled: true,
        },
      })
    }

    return NextResponse.json({
      preferences: {
        newDealEnabled: preferences.newDealEnabled,
        dealWonEnabled: preferences.dealWonEnabled,
        whatsappMessageEnabled: preferences.whatsappMessageEnabled,
        calendarReminderEnabled: preferences.calendarReminderEnabled,
        taskAssignedEnabled: preferences.taskAssignedEnabled,
        taskDueSoonEnabled: preferences.taskDueSoonEnabled,
        taskOverdueEnabled: preferences.taskOverdueEnabled,
        taskCompletedEnabled: preferences.taskCompletedEnabled,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Error fetching notification preferences')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}

/**
 * PATCH /api/push/preferences
 * Update user's notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    const body = await request.json()
    const {
      newDealEnabled,
      dealWonEnabled,
      whatsappMessageEnabled,
      calendarReminderEnabled,
      taskAssignedEnabled,
      taskDueSoonEnabled,
      taskOverdueEnabled,
      taskCompletedEnabled,
    } = body

    // Update or create preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {
        ...(typeof newDealEnabled === 'boolean' && { newDealEnabled }),
        ...(typeof dealWonEnabled === 'boolean' && { dealWonEnabled }),
        ...(typeof whatsappMessageEnabled === 'boolean' && { whatsappMessageEnabled }),
        ...(typeof calendarReminderEnabled === 'boolean' && { calendarReminderEnabled }),
        ...(typeof taskAssignedEnabled === 'boolean' && { taskAssignedEnabled }),
        ...(typeof taskDueSoonEnabled === 'boolean' && { taskDueSoonEnabled }),
        ...(typeof taskOverdueEnabled === 'boolean' && { taskOverdueEnabled }),
        ...(typeof taskCompletedEnabled === 'boolean' && { taskCompletedEnabled }),
      },
      create: {
        userId: session.user.id,
        newDealEnabled: newDealEnabled ?? true,
        dealWonEnabled: dealWonEnabled ?? true,
        whatsappMessageEnabled: whatsappMessageEnabled ?? true,
        calendarReminderEnabled: calendarReminderEnabled ?? true,
        taskAssignedEnabled: taskAssignedEnabled ?? true,
        taskDueSoonEnabled: taskDueSoonEnabled ?? true,
        taskOverdueEnabled: taskOverdueEnabled ?? true,
        taskCompletedEnabled: taskCompletedEnabled ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      preferences: {
        newDealEnabled: preferences.newDealEnabled,
        dealWonEnabled: preferences.dealWonEnabled,
        whatsappMessageEnabled: preferences.whatsappMessageEnabled,
        calendarReminderEnabled: preferences.calendarReminderEnabled,
        taskAssignedEnabled: preferences.taskAssignedEnabled,
        taskDueSoonEnabled: preferences.taskDueSoonEnabled,
        taskOverdueEnabled: preferences.taskOverdueEnabled,
        taskCompletedEnabled: preferences.taskCompletedEnabled,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Error updating notification preferences')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
