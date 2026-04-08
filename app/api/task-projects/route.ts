import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { checkTaskProjectLimit } from '@/lib/feature-gates'
import logger from '@/lib/logger'

// GET /api/task-projects - Listar projetos de tarefas
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const projects = await prisma.taskProject.findMany({
      where: { organizationId: user.organizationId, archived: false },
      include: {
        statuses: { orderBy: { order: 'asc' } },
        _count: { select: { tasks: true } },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(projects)
  } catch (error) {
    logger.error({ err: error }, 'Error listing task projects')
    return NextResponse.json({ error: 'Erro ao listar projetos' }, { status: 500 })
  }
}

// POST /api/task-projects - Criar projeto de tarefas
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    // Verificar limite de projetos
    try {
      await checkTaskProjectLimit(user.organizationId)
    } catch (err: any) {
      if (err.name === 'LimitReachedError') {
        return NextResponse.json(
          { error: 'Limite de projetos de tarefas atingido. Faça upgrade do plano.' },
          { status: 403 }
        )
      }
      throw err
    }

    const body = await request.json()
    const { name, description, color, icon } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Criar projeto com statuses padrão
    const project = await prisma.taskProject.create({
      data: {
        name: name.trim(),
        description: description || null,
        color: color || '#6366f1',
        icon: icon || null,
        organizationId: user.organizationId,
        statuses: {
          create: [
            { name: 'A Fazer', color: '#94a3b8', type: 'OPEN', order: 0, isDefault: true },
            { name: 'Em Progresso', color: '#3b82f6', type: 'IN_PROGRESS', order: 1 },
            { name: 'Concluído', color: '#22c55e', type: 'DONE', order: 2 },
          ],
        },
      },
      include: {
        statuses: { orderBy: { order: 'asc' } },
        _count: { select: { tasks: true } },
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Error creating task project')
    return NextResponse.json({ error: 'Erro ao criar projeto' }, { status: 500 })
  }
}
