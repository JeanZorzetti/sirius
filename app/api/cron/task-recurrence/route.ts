import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

/**
 * Cron job: Task Recurrence Generator
 *
 * Runs daily. Finds all enabled TaskRecurrence records where nextRunAt <= now
 * and creates new task instances based on the original task's template.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    const dueRecurrences = await prisma.taskRecurrence.findMany({
      where: {
        enabled: true,
        nextRunAt: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        task: true,
      },
    })

    let created = 0
    let skipped = 0

    for (const rec of dueRecurrences) {
      if (
        rec.maxOccurrences != null &&
        rec.occurrencesCreated >= rec.maxOccurrences
      ) {
        // Disable recurrence — max reached
        await prisma.taskRecurrence.update({
          where: { id: rec.id },
          data: { enabled: false },
        })
        skipped++
        continue
      }

      const source = rec.task
      if (!source) continue

      // Calculate next due date from this run
      const newDueDate = rec.nextRunAt

      // Create a new task instance (copy of source)
      await prisma.task.create({
        data: {
          projectId: source.projectId,
          statusId: source.statusId,
          organizationId: source.organizationId,
          creatorId: source.creatorId,
          assigneeId: source.assigneeId,
          title: source.title,
          description: source.description,
          priority: source.priority,
          order: source.order,
          dueDate: newDueDate,
          startDate: null,
          estimatedMinutes: source.estimatedMinutes,
          dealId: source.dealId,
          contactId: source.contactId,
        },
      })

      // Calculate next run
      const nextRun = calculateNextRun(
        rec.nextRunAt ?? new Date(),
        rec.frequency,
        rec.interval,
        rec.daysOfWeek,
        rec.dayOfMonth
      )

      await prisma.taskRecurrence.update({
        where: { id: rec.id },
        data: {
          nextRunAt: nextRun,
          occurrencesCreated: { increment: 1 },
        },
      })

      created++
    }

    return NextResponse.json({
      success: true,
      processed: dueRecurrences.length,
      created,
      skipped,
    })
  } catch (err) {
    logger.error({ err }, 'Cron task-recurrence error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function calculateNextRun(
  base: Date,
  frequency: string,
  interval: number,
  daysOfWeek: number[],
  dayOfMonth: number | null
): Date {
  const next = new Date(base)
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + interval)
      break
    case 'WEEKLY':
      next.setDate(next.getDate() + 7 * interval)
      break
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14 * interval)
      break
    case 'MONTHLY':
      next.setMonth(next.getMonth() + interval)
      if (dayOfMonth) next.setDate(dayOfMonth)
      break
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3 * interval)
      break
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + interval)
      break
    default:
      next.setDate(next.getDate() + interval)
  }
  return next
}
