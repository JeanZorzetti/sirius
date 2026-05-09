/**
 * API Route: /api/round-robin/config
 *
 * Gerencia configuração de round-robin da organização
 */

import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUseRoundRobin, getRoundRobinConfig, saveRoundRobinConfig } from '@/lib/round-robin'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export const dynamic = 'force-dynamic'

// GET - Obter configuração
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    // Verificar se pode usar round-robin
    const canUse = await canUseRoundRobin(user.organizationId)
    
    if (!canUse) {
      return NextResponse.json({
        enabled: false,
        userIds: [],
        assignToOwner: false,
        skipIfOffline: true,
        notifyUsers: true,
        canUse: false,
      })
    }

    const config = await getRoundRobinConfig(user.organizationId)
    
    return NextResponse.json({
      ...config,
      canUse: true,
    })

  } catch (error: any) {
    logger.error({ err: error }, 'Error fetching round-robin config')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Salvar configuração
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    // Verificar se pode usar round-robin
    const canUse = await canUseRoundRobin(user.organizationId)
    
    if (!canUse) {
      return NextResponse.json(
        { error: 'Round-robin disponível apenas no plano Business' },
        { status: 403 }
      )
    }

    const body = await req.json()
    
    await saveRoundRobinConfig(user.organizationId, {
      enabled: body.enabled,
      userIds: body.userIds,
      assignToOwner: body.assignToOwner,
      skipIfOffline: body.skipIfOffline,
      notifyUsers: body.notifyUsers,
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    logger.error({ err: error }, 'Error saving round-robin config')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
