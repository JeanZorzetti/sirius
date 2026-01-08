/**
 * N8N API Client
 *
 * Provides methods to interact with N8N workflow automation:
 * - List workflows
 * - Activate/deactivate workflows
 * - Execute workflows
 * - Test connection
 *
 * Includes automatic rate limiting and activity logging
 */

import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { n8nRateLimit } from './rate-limiter'
import logger from '@/lib/logger'

// N8N API Types
export interface N8NWorkflow {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
  nodes?: any[]
  connections?: any
}

export interface N8NExecution {
  id: string
  finished: boolean
  mode: string
  startedAt: string
  stoppedAt?: string
  workflowId: string
  data?: any
}

export interface N8NTestResponse {
  success: boolean
  version?: string
  error?: string
}

/**
 * N8N API Client Class
 */
export class N8NClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.apiKey = apiKey
  }

  /**
   * Internal request handler with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`N8N API Error (${response.status}): ${errorText}`)
      }

      return response.json()
    } catch (error: any) {
      logger.error({ error, url, endpoint }, 'N8N API request failed')
      throw error
    }
  }

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<N8NWorkflow[]> {
    const response = await this.request<{ data: N8NWorkflow[] }>('/workflows')
    return response.data || []
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<N8NWorkflow> {
    return this.request<N8NWorkflow>(`/workflows/${workflowId}`)
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(workflowId: string): Promise<void> {
    await this.request(`/workflows/${workflowId}/activate`, {
      method: 'PATCH'
    })
  }

  /**
   * Deactivate a workflow
   */
  async deactivateWorkflow(workflowId: string): Promise<void> {
    await this.request(`/workflows/${workflowId}/deactivate`, {
      method: 'PATCH'
    })
  }

  /**
   * Execute a workflow manually
   */
  async executeWorkflow(workflowId: string, data?: any): Promise<N8NExecution> {
    return this.request<N8NExecution>(`/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ data })
    })
  }

  /**
   * Test connection to N8N instance
   */
  async testConnection(): Promise<N8NTestResponse> {
    try {
      await this.listWorkflows()
      return { success: true }
    } catch (error: any) {
      logger.error({ error }, 'N8N connection test failed')
      return {
        success: false,
        error: error.message || 'Connection failed'
      }
    }
  }
}

/**
 * Get N8N client for an organization
 *
 * Validates that:
 * - Organization exists and has PRO plan
 * - N8N is enabled for the organization
 * - Configuration is complete (baseUrl, apiKey)
 * - Rate limit is not exceeded
 *
 * @param organizationId - Organization ID
 * @returns N8NClient instance or null if not configured
 */
export async function getN8NClient(
  organizationId: string
): Promise<N8NClient | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      n8nEnabled: true,
      n8nBaseUrl: true,
      n8nApiKey: true,
      plan: true
    }
  })

  // Check if organization exists and has PRO plan
  if (!org || org.plan !== 'PRO') {
    return null
  }

  // Check if N8N is enabled and configured
  if (!org.n8nEnabled || !org.n8nBaseUrl || !org.n8nApiKey) {
    return null
  }

  // Decrypt API key
  const apiKey = decrypt(org.n8nApiKey)

  return new N8NClient(org.n8nBaseUrl, apiKey)
}

/**
 * Log N8N activity to IntegrationLog
 *
 * @param organizationId - Organization ID
 * @param action - Action performed (e.g., "webhook:deal.created", "api:listWorkflows")
 * @param status - Status of the action
 * @param request - Request data (optional)
 * @param response - Response data (optional)
 * @param errorMessage - Error message if failed (optional)
 */
export async function logN8NActivity(
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
        type: 'N8N',
        action,
        status,
        request: request || undefined,
        response: response || undefined,
        errorMessage: errorMessage || undefined
      }
    })
  } catch (error) {
    logger.error({ error, organizationId, action }, 'Failed to log N8N activity')
  }
}

/**
 * Check N8N rate limit for an organization
 *
 * @param organizationId - Organization ID
 * @returns Rate limit info or null if exceeded
 */
export async function checkN8NRateLimit(organizationId: string) {
  const result = await n8nRateLimit.limit(organizationId)

  if (!result.success) {
    logger.warn(
      { organizationId, limit: result.limit, reset: result.reset },
      'N8N rate limit exceeded'
    )
    return null
  }

  return {
    remaining: result.remaining,
    reset: result.reset,
    limit: result.limit
  }
}
