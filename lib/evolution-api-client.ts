/**
 * Evolution API Client
 *
 * Cliente TypeScript para integração com Evolution API (WhatsApp)
 */

import logger from './logger'
import { decrypt } from './encryption'
import { prisma } from './prisma'

// Lazy validation - only validate when actually used (not during build)
function getConfig() {
  if (!process.env.EVOLUTION_API_URL) {
    throw new Error('EVOLUTION_API_URL environment variable is required')
  }
  if (!process.env.EVOLUTION_API_KEY) {
    throw new Error('EVOLUTION_API_KEY environment variable is required')
  }
  return {
    url: process.env.EVOLUTION_API_URL,
    key: process.env.EVOLUTION_API_KEY,
  }
}

// ============================================
// Types
// ============================================

export type InstanceStatus =
  | 'created'
  | 'connecting'
  | 'open'
  | 'close'
  | 'qr'

export interface CreateInstanceParams {
  instanceName: string
  qrcode?: boolean
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS'
  webhookUrl?: string
  webhookEvents?: string[]
}

export interface InstanceInfo {
  instanceName: string
  status: InstanceStatus
  phoneNumber?: string
  owner?: string
}

export interface QRCodeResponse {
  base64: string
  code: string
  pairingCode?: string
}

export interface ConnectionState {
  instance: {
    instanceName: string
    status: InstanceStatus
  }
  state: InstanceStatus
}

export interface SendTextMessageParams {
  instanceName: string
  number: string // Format: 5511999999999@s.whatsapp.net
  text: string
  delay?: number
}

export interface SendMediaMessageParams {
  instanceName: string
  number: string
  mediatype: 'image' | 'video' | 'audio' | 'document'
  media: string // URL or base64
  caption?: string
  fileName?: string
}

export interface Message {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  pushName?: string
  message?: {
    conversation?: string
    extendedTextMessage?: {
      text: string
    }
  }
  messageTimestamp: number
}

// ============================================
// Evolution API Client Class
// ============================================

export class EvolutionAPIClient {
  private baseURL: string
  private apiKey: string

  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL.replace(/\/$/, '') // Remove trailing slash
    this.apiKey = apiKey
  }

  /**
   * Make authenticated request to Evolution API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error({
        url,
        status: response.status,
        error: errorText,
      }, 'Evolution API request failed')

      throw new Error(
        `Evolution API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  // ============================================
  // Instance Management
  // ============================================

  /**
   * Create a new WhatsApp instance
   */
  async createInstance(params: CreateInstanceParams): Promise<InstanceInfo> {
    logger.info({ instanceName: params.instanceName }, 'Creating Evolution API instance')

    return this.request<InstanceInfo>('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: params.instanceName,
        qrcode: params.qrcode ?? true,
        integration: params.integration ?? 'WHATSAPP-BAILEYS',
        webhook: params.webhookUrl,
        webhook_by_events: false,
        events: params.webhookEvents ?? [
          'QRCODE_UPDATED',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'CONNECTION_UPDATE',
          'CONTACTS_UPSERT',
          'CHATS_UPSERT',
        ],
      }),
    })
  }

  /**
   * Get instance info
   */
  async getInstance(instanceName: string): Promise<InstanceInfo> {
    return this.request<InstanceInfo>(
      `/instance/fetchInstances?instanceName=${instanceName}`
    )
  }

  /**
   * Delete instance
   */
  async deleteInstance(instanceName: string): Promise<{ status: string }> {
    logger.info({ instanceName }, 'Deleting Evolution API instance')

    return this.request<{ status: string }>(
      `/instance/delete/${instanceName}`,
      { method: 'DELETE' }
    )
  }

  /**
   * Logout and disconnect instance
   */
  async logoutInstance(instanceName: string): Promise<{ status: string }> {
    logger.info({ instanceName }, 'Logging out Evolution API instance')

    return this.request<{ status: string }>(
      `/instance/logout/${instanceName}`,
      { method: 'DELETE' }
    )
  }

  /**
   * Restart instance
   */
  async restartInstance(instanceName: string): Promise<{ status: string }> {
    logger.info({ instanceName }, 'Restarting Evolution API instance')

    return this.request<{ status: string }>(
      `/instance/restart/${instanceName}`,
      { method: 'PUT' }
    )
  }

  // ============================================
  // Connection & QR Code
  // ============================================

  /**
   * Get QR Code for connection
   */
  async getQRCode(instanceName: string): Promise<QRCodeResponse> {
    return this.request<QRCodeResponse>(
      `/instance/connect/${instanceName}`
    )
  }

  /**
   * Get connection state
   */
  async getConnectionState(instanceName: string): Promise<ConnectionState> {
    return this.request<ConnectionState>(
      `/instance/connectionState/${instanceName}`
    )
  }

  /**
   * Check if instance is connected
   */
  async isConnected(instanceName: string): Promise<boolean> {
    try {
      const state = await this.getConnectionState(instanceName)
      return state.state === 'open'
    } catch (error) {
      return false
    }
  }

  // ============================================
  // Send Messages
  // ============================================

  /**
   * Send text message
   */
  async sendTextMessage(params: SendTextMessageParams): Promise<Message> {
    logger.info({
      instanceName: params.instanceName,
      to: params.number,
    }, 'Sending WhatsApp text message')

    return this.request<Message>(
      `/message/sendText/${params.instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify({
          number: params.number,
          text: params.text,
          delay: params.delay ?? 0,
        }),
      }
    )
  }

  /**
   * Send media message (image, video, audio, document)
   */
  async sendMediaMessage(params: SendMediaMessageParams): Promise<Message> {
    logger.info({
      instanceName: params.instanceName,
      to: params.number,
      mediatype: params.mediatype,
    }, 'Sending WhatsApp media message')

    return this.request<Message>(
      `/message/sendMedia/${params.instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify({
          number: params.number,
          mediatype: params.mediatype,
          media: params.media,
          caption: params.caption,
          fileName: params.fileName,
        }),
      }
    )
  }

  // ============================================
  // Contacts & Chats
  // ============================================

  /**
   * Get all contacts
   */
  async getContacts(instanceName: string): Promise<any[]> {
    return this.request<any[]>(
      `/chat/findContacts/${instanceName}`
    )
  }

  /**
   * Get all chats
   */
  async getChats(instanceName: string): Promise<any[]> {
    return this.request<any[]>(
      `/chat/findChats/${instanceName}`
    )
  }

  /**
   * Get messages from a chat
   */
  async getMessages(
    instanceName: string,
    remoteJid: string,
    limit: number = 50
  ): Promise<Message[]> {
    return this.request<Message[]>(
      `/chat/findMessages/${instanceName}?remoteJid=${remoteJid}&limit=${limit}`
    )
  }

  // ============================================
  // Utility
  // ============================================

  /**
   * Format phone number to WhatsApp format
   * Input: "11999999999" or "+5511999999999"
   * Output: "5511999999999@s.whatsapp.net"
   */
  formatPhoneNumber(phone: string): string {
    // Remove tudo exceto números
    let cleaned = phone.replace(/\D/g, '')

    // Adicionar código do Brasil se não tiver
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      cleaned = '55' + cleaned
    }

    // Adicionar sufixo do WhatsApp
    return `${cleaned}@s.whatsapp.net`
  }

  /**
   * Parse WhatsApp number to phone
   * Input: "5511999999999@s.whatsapp.net"
   * Output: "+55 11 99999-9999"
   */
  parsePhoneNumber(whatsappNumber: string): string {
    const cleaned = whatsappNumber.replace('@s.whatsapp.net', '')

    if (cleaned.startsWith('55') && cleaned.length === 13) {
      // Formato brasileiro: +55 11 99999-9999
      const ddd = cleaned.substring(2, 4)
      const firstPart = cleaned.substring(4, 9)
      const secondPart = cleaned.substring(9)
      return `+55 ${ddd} ${firstPart}-${secondPart}`
    }

    return `+${cleaned}`
  }

  /**
   * Extract text from message object
   */
  getMessageText(message: Message): string {
    return (
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      ''
    )
  }
}

// ============================================
// Create client from organization config
// ============================================

/**
 * Create an EvolutionAPIClient using the organization's stored config.
 * Falls back to EVOLUTION_API_URL / EVOLUTION_API_KEY env vars if the
 * organization doesn't have its own credentials configured.
 * Returns null only if neither source is available.
 */
export async function getOrgEvolutionClient(
  organizationId: string
): Promise<EvolutionAPIClient | null> {
  // 1. Tentar credenciais da organização (banco de dados)
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      evolutionEnabled: true,
      evolutionBaseUrl: true,
      evolutionApiKey: true,
    },
  })

  if (org?.evolutionEnabled && org.evolutionBaseUrl && org.evolutionApiKey) {
    try {
      const apiKey = decrypt(org.evolutionApiKey)
      logger.info({ organizationId }, 'Using org-level Evolution API config')
      return new EvolutionAPIClient(org.evolutionBaseUrl, apiKey)
    } catch (err) {
      logger.error({ error: err, organizationId }, 'Failed to decrypt org Evolution API key, falling back to env vars')
    }
  }

  // 2. Fallback: variáveis de ambiente globais
  if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) {
    logger.info({ organizationId }, 'Using env var Evolution API config (fallback)')
    return new EvolutionAPIClient(
      process.env.EVOLUTION_API_URL,
      process.env.EVOLUTION_API_KEY
    )
  }

  // 3. Nenhuma configuração disponível
  logger.warn({ organizationId }, 'No Evolution API configuration found (neither org nor env vars)')
  return null
}

// ============================================
// Singleton Instance (Lazy) - requires env vars
// ============================================

let _instance: EvolutionAPIClient | null = null

function getEvolutionApiInstance(): EvolutionAPIClient {
  if (!_instance) {
    const config = getConfig()
    _instance = new EvolutionAPIClient(config.url, config.key)
  }
  return _instance
}

export const evolutionApi = new Proxy({} as EvolutionAPIClient, {
  get(target, prop) {
    const instance = getEvolutionApiInstance()
    const value = (instance as any)[prop]
    return typeof value === 'function' ? value.bind(instance) : value
  }
})

export default evolutionApi
