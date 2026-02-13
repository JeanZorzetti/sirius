import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

/**
 * @swagger
 * /api/sync/process:
 *   post:
 *     summary: Process offline queue (called by service worker)
 *     description: This endpoint is called by the service worker's background sync
 *     tags:
 *       - Background Sync
 *     responses:
 *       200:
 *         description: Sync completed
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // This endpoint is just a placeholder to trigger client-side sync
    // The actual syncing happens in the client using the offline-queue.ts functions

    return NextResponse.json({
      success: 0,
      failed: 0,
      message: 'Sync endpoint called successfully',
    })
  } catch (error) {
    logger.error({ err: error }, 'Error processing sync')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
