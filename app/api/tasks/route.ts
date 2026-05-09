import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { checkTaskLimit } from '@/lib/feature-gates'
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true, orgRole: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

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

    const where: any = {
      organizationId: user.organizationId,
      archived: false,
    }

    // Filtro de visibilidade:
    // ADMINS_ONLY: só OWNER vê (MEMBER não vê)
    // PRIVATE: só criador e assignee veem (se não for OWNER)
    if (user.orgRole === 'MEMBER') {
      where.AND = [
        {
          OR: [
            { visibility: 'PUBLIC' },
            // PRIVATE: é o criador ou assignee
            { AND: [{ visibility: 'PRIVATE' }, { OR: [{ assigneeId: user.id }, { creatorId: user.id }] }] },
            // ADMINS_ONLY: não visível para MEMBER
          ],
        },
        // MEMBER só vê tasks atribuídas ou criadas por ele em PUBLIC
        // (mantém comportamento anterior para tarefas PUBLIC)
      ]
    } else {
      // OWNER/ADMIN: bloco ADMINS_ONLY visível normalmente
      // Sem filtro extra — vê tudo
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

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

    // Obter o maior order para a coluna
    const maxOrder = await prisma.task.aggregate({
      where: { projectId, statusId },
      _max: { order: true },
    })

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
