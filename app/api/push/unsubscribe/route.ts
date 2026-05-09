import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { unsubscribeFromPushNotifications } from '@/lib/push-notifications'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * @swagger
 * /api/push/unsubscribe:
 *   post:
 *     summary: Unsubscribe from push notifications
 *     description: Remove a Web Push subscription
 *     tags:
 *       - Push Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: Push subscription endpoint URL
 *     responses:
 *       200:
 *         description: Successfully unsubscribed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint' },
        { status: 400 }
      )
    }

    const result = await unsubscribeFromPushNotifications(endpoint)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to unsubscribe from push notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error unsubscribing from push notifications')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}
