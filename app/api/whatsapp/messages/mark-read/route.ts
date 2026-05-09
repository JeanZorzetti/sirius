import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { getSession } from '@/lib/auth'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function PUT(req: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const { contactId } = body

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
    }

    // Marcar todas as mensagens INBOUND deste contato como lidas
    await prismaWa.whatsAppMessage.updateMany({
      where: {
        contactId,
        organizationId: user.organizationId,
        direction: 'INBOUND',
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error marking messages as read')
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}
