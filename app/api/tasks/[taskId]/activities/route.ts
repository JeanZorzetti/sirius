import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { carregarAcesso, escopoTarefa } from '@/lib/visibilidade'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// GET /api/tasks/[taskId]/activities
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }
    const acesso = await carregarAcesso({ email: session.user.email })
    if (!acesso) return await apiError(ERR.USER_NOT_FOUND, 404)

    // The task must be in the caller's organization and visible to them
    const task = await prisma.task.findFirst({ where: { id: taskId, ...escopoTarefa(acesso) }, select: { id: true } })
    if (!task) return await apiError(ERR.NOT_FOUND, 404)

    const activities = await prisma.taskActivity.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(activities)
  } catch (error) {
    logger.error({ err: error }, 'Error listing activities')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
