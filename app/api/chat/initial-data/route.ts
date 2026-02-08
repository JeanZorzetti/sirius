import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        name: true,
        organizationId: true,
        organization: {
          select: {
            maxInstances: true
          }
        }
      },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // 3. Fetch connections
    const connections = await prisma.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    })

    // 4. Fetch contacts with messages
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId: user.organizationId,
        whatsappMessages: {
          some: {}
        }
      },
      include: {
        whatsappMessages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
        tags: true,
        chatConversation: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            whatsappMessages: {
              where: {
                direction: 'INBOUND',
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // 5. Fetch unread counts
    const contactsWithUnread = await Promise.all(
      contacts.map(async (contact) => {
        const unreadCount = await prisma.whatsAppMessage.count({
          where: {
            contactId: contact.id,
            direction: 'INBOUND',
            isRead: false,
          }
        })
        return {
          ...contact,
          _count: {
            ...contact._count,
            unreadMessages: unreadCount,
          }
        }
      })
    )

    return NextResponse.json({
      connections,
      contacts: contactsWithUnread,
      userId: user.id,
      userName: user.name,
      organizationId: user.organizationId,
      maxInstances: user.organization?.maxInstances || 1
    })

  } catch (error: any) {
    logger.error({ error }, 'Error fetching chat initial data')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
