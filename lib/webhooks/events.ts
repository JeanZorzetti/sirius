/**
 * Webhook Event Types
 * These are the events that can trigger webhooks
 */

export const WEBHOOK_EVENTS = {
  // Deal events
  DEAL_CREATED: 'deal.created',
  DEAL_UPDATED: 'deal.updated',
  DEAL_DELETED: 'deal.deleted',
  DEAL_STAGE_CHANGED: 'deal.stage_changed',
  DEAL_VALUE_CHANGED: 'deal.value_changed',
  DEAL_WON: 'deal.won',
  DEAL_LOST: 'deal.lost',

  // Contact events
  CONTACT_CREATED: 'contact.created',
  CONTACT_UPDATED: 'contact.updated',
  CONTACT_DELETED: 'contact.deleted',

  // Note events
  DEAL_NOTE_ADDED: 'deal.note_added',

  // Pipeline events
  PIPELINE_CREATED: 'pipeline.created',
  PIPELINE_UPDATED: 'pipeline.updated',
  PIPELINE_DELETED: 'pipeline.deleted',

  // Organization events
  ORGANIZATION_UPGRADED: 'organization.upgraded',
  ORGANIZATION_DOWNGRADED: 'organization.downgraded'
} as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS]

/**
 * Get all available webhook events
 */
export function getAllWebhookEvents(): WebhookEvent[] {
  return Object.values(WEBHOOK_EVENTS)
}

/**
 * Get webhook event categories
 */
export function getWebhookEventCategories() {
  return [
    {
      category: 'Deals',
      events: [
        { value: WEBHOOK_EVENTS.DEAL_CREATED, label: 'Deal Created' },
        { value: WEBHOOK_EVENTS.DEAL_UPDATED, label: 'Deal Updated' },
        { value: WEBHOOK_EVENTS.DEAL_DELETED, label: 'Deal Deleted' },
        { value: WEBHOOK_EVENTS.DEAL_STAGE_CHANGED, label: 'Deal Stage Changed' },
        { value: WEBHOOK_EVENTS.DEAL_VALUE_CHANGED, label: 'Deal Value Changed' },
        { value: WEBHOOK_EVENTS.DEAL_WON, label: 'Deal Won' },
        { value: WEBHOOK_EVENTS.DEAL_LOST, label: 'Deal Lost' },
        { value: WEBHOOK_EVENTS.DEAL_NOTE_ADDED, label: 'Note Added to Deal' }
      ]
    },
    {
      category: 'Contacts',
      events: [
        { value: WEBHOOK_EVENTS.CONTACT_CREATED, label: 'Contact Created' },
        { value: WEBHOOK_EVENTS.CONTACT_UPDATED, label: 'Contact Updated' },
        { value: WEBHOOK_EVENTS.CONTACT_DELETED, label: 'Contact Deleted' }
      ]
    },
    {
      category: 'Pipelines',
      events: [
        { value: WEBHOOK_EVENTS.PIPELINE_CREATED, label: 'Pipeline Created' },
        { value: WEBHOOK_EVENTS.PIPELINE_UPDATED, label: 'Pipeline Updated' },
        { value: WEBHOOK_EVENTS.PIPELINE_DELETED, label: 'Pipeline Deleted' }
      ]
    },
    {
      category: 'Organization',
      events: [
        { value: WEBHOOK_EVENTS.ORGANIZATION_UPGRADED, label: 'Organization Upgraded to PRO' },
        { value: WEBHOOK_EVENTS.ORGANIZATION_DOWNGRADED, label: 'Organization Downgraded to FREE' }
      ]
    }
  ]
}

/**
 * Webhook Payload Interface
 */
export interface WebhookPayload<T = any> {
  event: WebhookEvent
  timestamp: string
  data: T
  organization: {
    id: string
    name: string
  }
}

/**
 * Create webhook payload
 */
export function createWebhookPayload<T>(
  event: WebhookEvent,
  data: T,
  organization: { id: string; name: string }
): WebhookPayload<T> {
  return {
    event,
    timestamp: new Date().toISOString(),
    data,
    organization
  }
}
