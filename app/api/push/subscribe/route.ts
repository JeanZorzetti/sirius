import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { subscribeToPushNotifications } from '@/lib/push-notifications'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * @swagger
 * /api/push/subscribe:
 *   post:
 *     summary: Subscribe to push notifications
 *     description: Register a Web Push subscription for the authenticated user
 *     tags:
 *       - Push Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription
 *             properties:
 *               subscription:
 *                 type: object
 *                 description: PushSubscription object from browser
 *     responses:
 *       200:
 *         description: Successfully subscribed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    const body = await request.json()
    const { subscription } = body

    if (!subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription object' },
        { status: 400 }
      )
    }

    const userAgent = request.headers.get('user-agent') || undefined

    const result = await subscribeToPushNotifications(
      session.user.id,
      session.user.organizationId,
      subscription,
      userAgent
    )

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to subscribe to push notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscriptionId: result.subscriptionId,
    })
  } catch (error) {
    logger.error({ err: error }, 'Error subscribing to push notifications')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
