import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, organizationId: true },
    })

    if (!user) {
      return await apiError(ERR.USER_NOT_FOUND, 404, { req })
    }

    const { assignedUserId } = await req.json()
    const { id: contactId } = await params

    // Validate contact belongs to org
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId: user.organizationId,
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    // Validate assigned user (if provided)
    if (assignedUserId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: assignedUserId,
          organizationId: user.organizationId,
        },
      })

      if (!assignedUser) {
        return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })
      }
    }

    // Get or create conversation
    let conversation = await prisma.chatConversation.findUnique({
      where: { contactId },
    })

    const now = new Date()

    if (conversation) {
      // Update existing
      conversation = await prisma.chatConversation.update({
        where: { id: conversation.id },
        data: {
          assignedUserId: assignedUserId || null,
          updatedAt: now,
        },
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    } else {
      // Create new
      conversation = await prisma.chatConversation.create({
        data: {
          contactId,
          organizationId: user.organizationId,
          assignedUserId: assignedUserId || null,
          status: 'OPEN',
          priority: 'NORMAL',
        },
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    }

    // Create system message for assignment change
    const previousAssignment = await prisma.chatConversation.findUnique({
      where: { contactId },
      include: {
        assignedUser: { select: { name: true, email: true } },
      },
    })

    let systemMessage = ''
    if (!assignedUserId) {
      systemMessage = `Atribuição removida`
    } else if (!previousAssignment?.assignedUserId) {
      const newUser = await prisma.user.findUnique({
        where: { id: assignedUserId },
        select: { name: true, email: true },
      })
      systemMessage = `Conversa atribuída a ${newUser?.name || newUser?.email}`
    } else {
      const oldUser = previousAssignment.assignedUser
      const newUser = await prisma.user.findUnique({
        where: { id: assignedUserId },
        select: { name: true, email: true },
      })
      systemMessage = `Conversa transferida de ${oldUser?.name || oldUser?.email} para ${newUser?.name || newUser?.email}`
    }

    return NextResponse.json({
      ...conversation,
      systemMessage,
    })
  } catch (error) {
    logger.error({ err: error }, 'Error assigning agent')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req })
  }
}
