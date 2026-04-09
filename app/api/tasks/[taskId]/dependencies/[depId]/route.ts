import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import logger from '@/lib/logger'

// DELETE /api/tasks/[taskId]/dependencies/[depId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string; depId: string }> }
) {
  try {
    const { taskId, depId } = await params
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

    const dep = await prisma.taskDependency.findFirst({
      where: {
        id: depId,
        OR: [{ fromTaskId: taskId }, { toTaskId: taskId }],
        fromTask: { organizationId: user.organizationId },
      },
    })
    if (!dep) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.taskDependency.delete({ where: { id: depId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error({ err }, 'DELETE dependencies error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
