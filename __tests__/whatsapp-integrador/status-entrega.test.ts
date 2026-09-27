// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

/** A tiny in-memory table: updateMany applies the where the code builds, so the test checks behavior, not the call. */
const m = vi.hoisted(() => {
  const linhas: { organizationId: string; messageId: string; status: string; erro?: string | null }[] = []
  const prismaWa: any = {
    whatsAppMessage: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0
        for (const l of linhas) {
          if (l.organizationId === where.organizationId && where.messageId.in.includes(l.messageId) && where.status.in.includes(l.status)) {
            Object.assign(l, data)
            count++
          }
        }
        return { count }
      }),
    },
  }
  return { linhas, prismaWa }
})

vi.mock('@/lib/prisma-wa', () => ({ prismaWa: m.prismaWa }))
vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { avancarStatus } from '@/lib/whatsapp/entrada'

const status = () => m.linhas[0].status

beforeEach(() => {
  m.linhas.length = 0
})

const com = (s: string) => m.linhas.push({ organizationId: 'org-a', messageId: 'wamid-1', status: s })

describe('estado da mensagem só anda para frente (FR-016)', () => {
  it('READ seguido de DELIVERED fica READ', async () => {
    com('SENT')
    await avancarStatus('org-a', ['wamid-1'], 'READ')
    await avancarStatus('org-a', ['wamid-1'], 'DELIVERED')
    expect(status()).toBe('READ')
  })

  it('FAILED não passa por cima de DELIVERED', async () => {
    com('DELIVERED')
    await avancarStatus('org-a', ['wamid-1'], 'FAILED')
    expect(status()).toBe('DELIVERED')
  })

  it('FAILED entra sobre PENDING e SENT, com o motivo', async () => {
    for (const inicial of ['PENDING', 'SENT']) {
      m.linhas.length = 0
      com(inicial)
      await avancarStatus('org-a', ['wamid-1'], 'FAILED', { erro: 'número não tem WhatsApp' })
      expect(status(), inicial).toBe('FAILED')
      expect(m.linhas[0].erro).toBe('número não tem WhatsApp')
    }
  })

  it('outra conta não é tocada', async () => {
    m.linhas.push({ organizationId: 'org-b', messageId: 'wamid-1', status: 'SENT' })
    await avancarStatus('org-a', ['wamid-1'], 'READ')
    expect(status()).toBe('SENT')
  })
})
