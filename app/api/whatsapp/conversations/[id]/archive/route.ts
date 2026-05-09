import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 })
    }

    const resolvedParams = await params
    const contactId = resolvedParams.id

    const { isArchived } = await request.json()

    // Update or create conversation
    const conversation = await prisma.chatConversation.upsert({
      where: {
        contactId,
      },
      create: {
        contactId,
        organizationId: user.organizationId,
        isArchived,
      },
      update: {
        isArchived,
      },
    })

    return NextResponse.json(conversation)
  } catch (error) {
    logger.error({ err: error }, 'Error archiving conversation')
    return NextResponse.json(
      { error: 'Failed to archive conversation' },
      { status: 500 }
    )
  }
}
