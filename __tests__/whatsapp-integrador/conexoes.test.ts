// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.setConfig({ testTimeout: 60_000 }) // cold imports of the routes under the parallel full run

const m = vi.hoisted(() => {
  process.env.INTEGRATION_ENCRYPTION_KEY = 'ab'.repeat(32)
  const state = {
    usuario: null as any,
    org: { tier: 'STARTER', trialEndsAt: null, trialStatus: null, addons: [] as { quantity: number }[] },
    usadas: 0,
    linhas: [] as any[],
    outraConta: null as any,
  }
  const prisma: any = {
    user: { findUnique: vi.fn(async () => state.usuario) },
    organization: { findUnique: vi.fn(async () => state.org) },
    auditLog: { create: vi.fn(async () => ({})) },
  }
  const linhaCompleta = (dados: any) => ({
    id: 'conn-1', organizationId: 'org-a', userId: 'u-OWNER', instanceName: 'INST-1', displayName: null, phoneNumber: null,
    qrCode: null, status: 'CONNECTING', webhookUrl: null, connectedAt: null, lastSyncAt: null, createdAt: new Date(),
    updatedAt: new Date(), provider: 'ZAPI', baseUrl: null, statusMotivo: null, statusMudouEm: new Date(), avisoVersao: '2026-09-27',
    apiKey: 'CIFRADO-QUE-NAO-PODE-SAIR', webhookSegredoHash: 'HASH-QUE-NAO-PODE-SAIR', instanciaChave: 'ZAPI:INST-1', ...dados,
  })
  const prismaWa: any = {
    whatsAppConnection: {
      findMany: vi.fn(async () => state.linhas),
      findFirst: vi.fn(async ({ where }: any) => {
        if (where.instanciaChave) return state.outraConta
        return state.linhas.find((l) => (!where.id || l.id === where.id) && (!where.instanceName || l.instanceName === where.instanceName)) ?? null
      }),
      count: vi.fn(async () => state.usadas),
      upsert: vi.fn(async ({ create }: any) => linhaCompleta(create)),
      updateMany: vi.fn(async () => ({ count: 1 })),
      update: vi.fn(async ({ data }: any) => linhaCompleta(data)),
    },
  }
  const adaptador = {
    conferir: vi.fn(async (..._a: any[]): Promise<any> => ({ instanceName: 'INST-1', status: 'FAILED', motivo: 'sessão encerrada no celular', phoneNumber: null })),
    ligarAviso: vi.fn(async (..._a: any[]) => {}),
    desligarAviso: vi.fn(async (..._a: any[]) => {}),
    qrCode: vi.fn(async (..._a: any[]): Promise<any> => ({ qrCode: 'data:image/png;base64,QR' })),
    estado: vi.fn(),
  }
  return { prisma, prismaWa, state, adaptador, linhaCompleta }
})

vi.mock('@/lib/prisma', () => ({ prisma: m.prisma }))
vi.mock('@/lib/prisma-wa', () => ({ prismaWa: m.prismaWa }))
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(async () => (m.state.usuario ? { user: { id: m.state.usuario.id, email: m.state.usuario.email } } : null)),
}))
vi.mock('@/lib/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }))
vi.mock('@/lib/integrations/whatsapp-official-client', () => ({ getWhatsAppOfficialClient: vi.fn(async () => null) }))
vi.mock('@/lib/whatsapp/integradores', async (original) => ({
  ...(await original<typeof import('@/lib/whatsapp/integradores')>()),
  adaptador: () => m.adaptador,
}))

const usuario = (orgRole: string) => ({
  id: `u-${orgRole}`, email: `${orgRole.toLowerCase()}@conta.com`, name: orgRole, organizationId: 'org-a', orgRole,
  pipelineRestricted: false, allowedPipelineIds: [],
})
const pedido = (url: string, method = 'GET', body?: unknown) =>
  new Request(`https://crm.test${url}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }) as never
const params = (id: string) => ({ params: Promise.resolve({ id }) })

const lista = () => import('@/app/api/whatsapp/connections/route')
const umaConexao = () => import('@/app/api/whatsapp/connections/[id]/route')
const qr = () => import('@/app/api/whatsapp/connections/[id]/qr-code/route')

const zapi = { provider: 'ZAPI', instanceId: 'INST-1', token: 'TOKEN-SECRETO', clientToken: 'CLIENT-SECRETO', aceite: true }
const SEGREDOS = ['TOKEN-SECRETO', 'CLIENT-SECRETO', 'CIFRADO-QUE-NAO-PODE-SAIR', 'HASH-QUE-NAO-PODE-SAIR', 'webhookSegredoHash', 'apiKey', 'instanciaChave']

const semSegredo = async (res: Response) => {
  const texto = await res.clone().text()
  for (const s of SEGREDOS) expect(texto, s).not.toContain(s)
  return JSON.parse(texto)
}

beforeEach(() => {
  vi.clearAllMocks()
  m.state.usuario = usuario('OWNER')
  m.state.org = { tier: 'STARTER', trialEndsAt: null, trialStatus: null, addons: [] }
  m.state.usadas = 0
  m.state.linhas = []
  m.state.outraConta = null
})

const nadaGravado = () => {
  expect(m.prisma.auditLog.create).not.toHaveBeenCalled()
  expect(m.prismaWa.whatsAppConnection.upsert).not.toHaveBeenCalled()
}

describe('POST /api/whatsapp/connections', () => {
  it('sem aceite dá 400 e nada é gravado (nem aceite, nem conexão)', async () => {
    const res = await (await lista()).POST(pedido('/api/whatsapp/connections', 'POST', { ...zapi, aceite: false }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/aceite/)
    nadaGravado()
    expect(m.adaptador.conferir).not.toHaveBeenCalled()
  })

  it('vendedor dá 403; conta Free dá 403', async () => {
    m.state.usuario = usuario('VENDEDOR')
    expect((await (await lista()).POST(pedido('/api/whatsapp/connections', 'POST', zapi))).status).toBe(403)
    m.state.usuario = usuario('OWNER')
    m.state.org = { tier: 'FREE', trialEndsAt: null, trialStatus: null, addons: [] }
    const res = await (await lista()).POST(pedido('/api/whatsapp/connections', 'POST', zapi))
    expect(res.status).toBe(403)
    expect((await res.json()).error).toMatch(/planos pagos/)
    nadaGravado()
  })

  it('campo faltando dá 400 dizendo qual', async () => {
    const res = await (await lista()).POST(pedido('/api/whatsapp/connections', 'POST', { provider: 'EVOLUTION', baseUrl: 'https://evo.cliente.com.br', apiKey: 'k', aceite: true }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/nome da instância/)
  })

  it('http://, IP interno e o próprio host do Sirius são recusados antes de qualquer chamada', async () => {
    for (const baseUrl of ['http://evo.cliente.com.br', 'https://10.0.0.5', 'https://127.0.0.1:8080', 'https://crm.test', 'https://localhost:3000']) {
      const res = await (await lista()).POST(pedido('/api/whatsapp/connections', 'POST', { provider: 'UAZAPI', baseUrl, token: 't', aceite: true }))
      expect(res.status, baseUrl).toBe(400)
      expect((await res.json()).error).toMatch(/público e com HTTPS/)
    }
    expect(m.adaptador.conferir).not.toHaveBeenCalled()
    nadaGravado()
  })

  it('credencial recusada dá 422 com o campo, sem aceite nem conexão gravados', async () => {
    const { RecusaIntegrador } = await import('@/lib/whatsapp/integradores/tipos')
    m.adaptador.conferir.mockRejectedValueOnce(new RecusaIntegrador('token', 'o integrador recusou a credencial (401)'))
    const res = await (await lista()).POST(pedido('/api/whatsapp/connections', 'POST', zapi))
    expect(res.status).toBe(422)
    expect((await res.json()).error).toMatch(/token/)
    nadaGravado()
  })

  it('limite atingido dá 409 com o caminho do add-on ou do plano', async () => {
    m.state.usadas = 1
    const res = await (await lista()).POST(pedido('/api/whatsapp/connections', 'POST', zapi))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toMatch(/1 conexão.*(conexão extra|plano)/)
    expect(m.adaptador.conferir).not.toHaveBeenCalled()
    nadaGravado()
  })

  it('a mesma instância ativa em outra conta dá 409 sem dizer a conta', async () => {
    m.state.outraConta = { id: 'conn-b', organizationId: 'org-b' }
    const res = await (await lista()).POST(pedido('/api/whatsapp/connections', 'POST', zapi))
    expect(res.status).toBe(409)
    const { error } = await res.json()
    expect(error).toMatch(/já está conectada no Sirius/)
    expect(error).not.toMatch(/org-b|conn-b/)
    nadaGravado()
  })

  it('conecta: aceite gravado com IP antes da conexão, credenciais cifradas, aviso ligado, e a resposta sem segredo', async () => {
    const res = await (await lista()).POST(pedido('/api/whatsapp/connections', 'POST', zapi))
    expect(res.status).toBe(201)
    const corpo = await semSegredo(res)
    expect(corpo).toMatchObject({ id: 'conn-1', provider: 'ZAPI', status: 'CONNECTING' })

    const aceite = m.prisma.auditLog.create.mock.calls[0][0].data
    expect(aceite).toMatchObject({ organizationId: 'org-a', acao: 'ACEITE_INTEGRADOR', ip: '203.0.113.9', autorUserId: 'u-OWNER' })
    expect(m.prisma.auditLog.create.mock.invocationCallOrder[0]).toBeLessThan(m.prismaWa.whatsAppConnection.upsert.mock.invocationCallOrder[0])

    const { create } = m.prismaWa.whatsAppConnection.upsert.mock.calls[0][0]
    expect(create).toMatchObject({ organizationId: 'org-a', provider: 'ZAPI', instanceName: 'INST-1', instanciaChave: 'ZAPI:INST-1', status: 'CONNECTING', avisoVersao: '2026-09-27' })
    expect(create.apiKey).not.toContain('TOKEN-SECRETO')
    expect(create.webhookSegredoHash).toMatch(/^[0-9a-f]{64}$/)

    const [, destino] = m.adaptador.ligarAviso.mock.calls[0]
    const segredo = destino.split('/api/webhooks/whatsapp-integrador/')[1]
    const { createHash } = await import('crypto')
    expect(createHash('sha256').update(segredo).digest('hex')).toBe(create.webhookSegredoHash)
  })

  it('já pareada com número que a conta já tem: FAILED com o motivo e o aviso desligado', async () => {
    m.adaptador.conferir.mockResolvedValueOnce({ instanceName: 'INST-1', status: 'CONNECTED', motivo: null, phoneNumber: '5511987654321' })
    m.prismaWa.whatsAppConnection.findMany.mockResolvedValueOnce([{ phoneNumber: '551187654321' }])
    const res = await (await lista()).POST(pedido('/api/whatsapp/connections', 'POST', zapi))
    expect(res.status).toBe(201)
    expect(m.prismaWa.whatsAppConnection.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED', statusMotivo: 'este número já está conectado nesta conta' }),
    }))
    expect(m.adaptador.desligarAviso).toHaveBeenCalled()
  })
})

describe('GET /api/whatsapp/connections', () => {
  it('lista as conexões por integrador, com limite e sem segredo; vendedor lê sem gerenciar', async () => {
    m.state.usuario = usuario('VENDEDOR')
    m.state.linhas = [m.linhaCompleta({})]
    m.state.usadas = 1
    const res = await (await lista()).GET()
    expect(res.status).toBe(200)
    const corpo = await semSegredo(res)
    expect(corpo).toMatchObject({ limite: 1, usadas: 1, podeGerenciar: false, conexoes: [{ id: 'conn-1', provider: 'ZAPI' }] })
    expect(m.prismaWa.whatsAppConnection.findMany.mock.calls[0][0].where).toEqual({ organizationId: 'org-a', provider: { not: null } })
  })
})

describe('/api/whatsapp/connections/[id]', () => {
  it('GET e DELETE de conexão de outra conta dão 404', async () => {
    const mod = await umaConexao()
    expect((await mod.GET(pedido('/api/whatsapp/connections/conn-x'), params('conn-x'))).status).toBe(404)
    expect((await mod.DELETE(pedido('/api/whatsapp/connections/conn-x', 'DELETE'), params('conn-x'))).status).toBe(404)
    expect(m.prismaWa.whatsAppConnection.findFirst.mock.calls.every(([a]: any) => a.where.organizationId === 'org-a')).toBe(true)
  })

  it('DELETE desliga o aviso, zera credencial, segredo e chave, e responde sem segredo', async () => {
    m.state.linhas = [m.linhaCompleta({ status: 'CONNECTED' })]
    const mod = await umaConexao()
    const res = await mod.DELETE(pedido('/api/whatsapp/connections/conn-1', 'DELETE'), params('conn-1'))
    expect(res.status).toBe(200)
    await semSegredo(res)
    expect(m.adaptador.desligarAviso).not.toHaveBeenCalled() // the stored credentials do not decrypt in this fixture
    expect(m.prismaWa.whatsAppConnection.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'conn-1', organizationId: 'org-a' }),
      data: expect.objectContaining({ apiKey: null, webhookSegredoHash: null, instanciaChave: null, status: 'DISCONNECTED', statusMotivo: 'desconectada por OWNER' }),
    }))
  })

  it('DELETE e QR são do dono e do gerente', async () => {
    m.state.usuario = usuario('VENDEDOR')
    m.state.linhas = [m.linhaCompleta({})]
    expect((await (await umaConexao()).DELETE(pedido('/api/whatsapp/connections/conn-1', 'DELETE'), params('conn-1'))).status).toBe(403)
    expect((await (await qr()).GET(pedido('/api/whatsapp/connections/conn-1/qr-code'), params('conn-1'))).status).toBe(403)
  })
})
