import { z } from 'zod'

/**
 * Deal validators
 */
export const createDealSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  value: z.number().optional().nullable(),
  stageId: z.string().uuid('Invalid stage ID'),
  pipelineId: z.string().uuid('Invalid pipeline ID').optional(),
  contactId: z.string().uuid('Invalid contact ID').optional().nullable(),
  closeDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable()
})

export const updateDealSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  value: z.number().optional().nullable(),
  stageId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional().nullable(),
  closeDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable()
})

/**
 * Contact validators
 */
export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(255).optional().nullable()
})

export const updateContactSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(255).optional().nullable()
})

/**
 * Pipeline validators
 */
export const createPipelineSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  isDefault: z.boolean().optional(),
  stages: z.array(z.object({
    name: z.string().min(1).max(255),
    order: z.number().int().min(0)
  })).min(1, 'At least one stage is required')
})

export const updatePipelineSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isDefault: z.boolean().optional()
})

/**
 * Webhook validators
 */
export const createWebhookSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  description: z.string().max(255).optional(),
  events: z.array(z.string()).min(1, 'At least one event is required')
})

export const updateWebhookSchema = z.object({
  url: z.string().url('Invalid webhook URL').optional(),
  description: z.string().max(255).optional(),
  events: z.array(z.string()).min(1, 'At least one event is required').optional(),
  enabled: z.boolean().optional()
})

/**
 * Generic UUID validator
 */
export const uuidSchema = z.string().uuid('Invalid ID format')

/**
 * Helper to validate and parse request body
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.Schema<T>
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodIssue[] }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return {
        success: false,
        errors: result.error.issues
      }
    }

    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    return {
      success: false,
      errors: [{
        code: z.ZodIssueCode.custom,
        path: [],
        message: 'Invalid JSON in request body'
      }]
    }
  }
}
