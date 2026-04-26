import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const q = request.nextUrl.searchParams.get('q')?.trim()
    if (!q || q.length < 2) {
      return NextResponse.json({ contacts: [], deals: [], conversations: [], tasks: [] })
    }

    const { organizationId } = user

    const [contacts, deals, conversations, tasks] = await Promise.all([
      prisma.contact.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, company: true },
        take: 5,
      }),

      prisma.deal.findMany({
        where: {
          organizationId,
          archived: false,
          title: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true,
          title: true,
          value: true,
          stage: { select: { name: true } },
        },
        take: 5,
      }),

      prisma.chatConversation.findMany({
        where: {
          organizationId,
          contact: {
            name: { contains: q, mode: 'insensitive' },
          },
        },
        select: {
          id: true,
          contact: { select: { name: true } },
        },
        take: 5,
      }),

      prisma.task.findMany({
        where: {
          archived: false,
          title: { contains: q, mode: 'insensitive' },
          project: { organizationId },
        },
        select: { id: true, title: true, dueDate: true },
        take: 5,
      }),
    ])

    return NextResponse.json({
      contacts,
      deals: deals.map((d) => ({
        id: d.id,
        title: d.title,
        value: d.value ? Number(d.value) : undefined,
        stageName: d.stage?.name,
      })),
      conversations: conversations.map((c) => ({
        id: c.id,
        contactName: c.contact.name,
      })),
      tasks,
    })
  } catch (error) {
    console.error('[search/global] error:', error)
    return NextResponse.json({ contacts: [], deals: [], conversations: [], tasks: [] })
  }
}
