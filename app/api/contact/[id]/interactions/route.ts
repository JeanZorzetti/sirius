/**
 * API Route: /api/contact/[id]/interactions
 *
 * Retorna todas as interações de um contato (filtradas por tipo opcionalmente)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404, { req })
    }

    // 3. Verificar se o contato pertence à organização
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!contact) {
      return await apiError(ERR.CONTACT_NOT_FOUND, 404, { req })
    }

    // 4. Get all connections for this org (regardless of status)
    // Filtering by CONNECTED hides messages when the gateway marks the session
    // as temporarily disconnected (e.g. phone is also using WhatsApp).
    const orgConnections = await prismaWa.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true },
    })
    const orgConnectionIds = orgConnections.map(c => c.id)

    // 5. Buscar mensagens WhatsApp do contato com reações (Fase 4.2)
    const messages = await prismaWa.whatsAppMessage.findMany({
      where: {
        contactId: id,
        organizationId: user.organizationId,
        ...(orgConnectionIds.length > 0
          ? { connectionId: { in: orgConnectionIds } }
          : {}),
      },
      orderBy: {
        sentAt: 'asc',
      },
      select: {
        id: true,
        messageId: true,
        text: true,
        direction: true,
        sentAt: true,
        deliveredAt: true,
        readAt: true,
        status: true,
        mediaUrl: true,
        mediaType: true,
        replyToId: true,
        replyToText: true,
        reactions: true
      },
    })

    // Transform reactions to grouped format
    const messagesWithReactions = messages.map(msg => ({
      ...msg,
      reactions: msg.reactions.reduce((acc, reaction) => {
        const existing = acc.find(r => r.emoji === reaction.emoji)
        if (existing) {
          existing.count++
          if (reaction.userId === session.user.id) {
            existing.userReacted = true
          }
        } else {
          acc.push({
            emoji: reaction.emoji,
            count: 1,
            userReacted: reaction.userId === session.user.id
          })
        }
        return acc
      }, [] as { emoji: string; count: number; userReacted: boolean }[])
    }))

    return NextResponse.json(messagesWithReactions)
  } catch (error: any) {
    logger.error({ error }, 'Error fetching interactions')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req })
  }
}
