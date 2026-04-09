import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { requireFeature } from '@/lib/feature-gates'
import logger from '@/lib/logger'

// GET /api/tasks/[taskId]/recurrence
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId: user.organizationId },
      select: { id: true },
    })
    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const recurrence = await prisma.taskRecurrence.findUnique({
      where: { taskId },
    })

    return NextResponse.json(recurrence || null)
  } catch (err) {
    logger.error({ err }, 'GET recurrence error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PUT /api/tasks/[taskId]/recurrence
// Body: { frequency, interval, daysOfWeek?, dayOfMonth?, endDate?, maxOccurrences?, enabled? }
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      await requireFeature(user.organizationId, 'recurringTasks')
    } catch {
      return NextResponse.json(
        { error: 'Tarefas recorrentes requerem o plano PRO ou superior.' },
        { status: 403 }
      )
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId: user.organizationId },
      select: { id: true, dueDate: true },
    })
    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      frequency,
      interval = 1,
      daysOfWeek = [],
      dayOfMonth,
      endDate,
      maxOccurrences,
      enabled = true,
    } = body

    if (!frequency) {
      return NextResponse.json({ error: 'frequency is required' }, { status: 400 })
    }

    const nextRunAt = calculateNextRun(new Date(), frequency, interval, daysOfWeek, dayOfMonth)

    const recurrence = await prisma.taskRecurrence.upsert({
      where: { taskId },
      create: {
        taskId,
        frequency,
        interval,
        daysOfWeek,
        dayOfMonth: dayOfMonth || null,
        endDate: endDate ? new Date(endDate) : null,
        maxOccurrences: maxOccurrences || null,
        enabled,
        nextRunAt,
      },
      update: {
        frequency,
        interval,
        daysOfWeek,
        dayOfMonth: dayOfMonth || null,
        endDate: endDate ? new Date(endDate) : null,
        maxOccurrences: maxOccurrences || null,
        enabled,
        nextRunAt,
      },
    })

    return NextResponse.json(recurrence)
  } catch (err) {
    logger.error({ err }, 'PUT recurrence error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/tasks/[taskId]/recurrence
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId: user.organizationId },
      select: { id: true },
    })
    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.taskRecurrence.deleteMany({ where: { taskId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error({ err }, 'DELETE recurrence error')
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
