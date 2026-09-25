// @vitest-environment node
import { createHmac } from 'crypto'
import { describe, it, expect, vi, beforeEach } from 'vitest'

process.env.INTEGRATION_ENCRYPTION_KEY = 'a'.repeat(64)
process.env.FACEBOOK_APP_SECRET = 'segredo-app-facebook'
process.env.INSTAGRAM_APP_SECRET = 'segredo-app-instagram'

const mocks = vi.hoisted(() => ({
  prisma: {
    organization: { findFirst: vi.fn() },
    contact: { findFirst: vi.fn(), create: vi.fn() },
    facebookLead: { create: vi.fn(), findUnique: vi.fn() },
  },
  prismaWa: {
    whatsAppMessage: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  },
  triggerAgentsForInboundMessage: vi.fn(() => Promise.resolve()),
  triggerAgentsForContactCreated: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/prisma-wa', () => ({ prismaWa: mocks.prismaWa }))
vi.mock('@/lib/agaas-agent-trigger', () => ({
  triggerAgentsForInboundMessage: mocks.triggerAgentsForInboundMessage,
  triggerAgentsForContactCreated: mocks.triggerAgentsForContactCreated,
}))
vi.mock('@/lib/storage', () => ({ uploadMedia: vi.fn() }))
vi.mock('@/lib/integrations/whatsapp-official-client', () => ({ logWabaActivity: vi.fn(), getWhatsAppOfficialClient: vi.fn() }))
vi.mock('@/lib/ads/facebook-lead-ads', () => ({ fetchLeadData: vi.fn() }))
vi.mock('@/lib/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }))

import { encrypt } from '@/lib/encryption'
import { POST as waba } from '@/app/api/webhooks/whatsapp-official/route'
import { POST as fbLeads } from '@/app/api/webhooks/facebook-leads/route'
import { POST as instagram } from '@/app/api/instagram/webhook/route'

const assinar = (corpo: string, segredo: string) => 'sha256=' + createHmac('sha256', segredo).update(corpo).digest('hex')
const pedido = (corpo: string, assinatura?: string) =>
  new Request('https://crm.test/api/webhooks/x', {
    method: 'POST',
    body: corpo,
    headers: assinatura ? { 'x-hub-signature-256': assinatura } : {},
  })

const mensagem = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{
    id: 'waba-conta-a',
    changes: [{ field: 'messages', value: {
      contacts: [{ profile: { name: 'Cliente' } }],
      messages: [{ from: '5511987654321', id: 'wamid.1', timestamp: '1758800000', type: 'text', text: { body: 'quero comprar' } }],
    } }],
  }],
})

describe('webhook do WhatsApp oficial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prismaWa.whatsAppMessage.findFirst.mockResolvedValue(null)
    mocks.prismaWa.whatsAppMessage.create.mockResolvedValue({ id: 'msg-db' })
    mocks.prisma.contact.findFirst.mockResolvedValue({ id: 'contato-a', name: 'Cliente' })
  })

  it('aceita o aviso assinado com o App Secret da conta e grava a mensagem', async () => {
    mocks.prisma.organization.findFirst.mockResolvedValue({ id: 'org-a', wabaAppSecret: encrypt('app-secret-da-conta-a') })
    const res = await waba(pedido(mensagem, assinar(mensagem, 'app-secret-da-conta-a')))
    expect(res.status).toBe(200)
    expect(mocks.prismaWa.whatsAppMessage.create).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['sem assinatura', undefined],
    ['assinada com outra chave', assinar(mensagem, 'chave-de-quem-forjou')],
  ])('recusa o aviso %s sem gravar nada nem acionar a IA', async (_caso, assinatura) => {
    mocks.prisma.organization.findFirst.mockResolvedValue({ id: 'org-a', wabaAppSecret: encrypt('app-secret-da-conta-a') })
    const res = await waba(pedido(mensagem, assinatura))
    expect(res.status).toBe(401)
    expect(mocks.prisma.contact.findFirst).not.toHaveBeenCalled()
    expect(mocks.prisma.contact.create).not.toHaveBeenCalled()
    expect(mocks.prismaWa.whatsAppMessage.create).not.toHaveBeenCalled()
    expect(mocks.triggerAgentsForInboundMessage).not.toHaveBeenCalled()
  })

  it('recusa quando a conta ainda não cadastrou o App Secret', async () => {
    mocks.prisma.organization.findFirst.mockResolvedValue({ id: 'org-a', wabaAppSecret: null })
    const res = await waba(pedido(mensagem, assinar(mensagem, 'qualquer')))
    expect(res.status).toBe(401)
    expect(mocks.prismaWa.whatsAppMessage.create).not.toHaveBeenCalled()
  })
})

describe('webhook do Facebook Leads', () => {
  const lead = JSON.stringify({ object: 'page', entry: [{ id: 'pagina-a', changes: [{ field: 'leadgen', value: { leadgen_id: 'l1' } }] }] })
  beforeEach(() => vi.clearAllMocks())

  it('assinado com o segredo do app: segue o fluxo', async () => {
    mocks.prisma.organization.findFirst.mockResolvedValue(null)
    const res = await fbLeads(pedido(lead, assinar(lead, 'segredo-app-facebook')))
    expect(res.status).toBe(200)
    expect(mocks.prisma.organization.findFirst).toHaveBeenCalled()
  })

  it('sem assinatura ou com outra chave: 401 e nada consultado', async () => {
    expect((await fbLeads(pedido(lead))).status).toBe(401)
    expect((await fbLeads(pedido(lead, assinar(lead, 'outra')))).status).toBe(401)
    expect(mocks.prisma.organization.findFirst).not.toHaveBeenCalled()
    expect(mocks.prisma.facebookLead.create).not.toHaveBeenCalled()
  })
})

describe('webhook do Instagram', () => {
  const evento = JSON.stringify({ object: 'instagram', entry: [] })
  it('só aceita assinado com o segredo do app', async () => {
    const aceito = await instagram(pedido(evento, assinar(evento, 'segredo-app-instagram')) as never)
    expect(aceito.status).toBe(200)
    expect((await instagram(pedido(evento) as never)).status).toBe(401)
    expect((await instagram(pedido(evento, assinar(evento, 'outra')) as never)).status).toBe(401)
  })
})
