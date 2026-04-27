import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaff } from '@/lib/support-auth'
import { publishTicketEvent } from '@/lib/support-events'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireStaff()
  if (ctx instanceof NextResponse) return ctx

  const { id } = await params

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { id: true, organizationId: true, subject: true },
  })

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const staffId = body.staffId as string | null

  let staffName = 'Ninguém'
  if (staffId) {
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: { name: true, email: true, isRoiLabsStaff: true },
    })
    if (!staff?.isRoiLabsStaff) {
      return NextResponse.json({ error: 'Target user is not ROI Labs staff' }, { status: 400 })
    }
    staffName = staff.name || staff.email
  }

  const [updated] = await prisma.$transaction([
    prisma.supportTicket.update({
      where: { id },
      data: { assignedStaffId: staffId },
      include: {
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.supportMessage.create({
      data: {
        ticketId: id,
        authorType: 'SYSTEM',
        content: `Ticket atribuído a ${staffName}`,
        isInternal: true,
      },
    }),
  ])

  publishTicketEvent(
    'ticket:assigned',
    { ticketId: id, staffId, staffName },
    { orgId: ticket.organizationId, ticketId: id }
  )

  return NextResponse.json({ ticket: updated })
}
