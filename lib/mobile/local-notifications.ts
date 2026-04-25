'use client'

import { Capacitor } from '@capacitor/core'

export async function scheduleLocalNotification(options: {
  id: number
  title: string
  body: string
  scheduleAt: Date
  extra?: Record<string, unknown>
}): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    // Web fallback: use setTimeout with Notification API (only works if page is open)
    const delay = options.scheduleAt.getTime() - Date.now()
    if (delay > 0 && 'Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        new Notification(options.title, {
          body: options.body,
          icon: '/icon.png',
          data: options.extra,
        })
      }, delay)
      return true
    }
    return false
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const { display } = await LocalNotifications.checkPermissions()
    if (display !== 'granted') {
      const { display: granted } = await LocalNotifications.requestPermissions()
      if (granted !== 'granted') return false
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: options.id,
          title: options.title,
          body: options.body,
          schedule: { at: options.scheduleAt },
          extra: options.extra,
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
        },
      ],
    })
    return true
  } catch {
    return false
  }
}

export async function cancelLocalNotification(id: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id }] })
  } catch {}
}

export async function scheduleTaskReminder(task: {
  id: string
  title: string
  dueDate: Date
}): Promise<void> {
  const reminderAt = new Date(task.dueDate.getTime() - 15 * 60 * 1000) // 15 min before
  if (reminderAt < new Date()) return

  const notifId = Math.abs(task.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 2147483647
  await scheduleLocalNotification({
    id: notifId,
    title: '⏰ Tarefa em 15 minutos',
    body: task.title,
    scheduleAt: reminderAt,
    extra: { taskId: task.id, type: 'task_reminder' },
  })
}

export async function scheduleFollowUpReminder(deal: {
  id: string
  title: string
  remindAt: Date
}): Promise<void> {
  const notifId = Math.abs(deal.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 2147483647
  await scheduleLocalNotification({
    id: notifId,
    title: '📞 Follow-up pendente',
    body: deal.title,
    scheduleAt: deal.remindAt,
    extra: { dealId: deal.id, type: 'followup_reminder' },
  })
}
