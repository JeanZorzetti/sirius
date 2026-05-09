import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const quickReplies = await prismaWa.quickReply.findMany({
      where: { organizationId: user.organizationId },
      orderBy: [{ category: 'asc' }, { shortcut: 'asc' }],
    })

    return NextResponse.json(quickReplies)
  } catch (error) {
    logger.error({ err: error }, 'Error fetching quick replies')
    return NextResponse.json(
      { error: 'Failed to fetch quick replies' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { shortcut, title, content, category } = body

    // Validação
    if (!shortcut || !title || !content) {
      return NextResponse.json(
        { error: 'Shortcut, title, and content are required' },
        { status: 400 }
      )
    }

    // Verificar se o shortcut já existe
    const existing = await prismaWa.quickReply.findUnique({
      where: {
        organizationId_shortcut: {
          organizationId: user.organizationId,
          shortcut,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Shortcut already exists' },
        { status: 409 }
      )
    }

    const quickReply = await prismaWa.quickReply.create({
      data: {
        shortcut,
        title,
        content,
        category: category || null,
        organizationId: user.organizationId,
      },
    })

    return NextResponse.json(quickReply, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Error creating quick reply')
    return NextResponse.json(
      { error: 'Failed to create quick reply' },
      { status: 500 }
    )
  }
}
