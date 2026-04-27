import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSupportUser } from '@/lib/support-auth'
import { publishTicketEvent } from '@/lib/support-events'
import { sendEmail } from '@/lib/email'
import NewTicketStaffEmail from '@/lib/email-templates/support/new-ticket-staff'

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = RATE_LIMIT_MAP.get(userId)
  if (!entry || entry.resetAt < now) {
    RATE_LIMIT_MAP.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function GET(request: NextRequest) {
  const ctx = await getSupportUser()
  if (ctx instanceof NextResponse) return ctx

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const priority = searchParams.get('priority') || undefined
  const category = searchParams.get('category') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    organizationId: ctx.organizationId,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(category && { category }),
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ unreadByUser: 'desc' }, { lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ])

  return NextResponse.json({ tickets, total, page, limit })
}

export async function POST(request: NextRequest) {
  const ctx = await getSupportUser()
  if (ctx instanceof NextResponse) return ctx

  if (!checkRateLimit(ctx.userId)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Max 5 tickets per hour.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const priority = body.priority || 'NORMAL'
  const category = body.category || 'QUESTION'

  if (subject.length < 5 || subject.length > 200) {
    return NextResponse.json({ error: 'Subject must be 5–200 characters' }, { status: 400 })
  }
  if (description.length < 10 || description.length > 5000) {
    return NextResponse.json({ error: 'Description must be 10–5000 characters' }, { status: 400 })
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      description,
      priority: priority as never,
      category: category as never,
      organizationId: ctx.organizationId,
      createdByUserId: ctx.userId,
      status: 'OPEN',
      unreadByStaff: true,
      unreadByUser: false,
      lastMessageAt: new Date(),
      messages: {
        create: {
          authorType: 'USER',
          authorId: ctx.userId,
          content: description,
          isInternal: false,
        },
      },
    },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
  })

  publishTicketEvent('ticket:new', { ticket }, { orgId: ctx.organizationId, ticketId: ticket.id })

  sendEmail({
    to: 'suporte@roilabs.com.br',
    subject: `[Novo Ticket #${ticket.id.slice(0, 8)}] ${subject}`,
    react: NewTicketStaffEmail({ ticket, userEmail: ctx.email }),
  }).catch(console.error)

  return NextResponse.json({ ticket }, { status: 201 })
}
