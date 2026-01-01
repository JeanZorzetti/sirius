import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

/**
 * Custom render function that wraps components with common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options })
}

/**
 * Generate a random UUID for testing
 */
export function generateTestUUID(): string {
  return crypto.randomUUID()
}

/**
 * Create a mock user session
 */
export function createMockSession(overrides?: {
  id?: string
  email?: string
  name?: string
  organizationId?: string
}) {
  return {
    user: {
      id: overrides?.id || generateTestUUID(),
      email: overrides?.email || 'test@example.com',
      name: overrides?.name || 'Test User',
      organizationId: overrides?.organizationId || generateTestUUID(),
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

/**
 * Create a mock organization
 */
export function createMockOrganization(overrides?: {
  id?: string
  name?: string
  slug?: string
}) {
  return {
    id: overrides?.id || generateTestUUID(),
    name: overrides?.name || 'Test Organization',
    slug: overrides?.slug || 'test-org',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Create a mock user
 */
export function createMockUser(overrides?: {
  id?: string
  email?: string
  name?: string
  password?: string
  organizationId?: string
  orgRole?: 'OWNER' | 'MEMBER'
}) {
  return {
    id: overrides?.id || generateTestUUID(),
    email: overrides?.email || 'test@example.com',
    name: overrides?.name || 'Test User',
    password: overrides?.password || '$2a$10$hashedpassword',
    organizationId: overrides?.organizationId || generateTestUUID(),
    orgRole: overrides?.orgRole || 'OWNER',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Create a mock deal
 */
export function createMockDeal(overrides?: {
  id?: string
  title?: string
  value?: number
  stageId?: string
  organizationId?: string
  contactId?: string
  ownerId?: string
}) {
  return {
    id: overrides?.id || generateTestUUID(),
    title: overrides?.title || 'Test Deal',
    value: overrides?.value || 5000,
    stageId: overrides?.stageId || generateTestUUID(),
    organizationId: overrides?.organizationId || generateTestUUID(),
    contactId: overrides?.contactId || generateTestUUID(),
    ownerId: overrides?.ownerId || generateTestUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Create a mock contact
 */
export function createMockContact(overrides?: {
  id?: string
  name?: string
  email?: string
  phone?: string
  organizationId?: string
}) {
  return {
    id: overrides?.id || generateTestUUID(),
    name: overrides?.name || 'Test Contact',
    email: overrides?.email || 'contact@example.com',
    phone: overrides?.phone || '+5511999999999',
    organizationId: overrides?.organizationId || generateTestUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Create a mock pipeline stage
 */
export function createMockPipelineStage(overrides?: {
  id?: string
  name?: string
  order?: number
  organizationId?: string
}) {
  return {
    id: overrides?.id || generateTestUUID(),
    name: overrides?.name || 'Test Stage',
    order: overrides?.order ?? 0,
    organizationId: overrides?.organizationId || generateTestUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'
