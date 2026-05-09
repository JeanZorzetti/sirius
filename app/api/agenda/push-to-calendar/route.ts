import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGoogleCalendarClient, logGoogleCalendarActivity } from '@/lib/integrations/google-calendar-client'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.USER_NO_ORG, 403, { req: request })
    }

    const body = await request.json()
    const { kind, id } = body as { kind: 'deal' | 'task'; id: string }

    if (!kind || !id) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const client = await getGoogleCalendarClient(user.organizationId)
    if (!client) {
      return NextResponse.json(
        { error: 'Google Calendar não conectado. Configure em Configurações > Integrações.' },
        { status: 422 }
      )
    }

    const TZ = 'America/Sao_Paulo'

    if (kind === 'deal') {
      const deal = await prisma.deal.findUnique({
        where: { id, organizationId: user.organizationId },
        include: { contact: true, pipeline: true, stage: true },
      })

      if (!deal || !deal.dueDate) {
        return NextResponse.json({ error: 'Deal não encontrado ou sem data' }, { status: 404 })
      }

      const start = new Date(deal.dueDate)
      const end = new Date(start)
      end.setHours(end.getHours() + 1)

      const existing = await prisma.calendarEvent.findFirst({
        where: { organizationId: user.organizationId, dealId: id, syncStatus: 'SYNCED' },
      })
      if (existing) {
        return NextResponse.json({ error: 'Este deal já foi exportado para o Google Calendar' }, { status: 409 })
      }

      const valueStr = deal.value
        ? `R$ ${Number(deal.value).toLocaleString('pt-BR')}`
        : 'N/A'

      const event = await client.createEvent({
        summary: `📋 ${deal.title}`,
        description: [
          `Pipeline: ${deal.pipeline.name}`,
          `Etapa: ${deal.stage.name}`,
          `Valor: ${valueStr}`,
          deal.contact ? `Contato: ${deal.contact.name}` : null,
          deal.contact?.phone ? `Telefone: ${deal.contact.phone}` : null,
          deal.contact?.email ? `Email: ${deal.contact.email}` : null,
        ].filter(Boolean).join('\n'),
        start: { dateTime: start.toISOString(), timeZone: TZ },
        end: { dateTime: end.toISOString(), timeZone: TZ },
        attendees: deal.contact?.email
          ? [{ email: deal.contact.email, displayName: deal.contact.name }]
          : undefined,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'email', minutes: 60 },
          ],
        },
      })

      await prisma.calendarEvent.create({
        data: {
          organizationId: user.organizationId,
          dealId: id,
          googleEventId: event.id,
          title: deal.title,
          startTime: start,
          endTime: end,
          syncStatus: 'SYNCED',
          lastSyncAt: new Date(),
        },
      })

      await logGoogleCalendarActivity(
        user.organizationId,
        'push_deal_from_agenda',
        'SUCCESS',
        { dealId: id },
        { googleEventId: event.id, htmlLink: event.htmlLink }
      )

      return NextResponse.json({ success: true, htmlLink: event.htmlLink })
    }

    // kind === 'task'
    const task = await prisma.task.findUnique({
      where: { id, organizationId: user.organizationId },
      include: { project: true, assignee: true },
    })

    if (!task || !task.dueDate) {
      return NextResponse.json({ error: 'Tarefa não encontrada ou sem data' }, { status: 404 })
    }

    const start = new Date(task.dueDate)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + 30)

    const PRIORITY_LABEL: Record<string, string> = {
      URGENT: '🔴 Urgente',
      HIGH: '🟠 Alta',
      MEDIUM: '🟡 Média',
      LOW: '🔵 Baixa',
      NONE: '',
    }

    const event = await client.createEvent({
      summary: `✅ ${task.title}`,
      description: [
        task.project ? `Projeto: ${task.project.name}` : null,
        task.assignee ? `Responsável: ${task.assignee.name}` : null,
        PRIORITY_LABEL[task.priority] ? `Prioridade: ${PRIORITY_LABEL[task.priority]}` : null,
      ].filter(Boolean).join('\n'),
      start: { dateTime: start.toISOString(), timeZone: TZ },
      end: { dateTime: end.toISOString(), timeZone: TZ },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 15 }],
      },
    })

    await logGoogleCalendarActivity(
      user.organizationId,
      'push_task_from_agenda',
      'SUCCESS',
      { taskId: id },
      { googleEventId: event.id, htmlLink: event.htmlLink }
    )

    return NextResponse.json({ success: true, htmlLink: event.htmlLink })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
