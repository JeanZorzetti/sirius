'use client'

/**
 * Push Notifications via Capacitor — versão Sprint 3.3 com ações inline.
 *
 * Suporta:
 * - Nativo (iOS/Android): @capacitor/push-notifications + Action Groups
 * - Web: Notifications API com `actions` (PWA / service worker)
 *
 * Conceito de Action Templates:
 * - Cada notificação tem um `category` que define os botões disponíveis
 * - Quando o usuário toca numa ação, roteamos via handleNotificationAction()
 *
 * Templates suportados:
 * - PROPOSAL_OPENED   → [📞 Ligar] [💬 WhatsApp]   (cliente abriu proposta)
 * - DEAL_STALLED      → [👀 Ver]    [✅ Concluir]   (deal parado há N dias)
 * - CHAT_MESSAGE      → [💬 Responder]              (nova mensagem)
 * - TASK_DUE          → [✅ Concluir] [⏰ Adiar]    (tarefa vencendo)
 */

import { isNativePlatform } from './platform'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export type PushCategory =
  | 'PROPOSAL_OPENED'
  | 'DEAL_STALLED'
  | 'CHAT_MESSAGE'
  | 'TASK_DUE'

export type PushActionId =
  | 'CALL'
  | 'WHATSAPP'
  | 'VIEW'
  | 'COMPLETE'
  | 'REPLY'
  | 'SNOOZE'

export interface PushActionDefinition {
  id: PushActionId
  /** Texto que aparece no botão. */
  title: string
  /** Se true, abre o app antes de executar (necessário para deep links). */
  foreground?: boolean
}

export interface PushActionCategory {
  id: PushCategory
  actions: PushActionDefinition[]
}

/** Payload `data` esperado em qualquer push acionável. */
export interface PushDataPayload {
  category?: PushCategory
  dealId?: string
  contactId?: string
  conversationId?: string
  taskId?: string
  /** Telefone E.164 para CALL/WHATSAPP. */
  phone?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de categorias (action groups)
// ─────────────────────────────────────────────────────────────────────────────

export const PUSH_CATEGORIES: PushActionCategory[] = [
  {
    id: 'PROPOSAL_OPENED',
    actions: [
      { id: 'CALL', title: '📞 Ligar', foreground: true },
      { id: 'WHATSAPP', title: '💬 WhatsApp', foreground: true },
    ],
  },
  {
    id: 'DEAL_STALLED',
    actions: [
      { id: 'VIEW', title: '👀 Ver', foreground: true },
      { id: 'COMPLETE', title: '✅ Concluir' },
    ],
  },
  {
    id: 'CHAT_MESSAGE',
    actions: [{ id: 'REPLY', title: '💬 Responder', foreground: true }],
  },
  {
    id: 'TASK_DUE',
    actions: [
      { id: 'COMPLETE', title: '✅ Concluir' },
      { id: 'SNOOZE', title: '⏰ Adiar' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Server token sync
// ─────────────────────────────────────────────────────────────────────────────

async function saveTokenToServer(token: string, platform: 'IOS' | 'ANDROID' | 'WEB') {
  try {
    await fetch('/api/mobile/push-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform }),
    })
  } catch {
    // Silently fail - non-critical
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Action routing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sanitiza um telefone e devolve apenas dígitos (com DDI quando disponível).
 * Aceita formatos: +55 11 99999-9999, 11999999999, etc.
 */
function cleanPhone(phone: string | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 ? digits : null
}

/**
 * Roteia uma ação de push para o lugar certo do app.
 * - Ações sem `foreground` deveriam ser tratadas server-side; aqui apenas
 *   logamos para debug. Em produção, COMPLETE/SNOOZE iriam direto para uma
 *   API REST sem abrir o app.
 */
export function handleNotificationAction(
  actionId: PushActionId | 'tap',
  data: PushDataPayload,
): void {
  // Tap simples (sem ação) — abre tela contextual
  if (actionId === 'tap') {
    if (data.dealId) {
      window.location.href = `/dashboard/deals/${data.dealId}`
    } else if (data.contactId) {
      window.location.href = `/dashboard/contacts/${data.contactId}`
    } else if (data.conversationId) {
      window.location.href = `/dashboard/chat/${data.conversationId}`
    } else if (data.taskId) {
      window.location.href = `/dashboard/tasks/${data.taskId}`
    }
    return
  }

  switch (actionId) {
    case 'CALL': {
      const phone = cleanPhone(data.phone)
      if (phone) window.location.href = `tel:+${phone}`
      return
    }
    case 'WHATSAPP': {
      const phone = cleanPhone(data.phone)
      if (phone) window.location.href = `https://wa.me/${phone}`
      return
    }
    case 'VIEW': {
      if (data.dealId) window.location.href = `/dashboard/deals/${data.dealId}`
      else if (data.contactId) window.location.href = `/dashboard/contacts/${data.contactId}`
      return
    }
    case 'REPLY': {
      if (data.conversationId) {
        window.location.href = `/dashboard/chat/${data.conversationId}?reply=1`
      }
      return
    }
    case 'COMPLETE': {
      // Background action — call API directly
      if (data.taskId) {
        void fetch(`/api/v1/tasks/${data.taskId}/complete`, { method: 'POST' }).catch(() => {})
      } else if (data.dealId) {
        void fetch(`/api/v1/deals/${data.dealId}/won`, { method: 'POST' }).catch(() => {})
      }
      return
    }
    case 'SNOOZE': {
      if (data.taskId) {
        void fetch(`/api/v1/tasks/${data.taskId}/snooze`, { method: 'POST' }).catch(() => {})
      }
      return
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Registro de push (nativo e web)
// ─────────────────────────────────────────────────────────────────────────────

export async function registerPushNotifications(): Promise<void> {
  try {
    if (isNativePlatform()) {
      const { PushNotifications } = await import('@capacitor/push-notifications')

      const permStatus = await PushNotifications.requestPermissions()
      if (permStatus.receive !== 'granted') return

      // Action groups ricos são definidos no servidor — Android via
      // `notification.android.notification.click_action` + `data.category`,
      // iOS via `aps.category` mapeado nas Notification Service Extensions.
      await PushNotifications.register()

      PushNotifications.addListener('registration', async ({ value: token }) => {
        const platform =
          (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.() === 'ios'
            ? 'IOS'
            : 'ANDROID'
        await saveTokenToServer(token, platform)
      })

      PushNotifications.addListener('registrationError', (err) => {
        console.error('Push registration error:', err)
      })

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        // Foreground delivery — poderia exibir um toast in-app aqui
        console.log('[push] received in foreground:', notification.title)
      })

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const data = (action.notification.data ?? {}) as PushDataPayload
        // `tap` é o id default quando o usuário só toca na notificação (sem botão)
        const rawId = action.actionId || 'tap'
        const normalized: PushActionId | 'tap' = rawId === 'tap' ? 'tap' : (rawId as PushActionId)
        handleNotificationAction(normalized, data)
      })
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      await saveTokenToServer('web-push-' + Date.now(), 'WEB')
    }
  } catch (err) {
    console.error('Push notification setup failed:', err)
  }
}
