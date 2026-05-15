/**
 * WhatsApp Official API Client (Meta Cloud API)
 *
 * Provides methods to interact with the official WhatsApp Business Cloud API:
 * - Send text messages
 * - Send template messages
 * - Get phone number info
 * - Test connection
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import logger from '@/lib/logger'

const GRAPH_API_VERSION = 'v22.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WabaPhoneNumberInfo {
  id: string
  verified_name: string
  display_phone_number: string
  quality_rating: string
}

export interface WabaSendMessageResponse {
  messaging_product: 'whatsapp'
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string; message_status?: string }>
}

export interface WabaTemplateComponent {
  type: 'header' | 'body' | 'button'
  parameters: Array<{
    type: 'text' | 'image' | 'document' | 'video'
    text?: string
    image?: { link: string }
    document?: { link: string; filename?: string }
    video?: { link: string }
  }>
  sub_type?: 'quick_reply' | 'url'
  index?: number
}

export interface WabaSendTemplateParams {
  to: string
  templateName: string
  language: string // e.g. "pt_BR"
  components?: WabaTemplateComponent[]
}

// ─── Rate limiter (token bucket) ─────────────────────────────────────────────
// Meta Cloud API: ~80 msg/s for Tier 0; we throttle conservatively at 50 msg/s
// to leave headroom for media uploads and template sends running in parallel.

const RATE_LIMIT_PER_SECOND = 50
const tokenState = { tokens: RATE_LIMIT_PER_SECOND, lastRefill: Date.now() }

async function acquireToken(): Promise<void> {
  // Refill once per call: tokens proportional to elapsed seconds, capped at max
  const now = Date.now()
  const elapsed = (now - tokenState.lastRefill) / 1000
  tokenState.tokens = Math.min(RATE_LIMIT_PER_SECOND, tokenState.tokens + elapsed * RATE_LIMIT_PER_SECOND)
  tokenState.lastRefill = now

  if (tokenState.tokens >= 1) {
    tokenState.tokens -= 1
    return
  }
  // Not enough tokens — wait until at least one token will be available
  const waitMs = Math.ceil(((1 - tokenState.tokens) / RATE_LIMIT_PER_SECOND) * 1000)
  await new Promise(r => setTimeout(r, waitMs))
  return acquireToken()
}

// Errors from Meta that are transient and worth retrying
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])

function isRetryableError(status: number, err: any): boolean {
  if (RETRYABLE_STATUS.has(status)) return true
  const msg = String(err?.message || '').toLowerCase()
  return msg.includes('timeout') || msg.includes('fetch failed') || msg.includes('econnreset')
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class WhatsAppOfficialClient {
  private phoneNumberId: string
  private accessToken: string

  constructor(phoneNumberId: string, accessToken: string) {
    this.phoneNumberId = phoneNumberId
    this.accessToken = accessToken
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 3
  ): Promise<T> {
    const url = `${GRAPH_API_BASE}${endpoint}`

    let lastError: any = null
    for (let attempt = 0; attempt < retries; attempt++) {
      // Throttle through token bucket before each attempt
      await acquireToken()

      let response: Response
      try {
        response = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        })
      } catch (err: any) {
        lastError = err
        if (attempt < retries - 1 && isRetryableError(0, err)) {
          const backoff = Math.min(2000 * Math.pow(2, attempt), 10_000)
          logger.warn({ url, attempt, backoff, err: err?.message }, 'WhatsApp request transient failure, retrying')
          await new Promise(r => setTimeout(r, backoff))
          continue
        }
        logger.error({ error: err, url, endpoint }, 'WhatsApp Official API request failed (network)')
        throw err
      }

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errMsg = data?.error?.message || `HTTP ${response.status}`
        const err = new Error(`Meta API Error: ${errMsg}`)
        ;(err as any).status = response.status
        ;(err as any).code = data?.error?.code

        if (attempt < retries - 1 && isRetryableError(response.status, err)) {
          // Respect Retry-After if Meta sends it; else exponential backoff
          const retryAfter = parseInt(response.headers.get('retry-after') || '0', 10)
          const backoff = retryAfter > 0
            ? Math.min(retryAfter * 1000, 30_000)
            : Math.min(2000 * Math.pow(2, attempt), 10_000)
          logger.warn({ url, status: response.status, attempt, backoff }, 'WhatsApp request rate-limited / 5xx, retrying')
          await new Promise(r => setTimeout(r, backoff))
          lastError = err
          continue
        }
        logger.error({ error: err, url, endpoint, status: response.status }, 'WhatsApp Official API request failed')
        throw err
      }

      return data as T
    }

    throw lastError ?? new Error('WhatsApp request failed after retries')
  }

  /**
   * Get phone number info — used to test connection
   */
  async getPhoneNumberInfo(): Promise<WabaPhoneNumberInfo> {
    return this.request<WabaPhoneNumberInfo>(
      `/${this.phoneNumberId}?fields=id,verified_name,display_phone_number,quality_rating`
    )
  }

  /**
   * Send a plain text message
   *
   * @param to - Recipient phone number (E.164 format, e.g. "5511987654321")
   * @param text - Message text
   */
  async sendTextMessage(to: string, text: string): Promise<WabaSendMessageResponse> {
    return this.request<WabaSendMessageResponse>(
      `/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizePhone(to),
          type: 'text',
          text: { preview_url: false, body: text }
        })
      }
    )
  }

  /**
   * Send an interactive message with up to 3 quick-reply buttons.
   * Each button has an id (sent back as a webhook reply) and a title (shown to user, max 20 chars).
   */
  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<WabaSendMessageResponse> {
    if (buttons.length === 0 || buttons.length > 3) {
      throw new Error('Interactive button messages require 1-3 buttons')
    }
    const truncated = buttons.map(b => ({
      id: b.id,
      title: b.title.length > 20 ? b.title.slice(0, 20) : b.title,
    }))
    return this.request<WabaSendMessageResponse>(
      `/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizePhone(to),
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: bodyText },
            action: {
              buttons: truncated.map(b => ({
                type: 'reply',
                reply: { id: b.id, title: b.title },
              })),
            },
          },
        }),
      }
    )
  }

  /**
   * Send an interactive list message (up to 10 rows across sections).
   * Better than buttons when you have more than 3 options.
   */
  async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>
  ): Promise<WabaSendMessageResponse> {
    return this.request<WabaSendMessageResponse>(
      `/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizePhone(to),
          type: 'interactive',
          interactive: {
            type: 'list',
            body: { text: bodyText },
            action: {
              button: buttonText.length > 20 ? buttonText.slice(0, 20) : buttonText,
              sections,
            },
          },
        }),
      }
    )
  }

  /**
   * Send a location pin to a contact.
   */
  async sendLocationMessage(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<WabaSendMessageResponse> {
    return this.request<WabaSendMessageResponse>(
      `/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizePhone(to),
          type: 'location',
          location: { latitude, longitude, name, address },
        }),
      }
    )
  }

  /**
   * Send a pre-approved template message
   *
   * Templates must be approved by Meta before use.
   */
  async sendTemplateMessage(params: WabaSendTemplateParams): Promise<WabaSendMessageResponse> {
    const { to, templateName, language, components } = params

    const body: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizePhone(to),
      type: 'template',
      template: {
        name: templateName,
        language: { code: language }
      }
    }

    if (components?.length) {
      body.template.components = components
    }

    return this.request<WabaSendMessageResponse>(
      `/${this.phoneNumberId}/messages`,
      { method: 'POST', body: JSON.stringify(body) }
    )
  }

  /**
   * Download media from Meta servers given a media_id.
   * Returns the binary buffer and MIME type.
   */
  async downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    // Step 1: get the download URL from Meta
    const url = `${GRAPH_API_BASE}/${mediaId}`
    const metaRes = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    })
    const meta = await metaRes.json()
    if (!metaRes.ok) throw new Error(`Meta media info error: ${meta?.error?.message || metaRes.status}`)
    if (!meta.url) throw new Error(`Meta media: no url for id ${mediaId}`)

    // Step 2: download the binary
    const binRes = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    })
    if (!binRes.ok) throw new Error(`Meta media download failed: ${binRes.status}`)

    const arrayBuffer = await binRes.arrayBuffer()
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: meta.mime_type || 'application/octet-stream',
    }
  }

  /**
   * Upload media to Meta servers and return a media_id.
   * Must use multipart/form-data — do NOT set Content-Type manually (fetch handles boundary).
   */
  async uploadMedia(blob: Blob, mimeType: string, filename: string): Promise<string> {
    const url = `${GRAPH_API_BASE}/${this.phoneNumberId}/media`
    const form = new FormData()
    form.append('messaging_product', 'whatsapp')
    form.append('type', mimeType)
    form.append('file', blob, filename)

    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: form,
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(`Meta media upload error: ${data?.error?.message || response.status}`)
    }
    return data.id as string
  }

  /**
   * Send an audio message using a previously uploaded media_id.
   * ptt=true makes it render as a voice note (push-to-talk) in WhatsApp.
   */
  async sendAudioMessage(to: string, mediaId: string, ptt = true): Promise<WabaSendMessageResponse> {
    return this.request<WabaSendMessageResponse>(
      `/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizePhone(to),
          type: 'audio',
          audio: { id: mediaId },
        }),
      }
    )
  }

  async sendImageMessage(to: string, mediaId: string, caption?: string): Promise<WabaSendMessageResponse> {
    return this.request<WabaSendMessageResponse>(
      `/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizePhone(to),
          type: 'image',
          image: { id: mediaId, ...(caption ? { caption } : {}) },
        }),
      }
    )
  }

  async sendDocumentMessage(to: string, mediaId: string, filename: string, caption?: string): Promise<WabaSendMessageResponse> {
    return this.request<WabaSendMessageResponse>(
      `/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizePhone(to),
          type: 'document',
          document: { id: mediaId, filename, ...(caption ? { caption } : {}) },
        }),
      }
    )
  }

  /**
   * Mark an incoming message as read
   *
   * @param messageId - The wamid of the received message
   */
  async markAsRead(messageId: string): Promise<void> {
    await this.request(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      })
    })
  }

  /**
   * Test connection by fetching phone number info
   */
  async testConnection(): Promise<{ success: boolean; error?: string; info?: WabaPhoneNumberInfo }> {
    try {
      const info = await this.getPhoneNumberInfo()

      if (info?.id) {
        return { success: true, info }
      }

      return { success: false, error: 'Resposta inválida da API Meta' }
    } catch (error: any) {
      logger.error({ error, phoneNumberId: this.phoneNumberId }, 'WhatsApp Official connection test failed')

      return {
        success: false,
        error: error.message || 'Erro ao conectar com a API do WhatsApp'
      }
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize phone number to E.164 format (digits only, with country code)
 *
 * Examples:
 * - "+55 11 98765-4321" → "5511987654321"
 * - "(11) 98765-4321"   → "5511987654321" (assumes Brazil)
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

/**
 * Get a WhatsApp Official client for an organization.
 *
 * Returns null if:
 * - Organization not found or not on PRO/BUSINESS plan
 * - WABA integration not enabled or not fully configured
 * - Rate limit exceeded
 */
export async function getWhatsAppOfficialClient(
  organizationId: string
): Promise<WhatsAppOfficialClient | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      wabaEnabled: true,
      wabaPhoneNumberId: true,
      wabaAccessToken: true,
      plan: true
    }
  })

  if (!org || !['PRO', 'BUSINESS'].includes(org.plan)) {
    return null
  }

  if (
    !org.wabaEnabled ||
    !org.wabaPhoneNumberId ||
    !org.wabaAccessToken
  ) {
    return null
  }

  const accessToken = decrypt(org.wabaAccessToken)

  return new WhatsAppOfficialClient(org.wabaPhoneNumberId, accessToken)
}

/**
 * Log WhatsApp Official activity to IntegrationLog
 */
export async function logWabaActivity(
  organizationId: string,
  action: string,
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING',
  request?: any,
  response?: any,
  errorMessage?: string
): Promise<void> {
  try {
    await prisma.integrationLog.create({
      data: {
        organizationId,
        type: 'WHATSAPP_OFFICIAL',
        action,
        status,
        request: request || undefined,
        response: response || undefined,
        errorMessage: errorMessage || undefined
      }
    })
  } catch (error) {
    logger.error({ error, organizationId, action }, 'Failed to log WABA activity')
  }
}
