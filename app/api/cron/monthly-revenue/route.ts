/**
 * Monthly Revenue Snapshot Cron Job
 *
 * Este endpoint deve ser chamado mensalmente (ex: último dia do mês) para criar
 * snapshot de receita (MRR, ARR, churn, etc).
 *
 * Configuração Vercel Cron (em vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/monthly-revenue",
 *     "schedule": "0 0 28-31 * *"
 *   }]
 * }
 *
 * Ou teste manual:
 * GET /api/cron/monthly-revenue?token=SEU_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { createMonthlyRevenueSnapshot } from '@/lib/analytics-jobs'

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 minuto

export async function GET(request: NextRequest) {
  try {
    // Validar cron secret
    const authHeader = request.headers.get('authorization')
    const urlToken = request.nextUrl.searchParams.get('token')
    const cronSecret = process.env.CRON_SECRET

    const isValidToken =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronSecret && urlToken === cronSecret)

    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing CRON_SECRET' },
        { status: 401 }
      )
    }

    logger.info('[CRON] Starting monthly revenue snapshot job...')
    const startTime = Date.now()

    // Usar mês/ano atual ou permitir override via query params
    const now = new Date()
    const year = parseInt(request.nextUrl.searchParams.get('year') || '') || now.getFullYear()
    const month = parseInt(request.nextUrl.searchParams.get('month') || '') || now.getMonth() + 1

    // Criar snapshot de receita
    const snapshot = await createMonthlyRevenueSnapshot(year, month)

    const duration = Date.now() - startTime

    logger.info({
      year,
      month,
      mrr: snapshot.mrr.toString(),
      arr: snapshot.arr.toString(),
      duration: `${duration}ms`,
    }, '[CRON] Monthly revenue snapshot job completed')

    return NextResponse.json({
      success: true,
      message: 'Monthly revenue snapshot created successfully',
      snapshot: {
        ...snapshot,
        mrr: snapshot.mrr.toString(),
        arr: snapshot.arr.toString(),
        avgLtv: snapshot.avgLtv?.toString(),
        avgCac: snapshot.avgCac?.toString(),
        forecastNext30d: snapshot.forecastNext30d?.toString(),
        forecastNext60d: snapshot.forecastNext60d?.toString(),
        forecastNext90d: snapshot.forecastNext90d?.toString(),
      },
      stats: {
        duration: `${duration}ms`,
      },
    })
  } catch (error) {
    logger.error({ err: error }, '[CRON] Error in monthly revenue snapshot job')

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST também aceito
export async function POST(request: NextRequest) {
  return GET(request)
}
