/** Spec 015: one door for contacts. Lead doors reuse by phone key or e-mail; new leads without owner go to round-robin. */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const m = vi.hoisted(() => ({
  prisma: { contact: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() } },
  distributeLead: vi.fn(),
}))
vi.mock('@/lib/prisma', () => ({ prisma: m.prisma }))
vi.mock('@/lib/round-robin', () => ({ distributeLead: m.distributeLead }))

import { registrarContato } from '@/lib/contacts/registrar-contato'

beforeEach(() => vi.clearAllMocks())

describe('registrarContato', () => {
  it('lead com o mesmo número (sem o 9 e sem +55) reusa o contato e só preenche a origem vazia', async () => {
    m.prisma.contact.findFirst.mockResolvedValue({ id: 'c1', name: 'Ana', assignedToId: null, source: null })
    const r = await registrarContato({
      organizationId: 'org', dados: { name: 'Ana', phone: '(11) 8765-4321' }, origem: 'facebook_ads', seExistir: 'reusar', distribuir: true,
    })
    expect(r.novo).toBe(false)
    const where = m.prisma.contact.findFirst.mock.calls[0][0].where
    expect(where.organizationId).toBe('org')
    expect(where.OR).toContainEqual({ phoneKey: '551187654321' })
    expect(m.prisma.contact.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { source: 'facebook_ads' } })
    expect(m.prisma.contact.create).not.toHaveBeenCalled()
    expect(m.distributeLead).not.toHaveBeenCalled()
  })

  it('lead novo sem dono vai para o rodízio; e-mail é gravado minúsculo', async () => {
    m.prisma.contact.findFirst.mockResolvedValue(null)
    m.prisma.contact.create.mockImplementation(async ({ data }: any) => ({ id: 'c2', ...data, assignedToId: null }))
    m.distributeLead.mockResolvedValue('vendedor-b')
    const r = await registrarContato({
      organizationId: 'org', dados: { name: 'Bia', email: ' Bia@X.com ', phone: '+55 11 98765-4321' }, origem: 'api', seExistir: 'reusar', distribuir: true,
    })
    expect(r.novo).toBe(true)
    expect(m.prisma.contact.create.mock.calls[0][0].data).toMatchObject({ email: 'bia@x.com', phoneKey: '551187654321', source: 'api', organizationId: 'org' })
    expect(m.distributeLead).toHaveBeenCalledWith('org', 'c2')
    expect(r.contato.assignedToId).toBe('vendedor-b')
  })

  it('pessoa digitando cria mesmo com número repetido e não distribui', async () => {
    m.prisma.contact.create.mockImplementation(async ({ data }: any) => ({ id: 'c3', ...data }))
    await registrarContato({ organizationId: 'org', dados: { name: 'Caio', phone: '11987654321' }, origem: 'manual', seExistir: 'criar', distribuir: false })
    expect(m.prisma.contact.findFirst).not.toHaveBeenCalled()
    expect(m.distributeLead).not.toHaveBeenCalled()
  })
})
