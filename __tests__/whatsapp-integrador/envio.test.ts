// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.setConfig({ testTimeout: 60_000 })

const m = vi.hoisted(() => {
  process.env.INTEGRATION_ENCRYPTION_KEY = 'ab'.repeat(32)
  const state = {
    conexoes: [] as any[],
    mensagens: [] as any[],
    contatos: [
      { id: 'c-a', organizationId: 'org-a', name: 'Maria', phone: '(11) 98765-4321' },
      { id: 'c-b', organizationId: 'org-b', name: 'Outra', phone: '5521999998888' },
    ],
    tier: 'STARTER',
  }
  const usuario = { id: 'u-1', name: 'Vendedor', organizationId: 'org-a', orgRole: 'VENDEDOR', pipelineRestricted: false, allowedPipelineIds: [] }
  const prisma: any = {
    user: { findUnique: vi.fn(async () => usuario) },
    organization: { findUnique: vi.fn(async () => ({ tier: state.tier, trialEndsAt: null, trialStatus: null })) },
    contact: {
      findFirst: vi.fn(async ({ where }: any) => state.contatos.find((c) => c.id === where.id && c.organizationId === where.organizationId) ?? null),
    },
  }
  const casa = (x: any, where: any) => Object.entries(where).every(([k, v]: [string, any]) => {
    if (k === 'sentAt') return true
    if (v && typeof v === 'object' && 'in' in v) return v.in.includes(x[k])
    return x[k] === v
  })
  const prismaWa: any = {
    whatsAppConnection: {
      findFirst: vi.fn(async ({ where }: any) => state.conexoes.find((c) => c.id === where.id && c.organizationId === where.organizationId) ?? null),
      updateMany: vi.fn(async ({ where, data }: any) => {
        const c = state.conexoes.find((x) => x.id === where.id && x.organizationId === where.organizationId && x.status === where.status)
        if (c) Object.assign(c, data)
        return { count: c ? 1 : 0 }
      }),
    },
    whatsAppMessage: {
      findFirst: vi.fn(async ({ where }: any) => [...state.mensagens].reverse().find((x) => casa(x, where)) ?? null),
      count: vi.fn(async ({ where }: any) => state.mensagens.filter((x) => casa(x, where)).length),
      create: vi.fn(async ({ data }: any) => {
        const linha = { id: `m-${state.mensagens.length + 1}`, deliveredAt: null, readAt: null, mediaUrl: null, mediaType: null, replyToId: null, replyToText: null, erro: null, messageId: null, ...data }
        state.mensagens.push(linha)
        return linha
      }),
      update: vi.fn(async ({ where, data }: any) => {
        if (data.messageId && state.mensagens.some((x) => x.messageId === data.messageId && x.organizationId === 'org-a')) {
          throw Object.assign(new Error('Unique constraint'), { code: 'P2002' })
        }
        return Object.assign(state.mensagens.find((x) => x.id === where.id), data)
      }),
      delete: vi.fn(async ({ where }: any) => {
        state.mensagens = state.mensagens.filter((x) => x.id !== where.id)
        return {}
      }),
    },
  }
  const adaptador = {
    enviarTexto: vi.fn(async (..._a: any[]) => ({ messageId: 'wa-novo' })),
    enviarMidia: vi.fn(async (..._a: any[]) => ({ messageId: 'wa-midia' })),
  }
  return { state, prisma, prismaWa, adaptador }
})

vi.mock('@/lib/prisma', () => ({ prisma: m.prisma }))
vi.mock('@/lib/prisma-wa', () => ({ prismaWa: m.prismaWa }))
vi.mock('@/lib/auth', () => ({ getSession: vi.fn(async () => ({ user: { id: 'u-1', email: 'vendedor@conta.com' } })) }))
vi.mock('@/lib/storage', () => ({ uploadMedia: vi.fn(async () => 'org-a/c-a/m.jpeg') }))
vi.mock('@/lib/notifications', () => ({ createNotifications: vi.fn(async () => ({ count: 0 })) }))
vi.mock('@/lib/integrations/whatsapp-official-client', () => ({ getWhatsAppOfficialClient: vi.fn(async () => null) }))
vi.mock('@/lib/whatsapp/integradores', async (original) => ({
  ...(await original<typeof import('@/lib/whatsapp/integradores')>()),
  adaptador: () => m.adaptador,
}))

import { cifrarCredenciais } from '@/lib/whatsapp/integradores/conexao'
import { RecusaIntegrador, FalhaIntegrador } from '@/lib/whatsapp/integradores/tipos'

const conexao = (id: string, extra: Record<string, unknown> = {}) => ({
  id, organizationId: 'org-a', provider: 'ZAPI', status: 'CONNECTED', statusMudouEm: null, connectedAt: new Date(), phoneNumber: '5511999990000',
  apiKey: cifrarCredenciais({ provider: 'ZAPI', instanceId: 'I', token: 'T' }), ...extra,
})
const entrada = (connectionId: string | null, text = 'oi') =>
  m.state.mensagens.push({ id: `in-${m.state.mensagens.length}`, organizationId: 'org-a', contactId: 'c-a', connectionId, direction: 'INBOUND', text, sentAt: new Date() })

const texto = (corpo: Record<string, unknown>) =>
  import('@/app/api/whatsapp/send-message/route').then(({ POST }) =>
    POST(new Request('https://crm.test/api/whatsapp/send-message', { method: 'POST', body: JSON.stringify(corpo) }) as never))
const midia = (arquivo: File, extra: Record<string, string> = {}) =>
  import('@/app/api/whatsapp/send-media/route').then(({ POST }) => {
    const form = new FormData()
    form.append('file', arquivo)
    form.append('contactId', 'c-a')
    form.append('connectionId', 'conn-1')
    for (const [k, v] of Object.entries(extra)) form.append(k, v)
    return POST(new Request('https://crm.test/api/whatsapp/send-media', { method: 'POST', body: form }) as never)
  })

beforeEach(() => {
  vi.clearAllMocks()
  m.state.conexoes = [conexao('conn-1'), conexao('conn-2', { phoneNumber: '5511999991111' }), { ...conexao('conn-x'), organizationId: 'org-b' }]
  m.state.mensagens = []
  m.state.tier = 'STARTER'
})

describe('POST /api/whatsapp/send-message', () => {
  it('contato ou conexão de outra conta dá 404, sem chamar o integrador', async () => {
    expect((await texto({ contactId: 'c-b', connectionId: 'conn-1', message: 'oi' })).status).toBe(404)
    expect((await texto({ contactId: 'c-a', connectionId: 'conn-x', message: 'oi' })).status).toBe(404)
    expect(m.adaptador.enviarTexto).not.toHaveBeenCalled()
  })

  it('connectionId diferente da conexão da conversa dá 409', async () => {
    entrada('conn-2')
    const res = await texto({ contactId: 'c-a', connectionId: 'conn-1', message: 'oi' })
    expect(res.status).toBe(409)
    expect((await res.json()).error).toMatch(/outro número/)
    entrada(null) // the last message came through the official API
    expect((await texto({ contactId: 'c-a', connectionId: 'conn-2', message: 'oi' })).status).toBe(409)
    expect(m.adaptador.enviarTexto).not.toHaveBeenCalled()
  })

  it('contato que nunca escreveu sai por uma conexão da conta, com 201', async () => {
    const res = await texto({ contactId: 'c-a', connectionId: 'conn-2', message: 'Olá, Maria' })
    expect(res.status).toBe(201)
    expect(m.adaptador.enviarTexto).toHaveBeenCalledWith(expect.anything(), '5511987654321', 'Olá, Maria')
    expect(await res.json()).toMatchObject({ direction: 'OUTBOUND', status: 'SENT', messageId: 'wa-novo', connectionId: 'conn-2' })
  })

  it('conexão fora de CONNECTED dá 409 com o estado e o motivo', async () => {
    m.state.conexoes[0] = conexao('conn-1', { status: 'DISCONNECTED', statusMotivo: 'sessão caiu' })
    const res = await texto({ contactId: 'c-a', connectionId: 'conn-1', message: 'oi' })
    expect(res.status).toBe(409)
    expect((await res.json()).error).toMatch(/sessão caiu/)
  })

  it('recusa do integrador grava FAILED com o erro e responde 502; RecusaIntegrador leva a conexão para FAILED', async () => {
    m.adaptador.enviarTexto.mockRejectedValueOnce(new FalhaIntegrador('o integrador respondeu 500', 500))
    const res = await texto({ contactId: 'c-a', connectionId: 'conn-1', message: 'oi' })
    expect(res.status).toBe(502)
    const corpo = await res.json()
    expect(corpo.mensagem).toMatchObject({ status: 'FAILED', erro: expect.stringMatching(/500/) })
    expect(m.state.conexoes[0].status).toBe('CONNECTED')

    m.adaptador.enviarTexto.mockRejectedValueOnce(new RecusaIntegrador('token', 'o integrador recusou a credencial (401)'))
    expect((await texto({ contactId: 'c-a', connectionId: 'conn-1', message: 'oi' })).status).toBe(502)
    expect(m.state.conexoes[0].status).toBe('FAILED')
  })

  it('o eco que chega antes do id apaga a linha pendente e devolve a do eco', async () => {
    m.adaptador.enviarTexto.mockImplementationOnce(async () => {
      m.state.mensagens.push({ id: 'eco', organizationId: 'org-a', messageId: 'wa-eco', contactId: 'c-a', connectionId: 'conn-1', direction: 'OUTBOUND', status: 'SENT', text: 'oi', sentAt: new Date() })
      return { messageId: 'wa-eco' }
    })
    const res = await texto({ contactId: 'c-a', connectionId: 'conn-1', message: 'oi' })
    expect(res.status).toBe(201)
    expect((await res.json()).id).toBe('eco')
    expect(m.state.mensagens.filter((x) => x.direction === 'OUTBOUND')).toHaveLength(1)
  })

  it('as travas da seção 6.5 recusam com 409 antes de gravar: "SAIR" e o limite por minuto', async () => {
    entrada('conn-1', 'SAIR')
    const res = await texto({ contactId: 'c-a', connectionId: 'conn-1', message: 'oi' })
    expect(res.status).toBe(409)
    expect((await res.json()).error).toMatch(/pediu para parar/)
    entrada('conn-1', 'voltei')
    for (let i = 0; i < 20; i++) m.state.mensagens.push({ id: `out-${i}`, organizationId: 'org-a', connectionId: 'conn-1', direction: 'OUTBOUND', sentAt: new Date() })
    const cheio = await texto({ contactId: 'c-a', connectionId: 'conn-1', message: 'oi' })
    expect(cheio.status).toBe(409)
    expect((await cheio.json()).error).toMatch(/aguarde/)
    expect(m.prismaWa.whatsAppMessage.create).not.toHaveBeenCalled()
    expect(m.adaptador.enviarTexto).not.toHaveBeenCalled()
  })

  it('conta sem plano pago dá 409', async () => {
    m.state.tier = 'FREE'
    expect((await texto({ contactId: 'c-a', connectionId: 'conn-1', message: 'oi' })).status).toBe(409)
  })
})

describe('POST /api/whatsapp/send-media', () => {
  it('mídia acima do limite dá 413 e tipo fora dá 415, antes de qualquer chamada', async () => {
    const grande = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'foto.jpg', { type: 'image/jpeg' })
    const r413 = await midia(grande)
    expect(r413.status).toBe(413)
    expect((await r413.json()).error).toMatch(/5 MB/)
    const r415 = await midia(new File(['x'], 'app.exe', { type: 'application/x-msdownload' }))
    expect(r415.status).toBe(415)
    expect(m.adaptador.enviarMidia).not.toHaveBeenCalled()
    expect(m.prismaWa.whatsAppMessage.create).not.toHaveBeenCalled()
  })

  it('imagem sai em base64 pelo integrador, com cópia no storage', async () => {
    const res = await midia(new File(['jpg'], 'foto.jpg', { type: 'image/jpeg' }), { caption: 'segue' })
    expect(res.status).toBe(201)
    const [, para, arquivo] = m.adaptador.enviarMidia.mock.calls[0]
    expect(para).toBe('5511987654321')
    expect(arquivo).toMatchObject({ tipo: 'image', mimetype: 'image/jpeg', legenda: 'segue' })
    expect(await res.json()).toMatchObject({ mediaType: 'image', mediaUrl: 'org-a/c-a/m.jpeg', status: 'SENT' })
  })
})
