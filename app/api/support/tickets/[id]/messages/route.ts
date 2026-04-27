import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSupportUser } from '@/lib/support-auth'
import { publishTicketEvent } from '@/lib/support-events'
import { sendEmail } from '@/lib/email'
import NewMessageUserEmail from '@/lib/email-templates/support/new-message-user'
import NewMessageStaffEmail from '@/lib/email-templates/support/new-message-staff'

const DEBOUNCE_MS = 5 * 60 * 1000 // 5 minutes

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSupportUser()
  if (ctx instanceof NextResponse) return ctx

  const { id } = await params

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      createdByUser: { select: { id: true, email: true, name: true } },
      assignedStaff: { select: { id: true, email: true, name: true } },
      organization: { select: { id: true, name: true } },
    },
  })

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  if (!ctx.isRoiLabsStaff && ticket.organizationId !== ctx.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (ticket.status === 'CLOSED') {
    return NextResponse.json({ error: 'Ticket is closed' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const content = typeof body.content === 'string' ? body.content.trim() : ''
  if (!content || content.length < 1 || content.length > 10000) {
    return NextResponse.json({ error: 'Content required (max 10000 chars)' }, { status: 400 })
  }

  const isInternal = ctx.isRoiLabsStaff ? Boolean(body.isInternal) : false
  const attachmentIds = Array.isArray(body.attachmentIds) ? body.attachmentIds as string[] : []

  const authorType = ctx.isRoiLabsStaff ? 'STAFF' : 'USER'

  // Track SLA: first response from staff
  const firstResponseAt =
    !ticket.firstResponseAt && ctx.isRoiLabsStaff ? new Date() : ticket.firstResponseAt

  const [message] = await prisma.$transaction([
    prisma.supportMessage.create({
      data: {
        ticketId: id,
        authorType,
        authorId: ctx.userId,
        content,
        isInternal,
        ...(attachmentIds.length > 0 && {
          attachments: {
            connect: attachmentIds.map((aid: string) => ({ id: aid })),
          },
        }),
      },
      include: {
        author: { select: { id: true, name: true, email: true, isRoiLabsStaff: true } },
        attachments: true,
      },
    }),
    prisma.supportTicket.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        unreadByUser: ctx.isRoiLabsStaff && !isInternal,
        unreadByStaff: !ctx.isRoiLabsStaff,
        firstResponseAt,
        status:
          ticket.status === 'OPEN' && ctx.isRoiLabsStaff
            ? 'IN_PROGRESS'
            : ticket.status === 'WAITING_USER' && !ctx.isRoiLabsStaff
            ? 'IN_PROGRESS'
            : ctx.isRoiLabsStaff
            ? 'WAITING_USER'
            : ticket.status,
      },
    }),
  ])

  publishTicketEvent(
    'ticket:message',
    { ticketId: id, message },
    { orgId: ticket.organizationId, ticketId: id }
  )

  // Email debounce: only send if no email sent in last 5 min
  const shouldEmail =
    !ticket.lastEmailSentAt ||
    new Date().getTime() - new Date(ticket.lastEmailSentAt).getTime() > DEBOUNCE_MS

  if (shouldEmail && !isInternal) {
    if (ctx.isRoiLabsStaff) {
      // Notify client
      sendEmail({
        to: ticket.createdByUser.email,
        subject: `Nova resposta no ticket: ${ticket.subject}`,
        react: NewMessageUserEmail({
          ticket,
          message: { content, authorName: ctx.email },
        }),
      }).catch(console.error)
    } else {
      // Notify staff (assigned or default)
      const staffEmail = ticket.assignedStaff?.email || 'suporte@roilabs.com.br'
      sendEmail({
        to: staffEmail,
        subject: `[Resposta] ${ticket.subject}`,
        react: NewMessageStaffEmail({
          ticket,
          message: { content, authorName: ticket.createdByUser.name || ticket.createdByUser.email },
        }),
      }).catch(console.error)
    }

    prisma.supportTicket.update({
      where: { id },
      data: { lastEmailSentAt: new Date() },
    }).catch(console.error)
  }

  return NextResponse.json({ message }, { status: 201 })
}
