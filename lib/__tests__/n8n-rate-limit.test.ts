import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/encryption', () => ({ decrypt: vi.fn() }))

describe('checkN8NRateLimit', () => {
  it('lets the webhook through when Upstash is not configured', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const { checkN8NRateLimit } = await import('../integrations/n8n-client')

    await expect(checkN8NRateLimit('org_1')).resolves.not.toBeNull()
  })
})
