/**
 * Deal Idle Automations Cron Job
 *
 * Fires DEAL_IDLE automations for deals that haven't been updated
 * in N days, where N is configured per automation (triggerConfig.idleDays).
 *
 * Runs daily. Uses a 24h window to fire each automation exactly once
 * when a deal crosses the idle threshold.
 *
 * Manual test:
 * GET /api/cron/deal-idle?token=SEU_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { executeDealAutomations } from '@/lib/automations/engine'
import logger from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  // Validate cron secret
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

  logger.info('[CRON:DEAL-IDLE] Starting deal idle automations job...')
  const startTime = Date.now()
  const stats = { automationsChecked: 0, dealsChecked: 0, triggered: 0, errors: 0 }

  try {
    // Fetch all enabled DEAL_IDLE automations
    const idleAutomations = await prisma.dealAutomation.findMany({
      where: { triggerType: 'DEAL_IDLE', enabled: true },
      select: { organizationId: true, triggerConfig: true }
    })

    stats.automationsChecked = idleAutomations.length

    if (idleAutomations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No DEAL_IDLE automations configured',
        stats
      })
    }

    // Group orgs by idleDays threshold to batch DB queries
    const thresholdMap = new Map<number, Set<string>>() // idleDays -> Set<orgId>

    for (const automation of idleAutomations) {
      const config = automation.triggerConfig as Record<string, unknown>
      const idleDays = Math.max(1, Number(config?.idleDays) || 3)

      if (!thresholdMap.has(idleDays)) thresholdMap.set(idleDays, new Set())
      thresholdMap.get(idleDays)!.add(automation.organizationId)
    }

    // Process each threshold
    for (const [idleDays, orgIds] of thresholdMap) {
      // 24h window: deals that crossed the threshold today
      const now = new Date()
      const windowEnd = new Date(now)
      windowEnd.setDate(windowEnd.getDate() - idleDays)
      windowEnd.setHours(23, 59, 59, 999)

      const windowStart = new Date(now)
      windowStart.setDate(windowStart.getDate() - idleDays)
      windowStart.setHours(0, 0, 0, 0)

      const idleDeals = await prisma.deal.findMany({
        where: {
          organizationId: { in: Array.from(orgIds) },
          status: 'ACTIVE',
          archived: false,
          updatedAt: { gte: windowStart, lte: windowEnd }
        },
        select: {
          id: true,
          organizationId: true,
          value: true,
          stageId: true,
          pipelineId: true,
          title: true,
          userId: true
        }
      })

      stats.dealsChecked += idleDeals.length

      for (const deal of idleDeals) {
        try {
          const automationContext = {
            organizationId: deal.organizationId,
            value: deal.value ? Number(deal.value) : 0,
            stageId: deal.stageId,
            pipelineId: deal.pipelineId,
            title: deal.title,
            userId: deal.userId,
            idleDays
          }

          await executeDealAutomations(deal.id, 'DEAL_IDLE', automationContext)
          stats.triggered++

          logger.info(
            { dealId: deal.id, idleDays, orgId: deal.organizationId },
            '[CRON:DEAL-IDLE] Automation triggered'
          )
        } catch (err) {
          stats.errors++
          logger.error({ err, dealId: deal.id }, '[CRON:DEAL-IDLE] Failed to trigger automation')
        }
      }
    }

    const duration = Date.now() - startTime
    logger.info({ ...stats, duration: `${duration}ms` }, '[CRON:DEAL-IDLE] Job completed')

    return NextResponse.json({
      success: true,
      message: 'Deal idle automations job completed',
      stats: { ...stats, duration: `${duration}ms` }
    })
  } catch (error) {
    logger.error({ error }, '[CRON:DEAL-IDLE] Critical error')
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
