/**
 * Cron: AgaaS FollowUpCoordinator — scan idle deals
 * Schedule: every 2 hours during business hours
 * GET /api/cron/agaas-idle-deals
 * Header: Authorization: Bearer <CRON_SECRET>
 */
import { NextRequest, NextResponse } from 'next/server'
import { triggerFollowUpForIdleDeals } from '@/lib/agaas-agent-trigger'
import logger from '@/lib/logger'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const triggered = await triggerFollowUpForIdleDeals()
    return NextResponse.json({ ok: true, triggered })
  } catch (error: any) {
    logger.error({ error: error.message }, '[Cron] agaas-idle-deals failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
