import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSupportUser } from '@/lib/support-auth'
import { publishTicketEvent } from '@/lib/support-events'
import { sendEmail } from '@/lib/email'
import TicketResolvedEmail from '@/lib/email-templates/support/ticket-resolved'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSupportUser()
  if (ctx instanceof NextResponse) return ctx

  const { id } = await params

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
      assignedStaff: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
      messages: {
        where: ctx.isRoiLabsStaff ? {} : { isInternal: false },
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true, email: true, isRoiLabsStaff: true } },
          attachments: true,
        },
      },
      attachments: true,
    },
  })

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  if (!ctx.isRoiLabsStaff && ticket.organizationId !== ctx.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Mark as read by the viewer
  if (!ctx.isRoiLabsStaff && ticket.unreadByUser) {
    await prisma.supportTicket.update({ where: { id }, data: { unreadByUser: false } })
  } else if (ctx.isRoiLabsStaff && ticket.unreadByStaff) {
    await prisma.supportTicket.update({ where: { id }, data: { unreadByStaff: false } })
  }

  return NextResponse.json({ ticket })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSupportUser()
  if (ctx instanceof NextResponse) return ctx

  const { id } = await params

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: {
      id: true,
      organizationId: true,
      status: true,
      createdByUser: { select: { email: true, name: true } },
    },
  })

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  if (!ctx.isRoiLabsStaff && ticket.organizationId !== ctx.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}

  if (body.status) {
    if (!ctx.isRoiLabsStaff && body.status !== 'CLOSED') {
      return NextResponse.json({ error: 'Clients can only close tickets' }, { status: 403 })
    }
    updateData.status = body.status
    if (body.status === 'RESOLVED') updateData.resolvedAt = new Date()
    if (body.status === 'CLOSED') updateData.closedAt = new Date()
  }

  if (ctx.isRoiLabsStaff) {
    if (body.priority) updateData.priority = body.priority
    if (body.category) updateData.category = body.category
    if ('assignedStaffId' in body) updateData.assignedStaffId = body.assignedStaffId || null
  }

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: updateData,
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
      assignedStaff: { select: { id: true, name: true, email: true } },
    },
  })

  publishTicketEvent(
    'ticket:status',
    { ticketId: id, status: updated.status, changedBy: ctx.userId },
    { orgId: ticket.organizationId, ticketId: id }
  )

  if (body.status === 'RESOLVED') {
    sendEmail({
      to: ticket.createdByUser.email,
      subject: `Seu ticket foi resolvido`,
      react: TicketResolvedEmail({ ticket: updated, staffName: ctx.email }),
    }).catch(console.error)
  }

  return NextResponse.json({ ticket: updated })
}
