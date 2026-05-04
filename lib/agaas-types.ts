export interface AgentOverride {
  displayName?: string
  systemPrompt?: string
  confidenceThreshold?: number // 0-100
}

export interface IAConfig {
  agaasEnabled?: boolean
  quotaLimit?: number
  quotaUsed?: number
  agents?: Record<string, boolean>
  enabledAgents?: Record<string, boolean>
  confidenceThreshold?: number
  maxActionsPerDay?: number
  operatingHoursStart?: string
  operatingHoursEnd?: string
  weekendsEnabled?: boolean
  agentOverrides?: Record<string, AgentOverride>
  [key: string]: unknown
}
