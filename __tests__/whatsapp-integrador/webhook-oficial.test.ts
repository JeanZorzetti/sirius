// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.setConfig({ testTimeout: 60_000 })

/** In-memory tables, so the real registrarEntrada/avancarStatus run behind the official route */
const m = vi.hoisted(() => {
  const state = { contatos: [] as any[], mensagens: [] as any[], pendentes: [] as (() => Promise<unknown>)[] }
  const prisma: any = {
    organization: { findFirst: vi.fn(async () => ({ id: 'org-a', wabaAppSecret: null })) },
    contact: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async ({ data }: any) => {
        const c = { id: `c-${state.contatos.length + 1}`, ...data }
        state.contatos.push(c)
        return c
      }),
    },
    $queryRaw: vi.fn(async () => state.contatos),
    integrationLog: { create: vi.fn(async () => ({})) },
  }
  const prismaWa: any = {
    whatsAppMessage: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async ({ data }: any) => {
        if (state.mensagens.some((x) => x.organizationId === data.organizationId && x.messageId === data.messageId)) {
          throw Object.assign(new Error('Unique constraint'), { code: 'P2002' })
        }
        const linha = { id: `m-${state.mensagens.length + 1}`, ...data }
        state.mensagens.push(linha)
        return linha
      }),
      update: vi.fn(async () => ({})),
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0
        for (const l of state.mensagens) {
          if (l.organizationId === where.organizationId && where.messageId.in.includes(l.messageId) && where.status.in.includes(l.status)) {
            Object.assign(l, data)
            count++
          }
        }
        return { count }
      }),
    },
  }
  return { state, prisma, prismaWa, agenteMensagem: vi.fn(async () => {}), agenteContato: vi.fn(async () => {}) }
})

vi.mock('@/lib/prisma', () => ({ prisma: m.prisma }))
vi.mock('@/lib/prisma-wa', () => ({ prismaWa: m.prismaWa }))
vi.mock('@/lib/meta-assinatura', () => ({ assinaturaMetaValida: () => true }))
vi.mock('@/lib/agaas-agent-trigger', () => ({ triggerAgentsForInboundMessage: m.agenteMensagem, triggerAgentsForContactCreated: m.agenteContato }))
vi.mock('@/lib/webhooks', () => ({ dispatchWebhookAsync: vi.fn(), WEBHOOK_EVENTS: { WHATSAPP_MESSAGE_IN: 'whatsapp.message.in' } }))
vi.mock('@/lib/storage', () => ({ uploadMedia: vi.fn() }))
vi.mock('@/lib/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('next/server', async (original) => ({
  ...(await original<typeof import('next/server')>()),
  after: (tarefa: () => Promise<unknown>) => { m.state.pendentes.push(tarefa) },
}))

const mensagem = (id: string) => ({
  object: 'whatsapp_business_account',
  entry: [{ id: 'waba-1', changes: [{ field: 'messages', value: {
    contacts: [{ profile: { name: 'Maria' }, wa_id: '5511987654321' }],
    messages: [{ from: '5511987654321', id, timestamp: '1790000000', type: 'text', text: { body: 'quero um orçamento' } }],
  } }] }],
})
const estado = (id: string, status: string) => ({
  object: 'whatsapp_business_account',
  entry: [{ id: 'waba-1', changes: [{ field: 'messages', value: { statuses: [{ id, status, timestamp: '1790000100', recipient_id: '5511987654321' }] } }] }],
})
const enviar = (corpo: unknown) =>
  import('@/app/api/webhooks/whatsapp-official/route').then(({ POST }) =>
    POST(new Request('https://crm.test/api/webhooks/whatsapp-official', { method: 'POST', body: JSON.stringify(corpo) })))
const processar = async () => {
  for (const t of m.state.pendentes.splice(0)) await t()
}

beforeEach(() => {
  vi.clearAllMocks()
  m.state.contatos = []
  m.state.mensagens = []
  m.state.pendentes = []
})

describe('webhook da API oficial, pela entrada única', () => {
  it('o 200 sai antes do processamento', async () => {
    const res = await enviar(mensagem('wamid.A'))
    expect(res.status).toBe(200)
    expect(m.state.mensagens).toHaveLength(0)
    await processar()
    expect(m.state.mensagens).toHaveLength(1)
  })

  it('o mesmo wamid três vezes dá uma mensagem', async () => {
    for (let i = 0; i < 3; i++) await enviar(mensagem('wamid.B'))
    await processar()
    expect(m.state.mensagens.filter((x) => x.messageId === 'wamid.B')).toHaveLength(1)
    expect(m.state.mensagens[0]).toMatchObject({ connectionId: null, direction: 'INBOUND', remoteJid: '5511987654321' })
  })

  it('read seguido de delivered fica READ', async () => {
    m.state.mensagens.push({ id: 'm-x', organizationId: 'org-a', messageId: 'wamid.C', status: 'SENT' })
    await enviar(estado('wamid.C', 'read'))
    await enviar(estado('wamid.C', 'delivered'))
    await processar()
    expect(m.state.mensagens[0].status).toBe('READ')
  })

  it('o agente de IA continua disparando, e só uma vez por mensagem', async () => {
    await enviar(mensagem('wamid.D'))
    await enviar(mensagem('wamid.D'))
    await processar()
    expect(m.agenteMensagem).toHaveBeenCalledTimes(1)
    expect(m.agenteMensagem).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-a', messageText: 'quero um orçamento' }))
    expect(m.agenteContato).toHaveBeenCalledTimes(1)
  })
})
