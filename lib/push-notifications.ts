import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

// Configure VAPID keys
if (process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY
  )
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  data?: Record<string, any>
}

export interface SendNotificationOptions {
  userId?: string
  organizationId?: string
  payload: PushNotificationPayload
}

/**
 * Send push notification to specific user
 */
export async function sendNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId,
      active: true,
    },
  })

  return sendNotificationToSubscriptions(subscriptions, payload)
}

/**
 * Send push notification to all users in organization
 */
export async function sendNotificationToOrganization(
  organizationId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      organizationId,
      active: true,
    },
  })

  return sendNotificationToSubscriptions(subscriptions, payload)
}

/**
 * Send push notification to all users in organization with preference filtering
 */
export async function sendNotificationToOrganizationWithPreference(
  organizationId: string,
  payload: PushNotificationPayload,
  preferenceField: 'newDealEnabled' | 'dealWonEnabled' | 'whatsappMessageEnabled' | 'calendarReminderEnabled'
): Promise<{ success: boolean; sent: number; failed: number }> {
  // Get subscriptions with user preferences
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      organizationId,
      active: true,
    },
    include: {
      user: {
        include: {
          notificationPreference: true,
        },
      },
    },
  })

  // Filter by preference
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const preference = sub.user.notificationPreference
    if (!preference) return true // If no preferences set, send by default
    return preference[preferenceField] === true
  })

  return sendNotificationToSubscriptions(filteredSubscriptions, payload)
}

/**
 * Send push notification to list of subscriptions
 */
async function sendNotificationToSubscriptions(
  subscriptions: Array<{
    id: string
    endpoint: string
    p256dh: string
    auth: string
  }>,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  if (subscriptions.length === 0) {
    return { success: true, sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0
  const failedSubscriptionIds: string[] = []

  const notificationPayload = {
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/icon-72x72.png',
    tag: payload.tag,
    data: {
      url: payload.url || '/dashboard',
      ...payload.data,
    },
  }

  // Send notifications in parallel
  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify(notificationPayload)
        )

        // Update lastUsedAt
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { lastUsedAt: new Date() },
        })

        return { success: true, subscriptionId: subscription.id }
      } catch (error: any) {
        console.error('Failed to send push notification:', error)

        // If subscription is no longer valid (410 Gone or 404), mark as inactive
        if (error.statusCode === 410 || error.statusCode === 404) {
          failedSubscriptionIds.push(subscription.id)
        }

        return { success: false, subscriptionId: subscription.id }
      }
    })
  )

  // Count results
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++
    } else {
      failed++
    }
  })

  // Deactivate failed subscriptions
  if (failedSubscriptionIds.length > 0) {
    await prisma.pushSubscription.updateMany({
      where: {
        id: { in: failedSubscriptionIds },
      },
      data: {
        active: false,
      },
    })
  }

  return { success: sent > 0, sent, failed }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  userId: string,
  organizationId: string,
  subscription: {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  },
  userAgent?: string
): Promise<{ success: boolean; subscriptionId?: string }> {
  try {
    // Check if subscription already exists
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    })

    if (existingSubscription) {
      // Reactivate if inactive
      if (!existingSubscription.active) {
        await prisma.pushSubscription.update({
          where: { id: existingSubscription.id },
          data: { active: true, updatedAt: new Date() },
        })
      }
      return { success: true, subscriptionId: existingSubscription.id }
    }

    // Create new subscription
    const newSubscription = await prisma.pushSubscription.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId,
        organizationId,
        userAgent: userAgent || null,
        deviceType: getDeviceType(userAgent),
      },
    })

    return { success: true, subscriptionId: newSubscription.id }
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return { success: false }
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(
  endpoint: string
): Promise<{ success: boolean }> {
  try {
    await prisma.pushSubscription.updateMany({
      where: { endpoint },
      data: { active: false },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error)
    return { success: false }
  }
}

/**
 * Get device type from user agent
 */
function getDeviceType(userAgent?: string): string | null {
  if (!userAgent) return null

  const ua = userAgent.toLowerCase()

  if (ua.includes('mobile') || ua.includes('android')) {
    return 'mobile'
  }

  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet'
  }

  return 'desktop'
}

/**
 * Helper functions for common notification types
 */

export async function sendNewDealNotification(
  userId: string,
  dealTitle: string,
  dealValue?: number
): Promise<void> {
  // Check user preferences
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  })

  if (preferences && !preferences.newDealEnabled) {
    return // User disabled this notification
  }

  await sendNotificationToUser(userId, {
    title: '🎉 Novo Deal Criado!',
    body: `${dealTitle}${dealValue ? ` - R$ ${dealValue.toLocaleString('pt-BR')}` : ''}`,
    tag: 'new-deal',
    url: '/dashboard',
  })
}

export async function sendDealWonNotification(
  organizationId: string,
  dealTitle: string,
  dealValue?: number
): Promise<void> {
  await sendNotificationToOrganizationWithPreference(organizationId, {
    title: '🏆 Deal Ganho!',
    body: `${dealTitle}${dealValue ? ` - R$ ${dealValue.toLocaleString('pt-BR')}` : ''}`,
    tag: 'deal-won',
    url: '/dashboard',
  }, 'dealWonEnabled')
}

export async function sendNewContactNotification(
  userId: string,
  contactName: string
): Promise<void> {
  await sendNotificationToUser(userId, {
    title: '👤 Novo Contato',
    body: `${contactName} foi adicionado aos seus contatos`,
    tag: 'new-contact',
    url: '/dashboard/contacts',
  })
}

export async function sendWhatsAppMessageNotification(
  userId: string,
  contactName: string,
  messagePreview: string
): Promise<void> {
  // Check user preferences
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  })

  if (preferences && !preferences.whatsappMessageEnabled) {
    return // User disabled this notification
  }

  await sendNotificationToUser(userId, {
    title: `💬 ${contactName}`,
    body: messagePreview,
    tag: 'whatsapp-message',
    url: '/dashboard',
  })
}

export async function sendCalendarEventNotification(
  userId: string,
  eventTitle: string,
  startTime: Date
): Promise<void> {
  // Check user preferences
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  })

  if (preferences && !preferences.calendarReminderEnabled) {
    return // User disabled this notification
  }

  await sendNotificationToUser(userId, {
    title: '📅 Evento em Breve',
    body: `${eventTitle} começa às ${startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    tag: 'calendar-event',
    url: '/dashboard',
  })
}
