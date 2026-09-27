// @vitest-environment node
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.setConfig({ testTimeout: 60_000 })

const m = vi.hoisted(() => {
  process.env.INTEGRATION_ENCRYPTION_KEY = 'ab'.repeat(32)
  const state = { conexao: null as any, tier: 'STARTER', pendentes: [] as (() => Promise<unknown>)[] }
  const prismaWa: any = {
    whatsAppConnection: {
      findUnique: vi.fn(async ({ where }: any) => (state.conexao && where.webhookSegredoHash === state.conexao.webhookSegredoHash ? state.conexao : null)),
      findMany: vi.fn(async () => []),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
  }
  const prisma: any = {
    organization: { findUnique: vi.fn(async () => ({ tier: state.tier, trialEndsAt: null, trialStatus: null })) },
  }
  return { state, prismaWa, prisma, registrarEntrada: vi.fn(async () => ({ mensagemId: 'm-1', contactId: 'c-1', contactName: 'Maria', contatoNovo: false })), avancarStatus: vi.fn(async () => 1) }
})

vi.mock('@/lib/prisma', () => ({ prisma: m.prisma }))
vi.mock('@/lib/prisma-wa', () => ({ prismaWa: m.prismaWa }))
vi.mock('@/lib/integrations/whatsapp-official-client', () => ({ getWhatsAppOfficialClient: vi.fn(async () => null) }))
vi.mock('@/lib/whatsapp/entrada', () => ({ registrarEntrada: m.registrarEntrada, avancarStatus: m.avancarStatus }))
vi.mock('@/lib/notifications', () => ({ createNotifications: vi.fn(async () => ({ count: 0 })) }))
vi.mock('next/server', async (original) => ({
  ...(await original<typeof import('next/server')>()),
  after: (tarefa: () => Promise<unknown>) => { m.state.pendentes.push(tarefa) },
}))

const fixture = (provider: string, nome: string) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', provider, `${nome}.json`), 'utf8'))

const SEGREDO = 'segredo-de-teste-com-32-bytes-aleatorios'
const conexao = (extra: Record<string, unknown> = {}) => ({
  id: 'conn-1', organizationId: 'org-a', provider: 'ZAPI', status: 'CONNECTED', statusMudouEm: null, connectedAt: new Date(),
  apiKey: null, webhookSegredoHash: createHash('sha256').update(SEGREDO).digest('hex'), ...extra,
})
const aviso = (segredo: string, corpo: unknown) =>
  import('@/app/api/webhooks/whatsapp-integrador/[segredo]/route').then(({ POST }) =>
    POST(new Request(`https://crm.test/api/webhooks/whatsapp-integrador/${segredo}`, {
      method: 'POST', body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo), headers: { 'content-type': 'application/json' },
    }) as never, { params: Promise.resolve({ segredo }) }))
const processar = async () => {
  for (const t of m.state.pendentes.splice(0)) await t()
}

let logs: ReturnType<typeof vi.spyOn>[] = []
beforeEach(() => {
  vi.clearAllMocks()
  m.state.conexao = conexao()
  m.state.tier = 'STARTER'
  m.state.pendentes = []
  logs = (['log', 'info', 'warn', 'error', 'debug'] as const).map((n) => vi.spyOn(console, n).mockImplementation(() => {}))
})
afterEach(() => logs.forEach((l) => l.mockRestore()))

describe('POST /api/webhooks/whatsapp-integrador/[segredo]', () => {
  it('segredo errado ou ausente dá 404, sem gravar nem ler outra conta (SC-007)', async () => {
    for (const segredo of ['outro-segredo', 'x', '']) {
      const res = await aviso(segredo, fixture('zapi', 'texto'))
      expect(res.status, segredo).toBe(404)
    }
    await processar()
    expect(m.registrarEntrada).not.toHaveBeenCalled()
    expect(m.prisma.organization.findUnique).not.toHaveBeenCalled()
  })

  it('responde 200 antes de processar, e a mensagem sai com a conexão e a conta da própria conexão', async () => {
    const res = await aviso(SEGREDO, { ...fixture('zapi', 'texto'), instanceId: 'instancia-de-outra-conta' })
    expect(res.status).toBe(200)
    expect(m.registrarEntrada).not.toHaveBeenCalled()
    await processar()
    expect(m.registrarEntrada).toHaveBeenCalledWith('org-a', 'conn-1', expect.objectContaining({ messageId: '3EB0ZAPI0001' }), undefined)
  })

  it('o mesmo aviso três vezes chega à entrada três vezes, e a dedup dela deixa uma mensagem (SC-004)', async () => {
    m.registrarEntrada.mockResolvedValueOnce({ mensagemId: 'm-1', contactId: 'c-1', contactName: 'Maria', contatoNovo: false })
      .mockResolvedValueOnce(null as never).mockResolvedValueOnce(null as never)
    for (let i = 0; i < 3; i++) expect((await aviso(SEGREDO, fixture('zapi', 'texto'))).status).toBe(200)
    await processar()
    const ids = m.registrarEntrada.mock.calls.map((c: any[]) => c[2].messageId)
    expect(new Set(ids)).toEqual(new Set(['3EB0ZAPI0001']))
  })

  it('conta Free, conexão SUSPENDED ou FAILED: 200 sem gravar', async () => {
    m.state.tier = 'FREE'
    expect((await aviso(SEGREDO, fixture('zapi', 'texto'))).status).toBe(200)
    m.state.tier = 'STARTER'
    for (const status of ['SUSPENDED', 'FAILED']) {
      m.state.conexao = conexao({ status })
      expect((await aviso(SEGREDO, fixture('zapi', 'texto'))).status, status).toBe(200)
    }
    await processar()
    expect(m.registrarEntrada).not.toHaveBeenCalled()
  })

  it('grupo dá 200 sem gravar; corpo inválido dá 400', async () => {
    expect((await aviso(SEGREDO, fixture('zapi', 'grupo'))).status).toBe(200)
    expect((await aviso(SEGREDO, '{não é json')).status).toBe(400)
    await processar()
    expect(m.registrarEntrada).not.toHaveBeenCalled()
  })

  it('mensagem numa conexão DISCONNECTED é gravada e traz a conexão de volta', async () => {
    m.state.conexao = conexao({ status: 'DISCONNECTED', statusMudouEm: new Date(Date.now() - 12 * 60_000) })
    await aviso(SEGREDO, fixture('zapi', 'texto'))
    await processar()
    expect(m.registrarEntrada).toHaveBeenCalled()
    expect(m.prismaWa.whatsAppConnection.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'conn-1', organizationId: 'org-a', status: 'DISCONNECTED' }),
      data: expect.objectContaining({ status: 'CONNECTED' }),
    }))
  })

  it('entrega vira avancarStatus e queda vira mudança de estado', async () => {
    await aviso(SEGREDO, fixture('zapi', 'entrega-lida'))
    await aviso(SEGREDO, fixture('zapi', 'desconectado'))
    await processar()
    expect(m.avancarStatus).toHaveBeenCalledWith('org-a', ['3EB0SIRIUS01'], 'READ')
    expect(m.prismaWa.whatsAppConnection.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'DISCONNECTED' }),
    }))
  })

  it('o corpo cru nunca aparece em console.*', async () => {
    const corpo = { ...fixture('uazapi', 'texto'), token: 'TOKEN-DA-INSTANCIA-VAZADO' }
    m.state.conexao = conexao({ provider: 'UAZAPI' })
    await aviso(SEGREDO, corpo)
    await processar()
    const escrito = logs.flatMap((l) => l.mock.calls).map((c) => JSON.stringify(c)).join('\n')
    expect(escrito).not.toContain('TOKEN-DA-INSTANCIA-VAZADO')
    expect(escrito).not.toContain('Olá, quero um orçamento')
  })
})
