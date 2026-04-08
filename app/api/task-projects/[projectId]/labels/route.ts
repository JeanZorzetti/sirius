import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import logger from '@/lib/logger'

// GET /api/task-projects/[projectId]/labels
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const labels = await prisma.taskLabel.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(labels)
  } catch (error) {
    logger.error({ err: error }, 'Error listing labels')
    return NextResponse.json({ error: 'Erro ao listar labels' }, { status: 500 })
  }
}

// POST /api/task-projects/[projectId]/labels
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

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
    return NextResponse.json({ error: 'Erro ao criar label' }, { status: 500 })
  }
}
