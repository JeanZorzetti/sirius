import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user) {
      return await apiError(ERR.USER_NOT_FOUND, 404)
    }

    const { id } = await params
    const { tagId } = await req.json()

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 })
    }

    // Verificar se o contato pertence à organização
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    // Verificar se a tag pertence à organização
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        organizationId: user.organizationId,
      },
    })

    if (!tag) {
      return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 })
    }

    // Adicionar tag ao contato
    await prisma.contact.update({
      where: { id },
      data: {
        tags: {
          connect: { id: tagId },
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error adding tag to contact')
    return NextResponse.json(
      { error: 'Failed to add tag' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user) {
      return await apiError(ERR.USER_NOT_FOUND, 404)
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const tagId = searchParams.get('tagId')

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 })
    }

    // Verificar se o contato pertence à organização
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    // Remover tag do contato
    await prisma.contact.update({
      where: { id },
      data: {
        tags: {
          disconnect: { id: tagId },
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error removing tag from contact')
    return NextResponse.json(
      { error: 'Failed to remove tag' },
      { status: 500 }
    )
  }
}
