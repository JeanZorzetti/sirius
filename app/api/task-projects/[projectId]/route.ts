import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// GET /api/task-projects/[projectId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
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

    const project = await prisma.taskProject.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
      include: {
        statuses: { orderBy: { order: 'asc' } },
        labels: true,
        _count: { select: { tasks: true } },
      },
    })

    if (!project) {
      return await apiError(ERR.NOT_FOUND, 404)
    }

    return NextResponse.json(project)
  } catch (error) {
    logger.error({ err: error }, 'Error fetching task project')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

// PATCH /api/task-projects/[projectId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true, orgRole: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    const existing = await prisma.taskProject.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
    })

    if (!existing) {
      return await apiError(ERR.NOT_FOUND, 404)
    }

    // Only OWNER and GERENTE can change allowedRoles
    const body = await request.json()
    const { name, description, color, icon, archived, allowedRoles } = body

    const canSetRoles = user.orgRole === 'OWNER' || user.orgRole === 'GERENTE'

    const project = await prisma.taskProject.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(archived !== undefined && { archived }),
        ...(allowedRoles !== undefined && canSetRoles && { allowedRoles }),
      },
      include: {
        statuses: { orderBy: { order: 'asc' } },
        _count: { select: { tasks: true } },
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    logger.error({ err: error }, 'Error updating task project')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

// DELETE /api/task-projects/[projectId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
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

    const existing = await prisma.taskProject.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
    })

    if (!existing) {
      return await apiError(ERR.NOT_FOUND, 404)
    }

    await prisma.taskProject.delete({ where: { id: projectId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting task project')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
