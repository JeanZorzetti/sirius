import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sendNotificationToUser } from '@/lib/push-notifications'

/**
 * @swagger
 * /api/push/test:
 *   post:
 *     summary: Send a test push notification
 *     description: Send a test notification to the authenticated user
 *     tags:
 *       - Push Notifications
 *     responses:
 *       200:
 *         description: Test notification sent successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await sendNotificationToUser(session.user.id, {
      title: '🔔 Notificações Ativadas!',
      body: 'Você receberá atualizações importantes do Sirius CRM',
      tag: 'test-notification',
      url: '/dashboard',
    })

    return NextResponse.json({
      success: result.success,
      sent: result.sent,
      failed: result.failed,
    })
  } catch (error) {
    logger.error({ err: error }, 'Error sending test push notification')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
