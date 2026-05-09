import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// PATCH /api/task-projects/[projectId]/statuses/[statusId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; statusId: string }> }
) {
  try {
    const { projectId, statusId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    // Verificar que o status pertence ao projeto da org
    const existing = await prisma.taskStatus.findFirst({
      where: { id: statusId, projectId, project: { organizationId: user.organizationId } },
    })

    if (!existing) {
      return await apiError(ERR.NOT_FOUND, 404)
    }

    const body = await request.json()
    const { name, color, type } = body

    const status = await prisma.taskStatus.update({
      where: { id: statusId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
        ...(type !== undefined && { type }),
      },
    })

    return NextResponse.json(status)
  } catch (error) {
    logger.error({ err: error }, 'Error updating status')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

// DELETE /api/task-projects/[projectId]/statuses/[statusId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; statusId: string }> }
) {
  try {
    const { projectId, statusId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    const existing = await prisma.taskStatus.findFirst({
      where: { id: statusId, projectId, project: { organizationId: user.organizationId } },
    })

    if (!existing) {
      return await apiError(ERR.NOT_FOUND, 404)
    }

    await prisma.taskStatus.delete({ where: { id: statusId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting status')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
