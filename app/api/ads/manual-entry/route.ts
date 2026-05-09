/**
 * POST /api/ads/manual-entry
 *
 * ✅ FASE 17: Registro manual de gasto em ads para cálculo de CAC.
 *
 * Permite registrar gasto em qualquer plataforma de ads (Google, Facebook,
 * Instagram, TikTok, etc.) sem necessidade de integração via API.
 *
 * Body: {
 *   source: "google_ads" | "facebook_ads" | "manual"
 *   date: "YYYY-MM-DD"
 *   campaignName?: string
 *   spend: number          // R$
 *   impressions?: number
 *   clicks?: number
 *   conversions?: number
 *   notes?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404, { req: request })
    }

    const body = await request.json()
    const {
      source = 'manual',
      date,
      campaignName,
      campaignId,
      spend,
      impressions = 0,
      clicks = 0,
      conversions = 0,
      notes,
    } = body

    if (!date || spend === undefined || spend < 0) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: date (YYYY-MM-DD), spend (≥ 0)' },
        { status: 400 }
      )
    }

    // Calcular métricas derivadas
    const cpc = clicks > 0 ? spend / clicks : 0
    const cpa = conversions > 0 ? spend / conversions : 0

    const metric = await prisma.adsMetric.upsert({
      where: {
        organizationId_source_date_campaignId: {
          organizationId: user.organizationId,
          source,
          date: new Date(date),
          campaignId: campaignId ?? '',
        },
      },
      create: {
        organizationId: user.organizationId,
        source,
        date: new Date(date),
        campaignId: campaignId ?? '',
        campaignName: campaignName ?? source,
        spend,
        impressions,
        clicks,
        conversions,
        cpc,
        cpa,
        notes,
      },
      update: {
        campaignName: campaignName ?? source,
        spend,
        impressions,
        clicks,
        conversions,
        cpc,
        cpa,
        notes,
      },
    })

    logger.info({ orgId: user.organizationId, source, date, spend }, '[ADS] Manual entry saved')

    return NextResponse.json({ success: true, metric })
  } catch (error) {
    logger.error({ error }, '[ADS] Failed to save manual entry')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404, { req: request })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start') ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const endDate = searchParams.get('end') ?? new Date().toISOString().split('T')[0]

    const metrics = await prisma.adsMetric.findMany({
      where: {
        organizationId: user.organizationId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'desc' },
    })

    // Totais agregados
    const totals = {
      spend: metrics.reduce((s, m) => s + parseFloat(String(m.spend)), 0),
      impressions: metrics.reduce((s, m) => s + m.impressions, 0),
      clicks: metrics.reduce((s, m) => s + m.clicks, 0),
      conversions: metrics.reduce((s, m) => s + m.conversions, 0),
    }

    const cac = totals.conversions > 0 ? totals.spend / totals.conversions : 0

    return NextResponse.json({ metrics, totals, cac })
  } catch (error) {
    logger.error({ error }, '[ADS] Failed to fetch metrics')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}
