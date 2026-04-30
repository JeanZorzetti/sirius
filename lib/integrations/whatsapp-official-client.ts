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
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${GRAPH_API_BASE}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      const data = await response.json()

      if (!response.ok) {
        const errMsg = data?.error?.message || `HTTP ${response.status}`
        throw new Error(`Meta API Error: ${errMsg}`)
      }

      return data as T
    } catch (error: any) {
      logger.error({ error, url, endpoint }, 'WhatsApp Official API request failed')
      throw error
    }
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
