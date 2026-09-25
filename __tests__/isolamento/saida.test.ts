// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/email', () => ({ sendHtmlEmail: vi.fn() }))
vi.mock('@/lib/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }))

import { executeActions } from '@/lib/automations/actions'

const webhook = (webhookUrl: string) => [{ type: 'SEND_WEBHOOK', config: { webhookUrl } }] as never

describe('SEND_WEBHOOK de automação', () => {
  it.each([
    'http://127.0.0.1:5432/',
    'https://127.0.0.1/',
    'https://10.0.0.1/hook',
    'https://169.254.169.254/latest/meta-data/',
    'https://[::1]/',
    'https://localhost/hook',
    'http://hooks.example.com/sem-https',
  ])('recusa %s e registra o motivo na execução', async (url) => {
    const { actionsRun, errors } = await executeActions(webhook(url), { dealId: 'd1', triggerType: 'DEAL_MOVED' })
    expect(actionsRun).toBe(0)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/^SEND_WEBHOOK: endereço não permitido/)
  })
})
