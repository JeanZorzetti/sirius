import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
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
    logger.error({ err: error }, '[CHECKIN] Error')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}

export async function GET(request: NextRequest) {
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
    logger.error({ err: error }, '[CHECKIN GET] Error')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}
