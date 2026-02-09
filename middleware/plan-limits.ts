/**
 * Middleware: Plan Limits
 * 
 * Verifica se a organização está dentro dos limites do plano
 * antes de permitir criar novos recursos (contacts, deals, pipelines, etc)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { PLAN_LIMITS } from '@/lib/entitlements'
import { SubscriptionTier } from '@prisma/client'
import logger from '@/lib/logger'

// Rotas que precisam verificar limites
const PROTECTED_ROUTES = [
  { path: '/api/contacts', method: 'POST', limit: 'maxContacts', resource: 'contatos' },
  { path: '/api/deals', method: 'POST', limit: 'maxDeals', resource: 'negócios' },
  { path: '/api/pipelines', method: 'POST', limit: 'maxPipelines', resource: 'pipelines' },
  { path: '/api/invites', method: 'POST', limit: 'maxUsers', resource: 'usuários' },
  { path: '/api/scraping/search', method: 'POST', limit: 'scrapingCreditsMonthly', resource: 'créditos de prospecção' },
]

export async function planLimitsMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const method = request.method

  // Verificar se é uma rota protegida
  const protectedRoute = PROTECTED_ROUTES.find(
    route => pathname.startsWith(route.path) && method === route.method
  )

  if (!protectedRoute) {
    return null // Continuar normalmente
  }

  try {
    // Verificar autenticação
    const token = await getToken({ req: request as any })
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar usuário e organização
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: {
        organizationId: true,
      },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Buscar organização com limites
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        tier: true,
        grandfatheredDealLimit: true,
      },
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Verificar limite específico
    const limitCheck = await checkResourceLimit(
      org.id,
      org.tier,
      protectedRoute.limit as keyof typeof PLAN_LIMITS[SubscriptionTier],
      protectedRoute.resource,
      org.grandfatheredDealLimit
    )

    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: 'Limite do plano atingido',
        code: 'PLAN_LIMIT_REACHED',
        resource: protectedRoute.resource,
        limit: limitCheck.limit,
        current: limitCheck.current,
        upgradeUrl: '/dashboard/billing/plans',
      }, { status: 403 })
    }

    // Adicionar headers com informações do limite
    const response = NextResponse.next()
    response.headers.set('X-Plan-Limit', String(limitCheck.limit))
    response.headers.set('X-Plan-Used', String(limitCheck.current))
    response.headers.set('X-Plan-Remaining', String(limitCheck.remaining))

    return response

  } catch (error: any) {
    logger.error({ error: error.message, path: pathname }, 'Plan limits middleware error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function checkResourceLimit(
  organizationId: string,
  tier: SubscriptionTier,
  limitKey: keyof typeof PLAN_LIMITS[SubscriptionTier],
  resource: string,
  grandfatheredLimit?: number | null
): Promise<{ allowed: boolean; limit: number | null; current: number; remaining: number }> {
  const limits = PLAN_LIMITS[tier]
  let limit: number | null = limits[limitKey] as number | null

  // Aplicar grandfathering para deals se existir
  if (limitKey === 'maxDeals' && grandfatheredLimit !== null && grandfatheredLimit !== undefined) {
    limit = grandfatheredLimit
  }

  // Ilimitado
  if (limit === null) {
    return { allowed: true, limit: null, current: 0, remaining: Infinity }
  }

  // Contar recursos atuais
  let current = 0

  switch (limitKey) {
    case 'maxContacts':
      current = await prisma.contact.count({
        where: { organizationId },
      })
      break

    case 'maxDeals':
      current = await prisma.deal.count({
        where: { 
          organizationId,
          archived: false,
        },
      })
      break

    case 'maxPipelines':
      current = await prisma.pipeline.count({
        where: { organizationId },
      })
      break

    case 'maxUsers':
      current = await prisma.user.count({
        where: { organizationId },
      })
      break

    case 'scrapingCreditsMonthly':
      const credits = await prisma.scrapingCredit.findUnique({
        where: { organizationId },
      })
      current = credits?.usedThisMonth || 0
      break

    default:
      current = 0
  }

  const remaining = limit - current
  return {
    allowed: remaining > 0,
    limit,
    current,
    remaining,
  }
}
