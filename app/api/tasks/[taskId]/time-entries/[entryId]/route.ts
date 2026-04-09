import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import logger from '@/lib/logger'

// PATCH /api/tasks/[taskId]/time-entries/[entryId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string; entryId: string }> }
) {
  try {
    const { taskId, entryId } = await params
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

    const existing = await prisma.timeEntry.findFirst({
      where: {
        id: entryId,
        taskId,
        task: { organizationId: user.organizationId },
      },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Only the entry owner can edit
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { description, startTime, endTime, durationMs, billable } = body

    const patch: any = {}
    if (description !== undefined) patch.description = description
    if (startTime !== undefined) patch.startTime = new Date(startTime)
    if (endTime !== undefined) patch.endTime = endTime ? new Date(endTime) : null
    if (durationMs !== undefined) patch.durationMs = durationMs
    if (billable !== undefined) patch.billable = billable

    // Auto-recompute duration if endTime changed and no explicit durationMs
    if (patch.endTime && durationMs === undefined) {
      const start = patch.startTime || existing.startTime
      patch.durationMs = patch.endTime.getTime() - new Date(start).getTime()
    }

    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: patch,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    logger.error({ err }, 'PATCH time-entries error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/tasks/[taskId]/time-entries/[entryId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string; entryId: string }> }
) {
  try {
    const { taskId, entryId } = await params
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

    const existing = await prisma.timeEntry.findFirst({
      where: {
        id: entryId,
        taskId,
        task: { organizationId: user.organizationId },
      },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.timeEntry.delete({ where: { id: entryId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error({ err }, 'DELETE time-entries error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
