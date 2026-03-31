/**
 * Whatsmeow Gateway Client
 *
 * Client for the self-hosted whatsmeow gateway at whatsmeow.roilabs.com.br
 * API: https://github.com/JeanZorzetti/whatsmeow-gateway
 */

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || ''
const GATEWAY_API_KEY = process.env.WHATSAPP_GATEWAY_API_KEY || ''

interface GatewayInstance {
  id: string
  name: string
  organizationId: string
  status: string
  jid: string | null
  phoneNumber: string | null
  createdAt: string
}

interface SendTextResponse {
  messageId: string
  timestamp: number
}

async function gatewayFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': GATEWAY_API_KEY,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gateway error ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

export const whatsmeowClient = {
  async createInstance(name: string, organizationId: string): Promise<GatewayInstance> {
    return gatewayFetch('/api/instances', {
      method: 'POST',
      body: JSON.stringify({ name, organizationId }),
    })
  },

  async listInstances(organizationId: string): Promise<GatewayInstance[]> {
    return gatewayFetch(`/api/instances?organizationId=${encodeURIComponent(organizationId)}`)
  },

  async getInstance(instanceId: string): Promise<GatewayInstance> {
    return gatewayFetch(`/api/instances/${instanceId}`)
  },

  async getStatus(instanceId: string): Promise<{ status: string; connected: boolean }> {
    return gatewayFetch(`/api/instances/${instanceId}/status`)
  },

  async restartInstance(instanceId: string): Promise<void> {
    await gatewayFetch(`/api/instances/${instanceId}/restart`, { method: 'PUT' })
  },

  async deleteInstance(instanceId: string): Promise<void> {
    await gatewayFetch(`/api/instances/${instanceId}`, { method: 'DELETE' })
  },

  async sendText(instanceId: string, number: string, text: string): Promise<SendTextResponse> {
    return gatewayFetch(`/api/instances/${instanceId}/messages/text`, {
      method: 'POST',
      body: JSON.stringify({ number, text }),
    })
  },

  /** Returns the SSE URL for streaming QR codes (to be used client-side) */
  getQRStreamURL(instanceId: string): string {
    return `${GATEWAY_URL}/api/instances/${instanceId}/qr`
  },
}
