/**
 * Daily Snapshot Cron Job
 *
 * Este endpoint deve ser chamado diariamente (ex: à meia-noite) para criar
 * snapshots de deals de todas as organizações.
 *
 * Configuração Vercel Cron (em vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/daily-snapshot",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 *
 * Ou teste manual:
 * GET /api/cron/daily-snapshot?token=SEU_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { createDailyDealSnapshotsForAllOrgs } from '@/lib/analytics-jobs'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutos (Vercel Pro)

export async function GET(request: NextRequest) {
  try {
    // Validar cron secret para prevenir chamadas não autorizadas
    const authHeader = request.headers.get('authorization')
    const urlToken = request.nextUrl.searchParams.get('token')
    const cronSecret = process.env.CRON_SECRET

    // Permitir:
    // 1. Authorization Bearer token (Vercel Cron)
    // 2. Query param ?token= (para testes manuais)
    const isValidToken =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronSecret && urlToken === cronSecret)

    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing CRON_SECRET' },
        { status: 401 }
      )
    }

    logger.info('[CRON] Starting daily deal snapshot job...')
    const startTime = Date.now()

    // Criar snapshots para todas as organizações
    const results = await createDailyDealSnapshotsForAllOrgs()

    const duration = Date.now() - startTime

    logger.info({
      total: results.total,
      successful: results.successful,
      failed: results.failed,
      duration: `${duration}ms`,
    }, '[CRON] Daily snapshot job completed')

    return NextResponse.json({
      success: true,
      message: 'Daily deal snapshots created successfully',
      stats: {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        duration: `${duration}ms`,
      },
      results: results.results,
    })
  } catch (error) {
    console.error('[CRON] Error in daily snapshot job:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST também aceito (para compatibilidade com diferentes cron services)
export async function POST(request: NextRequest) {
  return GET(request)
}
