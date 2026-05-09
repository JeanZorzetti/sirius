import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const { id } = await params
    const body = await request.json()
    const { shortcut, title, content, category } = body

    // Verificar se o quick reply existe e pertence à organização
    const existing = await prismaWa.quickReply.findUnique({
      where: { id },
    })

    if (!existing || existing.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Quick reply not found' },
        { status: 404 }
      )
    }

    // Se o shortcut mudou, verificar se o novo não existe
    if (shortcut && shortcut !== existing.shortcut) {
      const duplicate = await prismaWa.quickReply.findUnique({
        where: {
          organizationId_shortcut: {
            organizationId: user.organizationId,
            shortcut,
          },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Shortcut already exists' },
          { status: 409 }
        )
      }
    }

    const quickReply = await prismaWa.quickReply.update({
      where: { id },
      data: {
        shortcut: shortcut || existing.shortcut,
        title: title || existing.title,
        content: content || existing.content,
        category: category !== undefined ? category : existing.category,
      },
    })

    return NextResponse.json(quickReply)
  } catch (error) {
    logger.error({ err: error }, 'Error updating quick reply')
    return NextResponse.json(
      { error: 'Failed to update quick reply' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const { id } = await params

    // Verificar se o quick reply existe e pertence à organização
    const existing = await prismaWa.quickReply.findUnique({
      where: { id },
    })

    if (!existing || existing.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Quick reply not found' },
        { status: 404 }
      )
    }

    await prismaWa.quickReply.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting quick reply')
    return NextResponse.json(
      { error: 'Failed to delete quick reply' },
      { status: 500 }
    )
  }
}
