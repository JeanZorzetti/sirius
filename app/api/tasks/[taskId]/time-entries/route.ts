import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { requireFeature } from '@/lib/feature-gates'
import logger from '@/lib/logger'

// GET /api/tasks/[taskId]/time-entries
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
      select: { id: true, organizationId: true },
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

    const entries = await prisma.timeEntry.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'desc' },
    })

    return NextResponse.json(entries)
  } catch (err) {
    logger.error({ err }, 'GET /api/tasks/[taskId]/time-entries error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/tasks/[taskId]/time-entries
// Body: { description?, startTime?, endTime?, durationMs?, billable? }
export async function POST(
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
      select: { id: true, organizationId: true },
    })
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Feature gate: Time tracking requires PRO+
    try {
      await requireFeature(user.organizationId, 'timeTracking')
    } catch {
      return NextResponse.json(
        { error: 'Time tracking requer o plano PRO ou superior.' },
        { status: 403 }
      )
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId: user.organizationId },
      select: { id: true },
    })
    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { description, startTime, endTime, durationMs, billable } = body

    const start = startTime ? new Date(startTime) : new Date()
    const end = endTime ? new Date(endTime) : null
    const computedDuration =
      durationMs ?? (end ? end.getTime() - start.getTime() : 0)

    const entry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId: user.id,
        description: description || null,
        startTime: start,
        endTime: end,
        durationMs: computedDuration,
        billable: billable ?? false,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (err) {
    logger.error({ err }, 'POST /api/tasks/[taskId]/time-entries error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
