import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { projetoDoPedido } from '@/lib/visibilidade'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// GET /api/task-projects/[projectId]/labels
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const pedido = await projetoDoPedido((await params).projectId)
    if (pedido instanceof Response) return pedido
    const { projectId } = pedido

    const labels = await prisma.taskLabel.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(labels)
  } catch (error) {
    logger.error({ err: error }, 'Error listing labels')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

// POST /api/task-projects/[projectId]/labels
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const pedido = await projetoDoPedido((await params).projectId)
    if (pedido instanceof Response) return pedido
    const { projectId } = pedido

    const body = await request.json()
    const { name, color } = body

    if (!name || !color) {
      return NextResponse.json({ error: 'Nome e cor são obrigatórios' }, { status: 400 })
    }

    const label = await prisma.taskLabel.create({
      data: {
        name: name.trim(),
        color,
        projectId,
      },
    })

    return NextResponse.json(label, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Error creating label')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
