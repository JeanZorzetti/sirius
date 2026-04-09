import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyTaskDueSoon, notifyTaskOverdue } from '@/lib/task-notifications'
import logger from '@/lib/logger'

/**
 * Cron job: Task Due Reminders
 *
 * Runs every 30min. Notifies assignees for:
 * - Tasks due within the next 2 hours (DUE_SOON) — only once per task/day
 * - Tasks that became overdue (OVERDUE) — only once per task
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Due soon (within next 2h) — skip if already notified today
    const dueSoonTasks = await prisma.task.findMany({
      where: {
        archived: false,
        completedAt: null,
        assigneeId: { not: null },
        dueDate: {
          gte: now,
          lte: twoHoursFromNow,
        },
      },
      select: {
        id: true,
        title: true,
        assigneeId: true,
        dueDate: true,
        organizationId: true,
      },
    })

    // Overdue (dueDate < now) — we'll filter by tasks not yet notified
    const overdueTasks = await prisma.task.findMany({
      where: {
        archived: false,
        completedAt: null,
        assigneeId: { not: null },
        dueDate: {
          lt: now,
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Only last 24h worth
        },
      },
      select: {
        id: true,
        title: true,
        assigneeId: true,
        dueDate: true,
        organizationId: true,
      },
    })

    let dueSoonSent = 0
    let overdueSent = 0

    // Cache preferences per user to avoid repeated DB calls
    const prefsCache = new Map<string, { taskDueSoonEnabled: boolean; taskOverdueEnabled: boolean }>()
    const getPrefs = async (userId: string) => {
      if (!prefsCache.has(userId)) {
        const p = await prisma.notificationPreference.findUnique({ where: { userId } })
        prefsCache.set(userId, {
          taskDueSoonEnabled: p?.taskDueSoonEnabled ?? true,
          taskOverdueEnabled: p?.taskOverdueEnabled ?? true,
        })
      }
      return prefsCache.get(userId)!
    }

    for (const task of dueSoonTasks) {
      if (!task.assigneeId) continue
      const prefs = await getPrefs(task.assigneeId)
      if (!prefs.taskDueSoonEnabled) continue

      // Check if already notified today for this task
      const existing = await prisma.notification.findFirst({
        where: {
          userId: task.assigneeId,
          type: 'TASK_DUE_SOON',
          metadata: { path: ['taskId'], equals: task.id },
          createdAt: { gte: startOfToday },
        },
      })
      if (existing) continue

      await notifyTaskDueSoon({
        assigneeId: task.assigneeId,
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.dueDate!,
        organizationId: task.organizationId,
      })
      dueSoonSent++
    }

    for (const task of overdueTasks) {
      if (!task.assigneeId) continue
      const prefs = await getPrefs(task.assigneeId)
      if (!prefs.taskOverdueEnabled) continue

      const existing = await prisma.notification.findFirst({
        where: {
          userId: task.assigneeId,
          type: 'TASK_OVERDUE',
          metadata: { path: ['taskId'], equals: task.id },
        },
      })
      if (existing) continue

      await notifyTaskOverdue({
        assigneeId: task.assigneeId,
        taskId: task.id,
        taskTitle: task.title,
        organizationId: task.organizationId,
      })
      overdueSent++
    }

    return NextResponse.json({
      success: true,
      dueSoon: { found: dueSoonTasks.length, sent: dueSoonSent },
      overdue: { found: overdueTasks.length, sent: overdueSent },
    })
  } catch (err) {
    logger.error({ err }, 'Cron task-due-reminders error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
