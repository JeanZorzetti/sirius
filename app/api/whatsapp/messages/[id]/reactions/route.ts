import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Verify message exists and user has access
    const message = await prisma.whatsAppMessage.findFirst({
      where: {
        id: messageId,
        organizationId: user.organizationId,
      },
      include: {
        reactions: true
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check if user already reacted with this emoji
    const existingReaction = await prisma.messageReaction.findUnique({
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
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id }
      })

      return NextResponse.json({ action: 'removed', emoji })
    } else {
      // Add reaction
      const reaction = await prisma.messageReaction.create({
        data: {
          emoji,
          messageId,
          userId: session.user.id
        }
      })

      return NextResponse.json({ action: 'added', emoji, reaction })
    }
  } catch (error) {
    console.error('Error handling reaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: messageId } = await context.params

    // Verify message exists and user has access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const message = await prisma.whatsAppMessage.findFirst({
      where: {
        id: messageId,
        organizationId: user.organizationId,
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Get reactions grouped by emoji
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    })

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
      acc[reaction.emoji].users.push(reaction.user.name || 'Usuário')
      if (reaction.userId === session.user.id) {
        acc[reaction.emoji].userReacted = true
      }
      return acc
    }, {} as Record<string, { emoji: string; count: number; userReacted: boolean; users: string[] }>)

    return NextResponse.json(Object.values(grouped))
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
