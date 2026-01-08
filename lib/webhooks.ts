import logger from './logger'

/**
 * Eventos de webhook disponíveis
 */
export const WEBHOOK_EVENTS = {
  ORGANIZATION_UPGRADED: 'organization.upgraded',
  ORGANIZATION_DOWNGRADED: 'organization.downgraded',
  DEAL_CREATED: 'deal.created',
  DEAL_UPDATED: 'deal.updated',
  DEAL_DELETED: 'deal.deleted',
  DEAL_STAGE_CHANGED: 'deal.stage_changed',
  DEAL_VALUE_CHANGED: 'deal.value_changed',
  CONTACT_CREATED: 'contact.created',
  CONTACT_UPDATED: 'contact.updated',
  CONTACT_DELETED: 'contact.deleted',
  DEAL_NOTE_ADDED: 'deal.note_added',
} as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS]

/**
 * Despacha webhook assincronamente (não-bloqueante)
 *
 * Esta é uma implementação temporária que apenas registra logs.
 * Será substituída pela integração completa com Svix na Fase 4 da API Pública.
 */
export function dispatchWebhookAsync(
  organizationId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): void {
  // Executar em background sem bloquear
  setImmediate(() => {
    logger.info({
      organizationId,
      event,
      payload
    }, 'Webhook event dispatched (stub implementation)')
  })
}

/**
 * Despacha webhook sincronamente (bloqueante)
 *
 * Usa a implementação assíncrona internamente.
 */
export async function dispatchWebhook(
  organizationId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  dispatchWebhookAsync(organizationId, event, payload)
}
