/**
 * API Route: /api/entitlements
 *
 * Retorna os entitlements completos da organização atual.
 */

import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrganizationEntitlements } from '@/lib/feature-gates'

export async function GET() {
  try {
    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // 3. Get entitlements
    const entitlements = await getOrganizationEntitlements(user.organizationId)

    return NextResponse.json(entitlements)
  } catch (error) {
    logger.error({ err: error }, 'Error fetching entitlements')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
