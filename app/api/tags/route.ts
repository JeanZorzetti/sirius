import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function GET() {
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

    const tags = await prisma.tag.findMany({
      where: {
        organizationId: user.organizationId,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(tags)
  } catch (error) {
    logger.error({ err: error }, 'Error fetching tags')
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
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

    const { name, color } = await req.json()

    if (!name || !color) {
      return NextResponse.json(
        { error: 'name and color are required' },
        { status: 400 }
      )
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color,
        organizationId: user.organizationId,
      },
    })

    return NextResponse.json(tag)
  } catch (error) {
    logger.error({ err: error }, 'Error creating tag')
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}
