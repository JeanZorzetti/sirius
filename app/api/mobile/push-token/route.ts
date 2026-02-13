import logger from '@/lib/logger'
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

    const { token, platform = 'WEB' } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })
    }

    await prisma.pushToken.upsert({
      where: { userId_token: { userId: user.id, token } },
      update: { platform, updatedAt: new Date() },
      create: {
        userId: user.id,
        organizationId: user.organizationId,
        token,
        platform,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, '[PUSH-TOKEN] Error')
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { token } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (user && token) {
      await prisma.pushToken.deleteMany({
        where: { userId: user.id, token },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, '[PUSH-TOKEN DELETE] Error')
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
