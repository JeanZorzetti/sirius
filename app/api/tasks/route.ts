import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { carregarAcesso, escopoTarefa } from '@/lib/visibilidade'
import { chaveDeTarefaForaDaConta } from '@/lib/tasks/chaves'
import { checkTaskLimit } from '@/lib/entitlements'
import { notifyTaskAssigned } from '@/lib/task-notifications'
import { triggerTaskEvent } from '@/lib/tasks/realtime'
import { executeTaskAutomations } from '@/lib/automations/task-engine'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// GET /api/tasks - Listar tarefas com filtros
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const acesso = await carregarAcesso({ email: session.user.email })
    if (!acesso) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }
    const user = { id: acesso.userId }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const statusId = searchParams.get('statusId')
    const assigneeId = searchParams.get('assigneeId')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const myTasks = searchParams.get('myTasks') === 'true'
    const parentId = searchParams.get('parentId')
    const dealId = searchParams.get('dealId')
    const contactId = searchParams.get('contactId')

    // Organization and visibility (admins-only / private tasks) come from the one shared rule
    const where: any = {
      ...escopoTarefa(acesso),
      archived: false,
    }

    if (projectId) where.projectId = projectId
    if (statusId) where.statusId = statusId
    if (assigneeId) where.assigneeId = assigneeId
    if (priority) where.priority = priority
    if (myTasks) where.assigneeId = user.id
    if (parentId) where.parentId = parentId
    if (parentId === 'null') where.parentId = null // Apenas top-level
    if (dealId) where.dealId = dealId
    if (contactId) where.contactId = contactId
    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        status: true,
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        labels: true,
        project: { select: { id: true, name: true, color: true } },
        _count: {
          select: {
            subtasks: true,
            comments: true,
            checklists: true,
          },
        },
      },
      orderBy: [{ status: { order: 'asc' } }, { order: 'asc' }],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    logger.error({ err: error }, 'Error listing tasks')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

// POST /api/tasks - Criar tarefa
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const acesso = await carregarAcesso({ email: session.user.email })
    if (!acesso) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }
    const user = { id: acesso.userId, name: acesso.nome, organizationId: acesso.organizationId }

    // Verificar limite
    try {
      await checkTaskLimit(user.organizationId)
    } catch (err: any) {
      if (err.name === 'LimitReachedError') {
        return NextResponse.json(
          { error: 'Limite de tarefas atingido. Faça upgrade do plano.' },
          { status: 403 }
        )
      }
      throw err
    }

    const body = await request.json()
    const {
      title, description, priority, projectId, statusId,
      assigneeId, dueDate, startDate, estimatedMinutes,
      parentId, dealId, contactId, labelIds, visibility,
    } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

    if (!projectId || !statusId) {
      return NextResponse.json({ error: 'Projeto e status são obrigatórios' }, { status: 400 })
    }

    // The project must be in this organization, and everything else the task points to too
    const projeto = await prisma.taskProject.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
      select: { id: true },
    })
    const foraDaConta = projeto
      ? await chaveDeTarefaForaDaConta(user.organizationId, projeto.id, { statusId, assigneeId, dealId, contactId, parentId, labelIds })
      : 'projectId'
    if (foraDaConta) {
      return NextResponse.json({ error: `${foraDaConta} não encontrado` }, { status: 404 })
    }

    // Obter o maior order para a coluna
    // isolamento: project checked by the scoped lookup and statusId by chaveDeTarefaForaDaConta above
    const maxOrder = await prisma.task.aggregate({
      where: { projectId, statusId },
      _max: { order: true },
    })

    // isolamento: project, status, assignee, parent, deal, contact and labels checked by chaveDeTarefaForaDaConta above
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description || null,
        priority: priority || 'NONE',
        order: (maxOrder._max.order ?? -1) + 1,
        projectId,
        statusId,
        assigneeId: assigneeId || null,
        creatorId: user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        estimatedMinutes: estimatedMinutes || null,
        parentId: parentId || null,
        dealId: dealId || null,
        contactId: contactId || null,
        visibility: visibility || 'PUBLIC',
        organizationId: user.organizationId,
        ...(labelIds?.length && {
          labels: { connect: labelIds.map((id: string) => ({ id })) },
        }),
      },
      include: {
        status: true,
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        labels: true,
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { subtasks: true, comments: true, checklists: true } },
      },
    })

    // Criar activity log
    await prisma.taskActivity.create({
      data: {
        type: 'CREATED',
        description: `${user.name || user.id} criou a tarefa`,
        taskId: task.id,
        userId: user.id,
      },
    })

    // Notificar assignee
    if (assigneeId && assigneeId !== user.id) {
      notifyTaskAssigned({
        taskId: task.id,
        taskTitle: task.title,
        assigneeId,
        assignerName: user.name || 'Alguém',
        organizationId: user.organizationId,
        projectId,
      }).catch((err) => logger.error({ err }, 'Error notifying task assigned'))
    }

    // Real-time event
    triggerTaskEvent(user.organizationId, 'task:created', {
      taskId: task.id,
      projectId: task.projectId,
      statusId: task.statusId,
      title: task.title,
    }).catch(() => {})

    // Task automations
    executeTaskAutomations(task.id, 'TASK_CREATED', {
      userId: user.id,
      organizationId: user.organizationId,
    }).catch((err) => logger.error({ err }, 'Task automation failed'))

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Error creating task')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
