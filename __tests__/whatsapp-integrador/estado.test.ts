// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.setConfig({ testTimeout: 60_000 })

const m = vi.hoisted(() => {
  process.env.INTEGRATION_ENCRYPTION_KEY = 'ab'.repeat(32)
  process.env.CRON_SECRET = 'segredo-do-cron'
  const state = { conexoes: [] as any[], tiers: {} as Record<string, string> }
  const prismaWa: any = {
    whatsAppConnection: {
      findMany: vi.fn(async ({ where }: any) => state.conexoes.filter((c) => c.id !== where?.NOT?.id).map((c) => ({ ...c }))),
      findFirst: vi.fn(async () => null),
      // the conditional update, as PostgreSQL does it: only one of two concurrent callers changes the row
      updateMany: vi.fn(async ({ where, data }: any) => {
        const c = state.conexoes.find((x) => x.id === where.id && x.organizationId === where.organizationId && (!where.status || x.status === where.status))
        if (c) Object.assign(c, data)
        return { count: c ? 1 : 0 }
      }),
    },
  }
  const prisma: any = {
    user: { findMany: vi.fn(async () => [{ id: 'dono' }, { id: 'gerente' }]) },
    organization: {
      findMany: vi.fn(async () => Object.entries(state.tiers).map(([id, tier]) => ({ id, tier, trialEndsAt: null, trialStatus: null }))),
    },
  }
  const adaptador = { estado: vi.fn(), desligarAviso: vi.fn(async () => {}) }
  return { state, prismaWa, prisma, adaptador, notificar: vi.fn(async (..._a: any[]) => ({ count: 2 })) }
})

vi.mock('@/lib/prisma', () => ({ prisma: m.prisma }))
vi.mock('@/lib/prisma-wa', () => ({ prismaWa: m.prismaWa }))
vi.mock('@/lib/notifications', () => ({ createNotifications: m.notificar }))
vi.mock('@/lib/integrations/whatsapp-official-client', () => ({ getWhatsAppOfficialClient: vi.fn(async () => null) }))
vi.mock('@/lib/whatsapp/integradores', async (original) => ({
  ...(await original<typeof import('@/lib/whatsapp/integradores')>()),
  adaptador: () => m.adaptador,
}))

import { mudarEstado } from '@/lib/whatsapp/integradores/estado'
import { cifrarCredenciais } from '@/lib/whatsapp/integradores/conexao'
import { FalhaIntegrador, RecusaIntegrador } from '@/lib/whatsapp/integradores/tipos'
import { VERSAO_AVISO_INTEGRADOR } from '@/lib/termos'

const conexao = (extra: Record<string, unknown> = {}): any => ({
  id: 'conn-1', organizationId: 'org-a', provider: 'ZAPI', status: 'CONNECTED', statusMotivo: null,
  statusMudouEm: new Date(Date.now() - 60 * 60_000), connectedAt: new Date(Date.now() - 86_400_000), phoneNumber: '5511999990000',
  apiKey: cifrarCredenciais({ provider: 'ZAPI', instanceId: 'I', token: 'T' }), avisoVersao: VERSAO_AVISO_INTEGRADOR, ...extra,
})
const cron = (auth = 'Bearer segredo-do-cron') =>
  import('@/app/api/cron/whatsapp-integradores/route').then(({ GET }) =>
    GET(new Request('https://crm.test/api/cron/whatsapp-integradores', { headers: { authorization: auth } }) as never))

beforeEach(() => {
  vi.clearAllMocks()
  m.state.conexoes = [conexao()]
  m.state.tiers = { 'org-a': 'STARTER' }
})

describe('mudarEstado e o aviso de queda (FR-025, FR-026)', () => {
  it('aviso do integrador e cron concorrentes na mesma queda geram uma notificação, para dono e gerente', async () => {
    const lida = conexao()
    const [a, b] = await Promise.all([
      mudarEstado(lida, 'DISCONNECTED', 'o integrador avisou que o aparelho desconectou'),
      mudarEstado(lida, 'DISCONNECTED', 'o integrador perdeu a conexão com o WhatsApp'),
    ])
    expect([a, b].filter(Boolean)).toHaveLength(1)
    expect(m.notificar).toHaveBeenCalledTimes(1)
    const avisos = m.notificar.mock.calls[0][0]
    expect(avisos.map((n: any) => n.userId)).toEqual(['dono', 'gerente'])
    expect(avisos[0]).toMatchObject({ organizationId: 'org-a', type: 'SYSTEM', actionUrl: '/dashboard/chat' })
    expect(avisos[0].message).toMatch(/^WhatsApp \(Z-API\) desconectado desde \d{2}:\d{2}/)
    expect(avisos[0].message).toMatch(/reconectar/)
    expect(m.prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ organizationId: 'org-a', orgRole: { in: ['OWNER', 'GERENTE'] } }),
    }))
  })

  it('a volta para CONNECTED registra o tempo fora no motivo', async () => {
    m.state.conexoes = [conexao({ status: 'DISCONNECTED', statusMudouEm: new Date(Date.now() - 12 * 60_000) })]
    await mudarEstado(m.state.conexoes[0], 'CONNECTED', null)
    expect(m.state.conexoes[0]).toMatchObject({ status: 'CONNECTED', statusMotivo: 'voltou depois de 12 min fora' })
    expect(m.notificar).not.toHaveBeenCalled()
  })

  it('a desconexão pelo dono não notifica; a piora de uma queda já avisada também não', async () => {
    await mudarEstado(conexao(), 'DISCONNECTED', 'desconectada por Dono', { notificar: false })
    m.state.conexoes = [conexao({ status: 'DISCONNECTED' })]
    await mudarEstado(m.state.conexoes[0], 'FAILED', 'sessão encerrada no celular')
    expect(m.notificar).not.toHaveBeenCalled()
  })

  it('SUSPENDED notifica', async () => {
    await mudarEstado(conexao(), 'SUSPENDED', 'plano sem WhatsApp')
    expect(m.notificar).toHaveBeenCalledTimes(1)
    expect(m.notificar.mock.calls[0][0][0].message).toMatch(/plano/)
  })
})

describe('GET /api/cron/whatsapp-integradores', () => {
  it('sem o CRON_SECRET dá 401', async () => {
    expect((await cron('Bearer errado')).status).toBe(401)
  })

  it('queda que o integrador não avisou vira DISCONNECTED pelo cron, com uma notificação', async () => {
    m.adaptador.estado.mockResolvedValue({ status: 'DISCONNECTED', motivo: 'o integrador perdeu a conexão', phoneNumber: null })
    const res = await cron()
    expect(await res.json()).toMatchObject({ conferidas: 1, mudancas: 1, falhas: 0 })
    expect(m.state.conexoes[0].status).toBe('DISCONNECTED')
    expect(m.notificar).toHaveBeenCalledTimes(1)
  })

  it('erro de rede não muda o estado e conta em falhas', async () => {
    m.adaptador.estado.mockRejectedValue(new FalhaIntegrador('o integrador não respondeu em 10 s'))
    const corpo = await (await cron()).json()
    expect(corpo).toMatchObject({ conferidas: 1, mudancas: 0, falhas: 1 })
    expect(m.state.conexoes[0].status).toBe('CONNECTED')
  })

  it('credencial recusada leva a FAILED', async () => {
    m.adaptador.estado.mockRejectedValue(new RecusaIntegrador('token', 'o integrador recusou a credencial (401)'))
    await cron()
    expect(m.state.conexoes[0].status).toBe('FAILED')
  })

  it('conta sem plano pago fica SUSPENDED; de volta ao plano, a conexão volta ao estado do integrador', async () => {
    m.state.tiers = { 'org-a': 'FREE' }
    await cron()
    expect(m.state.conexoes[0].status).toBe('SUSPENDED')
    expect(m.adaptador.estado).not.toHaveBeenCalled()

    m.state.tiers = { 'org-a': 'PRO' }
    m.adaptador.estado.mockResolvedValue({ status: 'CONNECTED', motivo: null, phoneNumber: '5511999990000' })
    await cron()
    expect(m.state.conexoes[0].status).toBe('CONNECTED')
  })

  it('SUSPENDED com aviso de versão antiga pede novo aceite', async () => {
    m.state.conexoes = [conexao({ status: 'SUSPENDED', avisoVersao: '2020-01-01' })]
    await cron()
    expect(m.state.conexoes[0]).toMatchObject({ status: 'FAILED', statusMotivo: 'aceite o aviso novo para reativar' })
  })

  it('conexão ainda esperando o primeiro QR não vira queda', async () => {
    m.state.conexoes = [conexao({ status: 'CONNECTING', connectedAt: null })]
    m.adaptador.estado.mockResolvedValue({ status: 'FAILED', motivo: 'sessão encerrada no celular', phoneNumber: null })
    await cron()
    expect(m.state.conexoes[0].status).toBe('CONNECTING')
    expect(m.notificar).not.toHaveBeenCalled()
  })
})
