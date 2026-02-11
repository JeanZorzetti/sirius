import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Usuário sem organização' }, { status: 404 })
    }

    const { latitude, longitude, contactId, notes } = await request.json()

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Latitude e longitude são obrigatórios' }, { status: 400 })
    }

    const visitLog = await prisma.visitLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        contactId: contactId || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        notes: notes || null,
        visitedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, visitLogId: visitLog.id })
  } catch (error) {
    console.error('[CHECKIN] Error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'Usuário sem organização' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '50')

    const visits = await prisma.visitLog.findMany({
      where: { organizationId: user.organizationId },
      include: {
        contact: { select: { id: true, name: true, company: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { visitedAt: 'desc' },
      take: Math.min(limit, 200),
    })

    return NextResponse.json({ visits })
  } catch (error) {
    console.error('[CHECKIN GET] Error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
