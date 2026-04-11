// Sirius CRM Service Worker
// Simple PWA implementation without build tools

const CACHE_VERSION = 'v1';
const CACHE_NAME = `sirius-crm-${CACHE_VERSION}`;

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.png',
  '/apple-icon.png',
];

// Install event - precache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome extensions, dev server, and third-party origins
  if (url.protocol === 'chrome-extension:' || url.hostname === 'localhost') return;
  if (url.origin !== self.location.origin) return;

  // API requests - Network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful GET requests
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - Cache first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|woff|woff2|ttf|otf)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages - Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to offline page if available
          return caches.match('/');
        });
      })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Push notifications acionáveis (Sprint 3.3)
// ─────────────────────────────────────────────────────────────────────────────
//
// Payload esperado (FCM `data` ou Web Push):
// {
//   title: string,
//   body: string,
//   category: 'PROPOSAL_OPENED' | 'DEAL_STALLED' | 'CHAT_MESSAGE' | 'TASK_DUE',
//   dealId?, contactId?, conversationId?, taskId?, phone?
// }

const ACTION_CATEGORIES = {
  PROPOSAL_OPENED: [
    { action: 'CALL', title: '📞 Ligar' },
    { action: 'WHATSAPP', title: '💬 WhatsApp' },
  ],
  DEAL_STALLED: [
    { action: 'VIEW', title: '👀 Ver' },
    { action: 'COMPLETE', title: '✅ Concluir' },
  ],
  CHAT_MESSAGE: [{ action: 'REPLY', title: '💬 Responder' }],
  TASK_DUE: [
    { action: 'COMPLETE', title: '✅ Concluir' },
    { action: 'SNOOZE', title: '⏰ Adiar' },
  ],
};

self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: 'Sirius CRM', body: event.data.text() };
    }
  }

  const title = payload.title || 'Sirius CRM';
  const category = payload.category;
  const actions = (category && ACTION_CATEGORIES[category]) || [];

  const options = {
    body: payload.body || 'Nova notificação',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: payload.tag || category || 'sirius-default',
    renotify: true,
    requireInteraction: category === 'PROPOSAL_OPENED' || category === 'CHAT_MESSAGE',
    actions,
    data: {
      category,
      dealId: payload.dealId,
      contactId: payload.contactId,
      conversationId: payload.conversationId,
      taskId: payload.taskId,
      phone: payload.phone,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

function cleanPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 10 ? digits : null;
}

function urlForAction(actionId, data) {
  switch (actionId) {
    case 'CALL': {
      const phone = cleanPhone(data.phone);
      return phone ? `tel:+${phone}` : null;
    }
    case 'WHATSAPP': {
      const phone = cleanPhone(data.phone);
      return phone ? `https://wa.me/${phone}` : null;
    }
    case 'VIEW':
      if (data.dealId) return `/dashboard/deals/${data.dealId}`;
      if (data.contactId) return `/dashboard/contacts/${data.contactId}`;
      return '/dashboard';
    case 'REPLY':
      return data.conversationId ? `/dashboard/chat/${data.conversationId}?reply=1` : '/dashboard/chat';
    default: {
      // Default tap (sem botão) — abre tela contextual
      if (data.dealId) return `/dashboard/deals/${data.dealId}`;
      if (data.contactId) return `/dashboard/contacts/${data.contactId}`;
      if (data.conversationId) return `/dashboard/chat/${data.conversationId}`;
      if (data.taskId) return `/dashboard/tasks/${data.taskId}`;
      return '/dashboard';
    }
  }
}

self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event;
  const data = notification.data || {};
  notification.close();

  // Background actions — chamam API direto sem abrir o app
  if (action === 'COMPLETE') {
    const url = data.taskId
      ? `/api/v1/tasks/${data.taskId}/complete`
      : data.dealId
      ? `/api/v1/deals/${data.dealId}/won`
      : null;
    if (url) {
      event.waitUntil(fetch(url, { method: 'POST' }).catch(() => {}));
      return;
    }
  }
  if (action === 'SNOOZE' && data.taskId) {
    event.waitUntil(
      fetch(`/api/v1/tasks/${data.taskId}/snooze`, { method: 'POST' }).catch(() => {}),
    );
    return;
  }

  // Foreground actions — abrem o app numa rota específica
  const targetUrl = urlForAction(action, data);
  if (!targetUrl) return;

  // Para deep links externos (tel:, https://wa.me/), usa openWindow direto
  if (targetUrl.startsWith('tel:') || targetUrl.startsWith('https://wa.me/')) {
    event.waitUntil(self.clients.openWindow(targetUrl));
    return;
  }

  // Para rotas internas, foca janela existente ou abre nova
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
