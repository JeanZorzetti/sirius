import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * POST /api/whatsapp/messages/[id]/reactions
 * Add or toggle a reaction to a message
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const { id: messageId } = await context.params
    const { emoji } = await req.json()

    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 })
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    // Verify message exists and user has access
    const message = await prismaWa.whatsAppMessage.findFirst({
      where: {
        id: messageId,
        organizationId: user.organizationId,
      },
      include: {
        reactions: true
      }
    })

    if (!message) {
      return await apiError(ERR.MESSAGE_NOT_FOUND, 404)
    }

    // Check if user already reacted with this emoji
    const existingReaction = await prismaWa.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: session.user.id,
          emoji
        }
      }
    })

    if (existingReaction) {
      // Remove reaction (toggle off)
      await prismaWa.messageReaction.delete({
        where: { id: existingReaction.id }
      })

      return NextResponse.json({ action: 'removed', emoji })
    } else {
      // Add reaction
      const reaction = await prismaWa.messageReaction.create({
        data: {
          emoji,
          messageId,
          userId: session.user.id
        }
      })

      return NextResponse.json({ action: 'added', emoji, reaction })
    }
  } catch (error) {
    logger.error({ err: error }, 'Error handling reaction')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/whatsapp/messages/[id]/reactions
 * Get all reactions for a message
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const { id: messageId } = await context.params

    // Verify message exists and user has access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    const message = await prismaWa.whatsAppMessage.findFirst({
      where: {
        id: messageId,
        organizationId: user.organizationId,
      }
    })

    if (!message) {
      return await apiError(ERR.MESSAGE_NOT_FOUND, 404)
    }

    // Get reactions from WA DB
    const reactions = await prismaWa.messageReaction.findMany({
      where: { messageId },
    })

    // Enrich with user names from CRM DB
    const userIds = [...new Set(reactions.map(r => r.userId))]
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : []
    const userMap = new Map(users.map(u => [u.id, u.name || 'Usuário']))

    // Group by emoji and count
    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          userReacted: false,
          users: []
        }
      }
      acc[reaction.emoji].count++
      acc[reaction.emoji].users.push(userMap.get(reaction.userId) || 'Usuário')
      if (reaction.userId === session.user.id) {
        acc[reaction.emoji].userReacted = true
      }
      return acc
    }, {} as Record<string, { emoji: string; count: number; userReacted: boolean; users: string[] }>)

    return NextResponse.json(Object.values(grouped))
  } catch (error) {
    logger.error({ err: error }, 'Error fetching reactions')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
