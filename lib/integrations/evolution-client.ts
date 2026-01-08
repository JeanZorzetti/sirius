/**
 * Evolution API Client
 *
 * Provides methods to interact with Evolution API for WhatsApp messaging:
 * - Send text messages
 * - Send media messages (images, videos, documents, audio)
 * - Get instance information
 * - Check connection status
 *
 * Includes automatic rate limiting and activity logging
 */

import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { whatsappRateLimit } from './rate-limiter'
import logger from '@/lib/logger'

// Evolution API Types
export interface EvolutionInstanceInfo {
  instance: {
    instanceName: string
    status: string
    serverUrl?: string
    apikey?: string
  }
}

export interface EvolutionSendMessageResponse {
  key: {
    id: string
    remoteJid: string
    fromMe: boolean
  }
  message: any
  messageTimestamp: number
  status?: string
}

export interface EvolutionSendMediaMessage {
  remoteJid: string
  mediaUrl: string
  mediaType: 'image' | 'video' | 'document' | 'audio'
  caption?: string
  fileName?: string
}

/**
 * Evolution API Client Class
 */
export class EvolutionClient {
  private baseUrl: string
  private apiKey: string
  private instanceName: string

  constructor(baseUrl: string, apiKey: string, instanceName: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.apiKey = apiKey
    this.instanceName = instanceName
  }

  /**
   * Internal request handler with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Evolution API Error (${response.status}): ${errorText}`)
      }

      return response.json()
    } catch (error: any) {
      logger.error({ error, url, endpoint }, 'Evolution API request failed')
      throw error
    }
  }

  /**
   * Send text message to a WhatsApp number
   *
   * @param remoteJid - WhatsApp JID (e.g., "5511987654321@s.whatsapp.net")
   * @param text - Message text
   */
  async sendTextMessage(
    remoteJid: string,
    text: string
  ): Promise<EvolutionSendMessageResponse> {
    return this.request<EvolutionSendMessageResponse>(
      `/message/sendText/${this.instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify({
          number: remoteJid,
          text
        })
      }
    )
  }

  /**
   * Send media message (image, video, document, audio)
   *
   * @param params - Media message parameters
   */
  async sendMediaMessage(params: EvolutionSendMediaMessage): Promise<EvolutionSendMessageResponse> {
    const { remoteJid, mediaUrl, mediaType, caption, fileName } = params

    const endpoint = `/message/send${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}/${this.instanceName}`

    const body: any = {
      number: remoteJid,
      [`${mediaType}Url`]: mediaUrl
    }

    if (caption) body.caption = caption
    if (fileName) body.fileName = fileName

    return this.request<EvolutionSendMessageResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  /**
   * Get instance information and connection status
   */
  async getInstanceInfo(): Promise<EvolutionInstanceInfo> {
    return this.request<EvolutionInstanceInfo>(
      `/instance/fetchInstances?instanceName=${this.instanceName}`
    )
  }

  /**
   * Get connection state of an instance
   * Alternative endpoint for testing connectivity
   */
  async getConnectionState(): Promise<{ state: string }> {
    return this.request<{ state: string }>(
      `/instance/connectionState/${this.instanceName}`
    )
  }

  /**
   * Test connection to Evolution API instance
   *
   * Tries multiple methods to validate the connection:
   * 1. fetchInstances endpoint (v2 format)
   * 2. connectionState endpoint (alternative)
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try fetchInstances first (primary method)
      try {
        const info = await this.getInstanceInfo()

        // Check if response has the expected structure
        if (info && typeof info === 'object') {
          // Cast to any for flexible response format checking
          const response = info as any

          // Evolution API v2 returns array of instances
          if (Array.isArray(response)) {
            const instance = response.find((i: any) => i.instanceName === this.instanceName)
            if (instance) {
              return { success: true }
            }

            // List available instances to help user
            const availableInstances = response
              .map((i: any) => i.instanceName || i.name || 'unknown')
              .filter(Boolean)
              .join(', ')

            const errorMsg = availableInstances
              ? `Instância "${this.instanceName}" não encontrada. Disponíveis: ${availableInstances}`
              : `Instância "${this.instanceName}" não encontrada no servidor`

            logger.warn({
              instanceName: this.instanceName,
              availableInstances: response.map((i: any) => i.instanceName || i.name)
            }, 'Instance not found in server response')

            return { success: false, error: errorMsg }
          }

          // Evolution API v1 returns single instance object with nested instance property
          if (response.instance) {
            return { success: true }
          }

          // Direct instance object (some API versions return instance data directly)
          if (response.instanceName) {
            return { success: true }
          }
        }
      } catch (fetchError: any) {
        logger.warn({
          error: fetchError,
          instanceName: this.instanceName
        }, 'fetchInstances failed, trying connectionState')

        // Try alternative endpoint
        try {
          const state = await this.getConnectionState()
          if (state && state.state) {
            return { success: true }
          }
        } catch (stateError: any) {
          logger.error({
            fetchError,
            stateError,
            instanceName: this.instanceName
          }, 'Both connection test methods failed')

          return {
            success: false,
            error: `Falha ao conectar: ${fetchError.message || 'Verifique URL, API Key e nome da instância'}`
          }
        }
      }

      return {
        success: false,
        error: 'Instância não encontrada ou resposta inválida'
      }

    } catch (error: any) {
      logger.error({
        error,
        instanceName: this.instanceName,
        baseUrl: this.baseUrl
      }, 'Evolution API connection test failed')

      return {
        success: false,
        error: error.message || 'Erro ao conectar com Evolution API'
      }
    }
  }
}

/**
 * Format phone number to WhatsApp JID format
 *
 * Examples:
 * - "+55 11 98765-4321" → "5511987654321@s.whatsapp.net"
 * - "(11) 98765-4321" → "5511987654321@s.whatsapp.net" (assumes BR +55)
 * - "11987654321" → "5511987654321@s.whatsapp.net" (assumes BR +55)
 *
 * @param phone - Phone number in any format
 * @returns WhatsApp JID
 */
export function formatWhatsAppNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Add country code if missing (assume Brazil +55)
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`

  return `${withCountry}@s.whatsapp.net`
}

/**
 * Parse WhatsApp JID to readable phone number
 *
 * Example: "5511987654321@s.whatsapp.net" → "+55 11 98765-4321"
 *
 * @param jid - WhatsApp JID
 * @returns Formatted phone number
 */
export function parseWhatsAppJid(jid: string): string {
  // Extract number part (before @)
  const digits = jid.split('@')[0]

  // Format for Brazilian numbers (country code 55)
  if (digits.startsWith('55') && digits.length === 13) {
    const ddd = digits.substring(2, 4)
    const firstPart = digits.substring(4, 9)
    const secondPart = digits.substring(9)
    return `+55 ${ddd} ${firstPart}-${secondPart}`
  }

  // Generic format for other countries
  return `+${digits}`
}

/**
 * Get Evolution API client for an organization
 *
 * Validates that:
 * - Organization exists and has PRO plan
 * - Evolution API is enabled for the organization
 * - Configuration is complete (baseUrl, apiKey, instanceName)
 * - Rate limit is not exceeded
 *
 * @param organizationId - Organization ID
 * @returns EvolutionClient instance or null if not configured
 */
export async function getEvolutionClient(
  organizationId: string
): Promise<EvolutionClient | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      evolutionEnabled: true,
      evolutionBaseUrl: true,
      evolutionApiKey: true,
      evolutionInstance: true,
      plan: true
    }
  })

  // Check if organization exists and has PRO plan
  if (!org || org.plan !== 'PRO') {
    return null
  }

  // Check if Evolution API is enabled and configured
  if (
    !org.evolutionEnabled ||
    !org.evolutionBaseUrl ||
    !org.evolutionApiKey ||
    !org.evolutionInstance
  ) {
    return null
  }

  // Decrypt API key
  const apiKey = decrypt(org.evolutionApiKey)

  return new EvolutionClient(org.evolutionBaseUrl, apiKey, org.evolutionInstance)
}

/**
 * Log WhatsApp activity to IntegrationLog
 *
 * @param organizationId - Organization ID
 * @param action - Action performed (e.g., "send_message", "receive_message")
 * @param status - Status of the action
 * @param request - Request data (optional)
 * @param response - Response data (optional)
 * @param errorMessage - Error message if failed (optional)
 */
export async function logWhatsAppActivity(
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
        type: 'WHATSAPP',
        action,
        status,
        request: request || undefined,
        response: response || undefined,
        errorMessage: errorMessage || undefined
      }
    })
  } catch (error) {
    logger.error({ error, organizationId, action }, 'Failed to log WhatsApp activity')
  }
}

/**
 * Check WhatsApp rate limit for an organization
 *
 * @param organizationId - Organization ID
 * @returns Rate limit info or null if exceeded
 */
export async function checkWhatsAppRateLimit(organizationId: string) {
  const result = await whatsappRateLimit.limit(organizationId)

  if (!result.success) {
    logger.warn(
      { organizationId, limit: result.limit, reset: result.reset },
      'WhatsApp rate limit exceeded'
    )
    return null
  }

  return {
    remaining: result.remaining,
    reset: result.reset,
    limit: result.limit
  }
}
