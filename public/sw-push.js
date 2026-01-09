// Service Worker for Push Notifications
// This file handles push events and notification clicks

self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push received:', event)

  let data = {
    title: 'Sirius CRM',
    body: 'Nova notificação',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'default',
    data: {
      url: '/dashboard',
    },
  }

  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error)
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-72x72.png',
    tag: data.tag || 'default',
    data: data.data || { url: '/dashboard' },
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: data.actions || [],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification clicked:', event)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUnmatched: true })
      .then(function (clientList) {
        // If a window is already open, focus it
        for (let client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }

        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

self.addEventListener('notificationclose', function (event) {
  console.log('[Service Worker] Notification closed:', event)
})

// Background Sync - Process offline actions when connection is restored
self.addEventListener('sync', function (event) {
  console.log('[Service Worker] Background sync triggered:', event.tag)

  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(
      fetch('/api/sync/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
        .then((response) => {
          console.log('[Service Worker] Sync completed:', response.status)
          return response.json()
        })
        .then((data) => {
          console.log('[Service Worker] Sync result:', data)

          // Show notification if there were synced actions
          if (data.success > 0) {
            return self.registration.showNotification('Sincronização Concluída', {
              body: `${data.success} ação(ões) foram sincronizadas com sucesso`,
              icon: '/icon-192x192.png',
              badge: '/icon-72x72.png',
              tag: 'sync-complete',
            })
          }
        })
        .catch((error) => {
          console.error('[Service Worker] Sync failed:', error)

          // Show error notification
          return self.registration.showNotification('Erro na Sincronização', {
            body: 'Não foi possível sincronizar suas ações. Tente novamente.',
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            tag: 'sync-error',
          })
        })
    )
  }
})
