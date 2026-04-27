import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaff } from '@/lib/support-auth'

export async function GET(request: NextRequest) {
  const ctx = await requireStaff()
  if (ctx instanceof NextResponse) return ctx

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const priority = searchParams.get('priority') || undefined
  const category = searchParams.get('category') || undefined
  const organizationId = searchParams.get('organizationId') || undefined
  const assignedStaffId = searchParams.get('assignedStaffId') || undefined
  const unassigned = searchParams.get('unassigned') === 'true'
  const search = searchParams.get('search') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '25'))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    ...(status && { status }),
    ...(priority && { priority }),
    ...(category && { category }),
    ...(organizationId && { organizationId }),
    ...(assignedStaffId && { assignedStaffId }),
    ...(unassigned && { assignedStaffId: null }),
    ...(search && {
      OR: [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [
        { unreadByStaff: 'desc' },
        { priority: 'desc' },
        { lastMessageAt: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ])

  return NextResponse.json({ tickets, total, page, limit })
}
