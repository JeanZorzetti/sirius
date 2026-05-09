import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    // Check environment variables
    const envConfig = {
      EVOLUTION_API_URL: process.env.EVOLUTION_API_URL ? 'Configured' : 'Missing',
      EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY 
        ? `Configured (${process.env.EVOLUTION_API_KEY.substring(0, 10)}...)` 
        : 'Missing',
    }

    // Check connections
    const connections = await prismaWa.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        instanceName: true,
        status: true,
        phoneNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Check recent messages
    const recentMessages = await prismaWa.whatsAppMessage.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { sentAt: 'desc' },
      take: 5,
      select: {
        id: true,
        direction: true,
        text: true,
        sentAt: true,
        contactId: true,
      }
    })

    // Check recent webhook logs (from logger)
    logger.info({
      organizationId: user.organizationId,
      envConfig,
      connectionsCount: connections.length,
      recentMessagesCount: recentMessages.length,
    }, 'WhatsApp diagnostic check')

    return NextResponse.json({
      success: true,
      environment: envConfig,
      connections,
      recentMessages: recentMessages.map(m => ({
        ...m,
        text: m.text?.substring(0, 50) + '...',
        sentAt: m.sentAt.toISOString(),
      })),
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    logger.error({ error: error.message }, 'WhatsApp diagnostic error')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
