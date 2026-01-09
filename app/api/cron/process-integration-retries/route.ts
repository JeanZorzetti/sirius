import { NextResponse } from 'next/server'
import { processRetries } from '@/lib/integrations/retry-handler'
import logger from '@/lib/logger'

/**
 * Process Integration Retries Cron Job
 * Runs every 5 minutes to retry failed integrations
 *
 * GET /api/cron/process-integration-retries
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
      logger.warn({ token }, 'Unauthorized cron job attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Starting integration retries cron job')

    // Process retries
    const result = await processRetries()

    logger.info(result, 'Integration retries cron job completed')

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    logger.error({ error }, 'Error in integration retries cron job')
    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        message: error.message
      },
      { status: 500 }
    )
  }
}
