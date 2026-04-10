import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import logger from '@/lib/logger'

// PATCH /api/task-projects/[projectId]/statuses/[statusId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; statusId: string }> }
) {
  try {
    const { projectId, statusId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    // Verificar que o status pertence ao projeto da org
    const existing = await prisma.taskStatus.findFirst({
      where: { id: statusId, projectId, project: { organizationId: user.organizationId } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Status não encontrado' }, { status: 404 })
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
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
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
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const existing = await prisma.taskStatus.findFirst({
      where: { id: statusId, projectId, project: { organizationId: user.organizationId } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Status não encontrado' }, { status: 404 })
    }

    await prisma.taskStatus.delete({ where: { id: statusId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting status')
    return NextResponse.json({ error: 'Erro ao deletar status' }, { status: 500 })
  }
}
