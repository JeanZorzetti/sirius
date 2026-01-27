/**
 * Onboarding Event System
 *
 * Sistema de eventos para detectar automaticamente quando usuários
 * completam ações durante o onboarding.
 *
 * Baseado em Event-Driven Architecture:
 * https://www.confluent.io/blog/supercharge-customer-onboarding-with-event-driven-microservices/
 */

import { EventEmitter } from 'events';

// Singleton Event Emitter
class OnboardingEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20); // Aumentar limite para múltiplos listeners
  }
}

export const onboardingEmitter = new OnboardingEventEmitter();

// Tipos de eventos do onboarding
export const ONBOARDING_EVENTS = {
  ORGANIZATION_SAVED: 'onboarding:organization_saved',
  PIPELINE_CREATED: 'onboarding:pipeline_created',
  PIPELINE_STAGE_CREATED: 'onboarding:pipeline_stage_created',
  CONTACT_CREATED: 'onboarding:contact_created',
  DEAL_CREATED: 'onboarding:deal_created',
  STEP_COMPLETED: 'onboarding:step_completed',
} as const;

export type OnboardingEventType = typeof ONBOARDING_EVENTS[keyof typeof ONBOARDING_EVENTS];

// Payload de eventos
export interface OnboardingEventPayload {
  userId: string;
  stepId?: string;
  resourceId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Helper para emitir eventos com logging
export function emitOnboardingEvent(
  event: OnboardingEventType,
  payload: OnboardingEventPayload
) {
  console.log(`[Onboarding Event] ${event}`, payload);
  onboardingEmitter.emit(event, payload);
}

// Helper para escutar eventos
export function onOnboardingEvent(
  event: OnboardingEventType,
  callback: (payload: OnboardingEventPayload) => void
) {
  onboardingEmitter.on(event, callback);
}
