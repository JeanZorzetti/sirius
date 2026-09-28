// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { EventoMensagem } from '@/lib/whatsapp/integradores/tipos'

const m = vi.hoisted(() => {
  const state = {
    contatos: [] as { id: string; name: string; phone: string | null; organizationId: string }[],
    mensagens: [] as any[],
  }
  const prisma: any = {
    // the raw query filters by the last 8 digits inside the account, like the SQL does
    $queryRaw: vi.fn(async (strings: TemplateStringsArray, ...valores: any[]) => {
      const [organizationId, sufixo] = valores
      const oito = String(sufixo).replace(/%/g, '')
      return state.contatos.filter((c) => c.organizationId === organizationId && (c.phone ?? '').replace(/\D/g, '').endsWith(oito))
    }),
    contact: {
      findFirst: vi.fn(async ({ where }: any) => state.contatos.find((c) => c.id === where.id && c.organizationId === where.organizationId) ?? null),
      create: vi.fn(async ({ data }: any) => {
        const c = { id: `c-${state.contatos.length + 1}`, ...data }
        state.contatos.push(c)
        return c
      }),
    },
  }
  const prismaWa: any = {
    whatsAppMessage: {
      findFirst: vi.fn(async ({ where }: any) =>
        [...state.mensagens].reverse().find((x) => x.organizationId === where.organizationId && x.remoteJid === where.remoteJid && x.contactId) ?? null),
      create: vi.fn(async ({ data }: any) => {
        if (state.mensagens.some((x) => x.organizationId === data.organizationId && x.messageId === data.messageId)) {
          throw Object.assign(new Error('Unique constraint'), { code: 'P2002' })
        }
        const linha = { id: `m-${state.mensagens.length + 1}`, ...data }
        state.mensagens.push(linha)
        return linha
      }),
      update: vi.fn(async ({ where, data }: any) => Object.assign(state.mensagens.find((x) => x.id === where.id), data)),
    },
  }
  return { state, prisma, prismaWa, dispatch: vi.fn(), upload: vi.fn(async ({ orgId, contactId, messageId }: any) => `${orgId}/${contactId}/${messageId}.jpeg`) }
})

// Spec 015: the contact door hands new leads to round-robin; not under test here
vi.mock('@/lib/round-robin', () => ({ distributeLead: vi.fn(async () => null) }))
vi.mock('@/lib/prisma', () => ({ prisma: m.prisma }))
vi.mock('@/lib/prisma-wa', () => ({ prismaWa: m.prismaWa }))
vi.mock('@/lib/webhooks', () => ({ dispatchWebhookAsync: m.dispatch, WEBHOOK_EVENTS: { WHATSAPP_MESSAGE_IN: 'whatsapp.message.in' } }))
vi.mock('@/lib/storage', () => ({ uploadMedia: m.upload }))
vi.mock('@/lib/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { registrarEntrada } from '@/lib/whatsapp/entrada'

const evento = (extra: Partial<EventoMensagem> = {}): EventoMensagem => ({
  tipo: 'mensagem', messageId: `wa-${Math.random()}`, jid: '5511987654321@s.whatsapp.net', telefone: '5511987654321',
  nomePerfil: 'Maria', fromMe: false, enviadaEm: new Date('2026-09-27T12:00:00Z'), texto: 'oi', midia: null, ...extra,
})

beforeEach(() => {
  vi.clearAllMocks()
  m.state.contatos = []
  m.state.mensagens = []
})

describe('registrarEntrada', () => {
  it('contato gravado como (11) 98765-4321 recebe a mensagem de 5511987654321 sem duplicar (US2-2)', async () => {
    m.state.contatos.push({ id: 'c-maria', name: 'Maria', phone: '(11) 98765-4321', organizationId: 'org-a' })
    const r = await registrarEntrada('org-a', 'conn-1', evento())
    expect(r?.contactId).toBe('c-maria')
    expect(m.prisma.contact.create).not.toHaveBeenCalled()
    expect(m.state.mensagens[0]).toMatchObject({ contactId: 'c-maria', connectionId: 'conn-1', direction: 'INBOUND', isRead: false })
  })

  it('o mesmo final com DDD diferente cria outro contato', async () => {
    m.state.contatos.push({ id: 'c-rio', name: 'Rio', phone: '+55 21 98765-4321', organizationId: 'org-a' })
    const r = await registrarEntrada('org-a', 'conn-1', evento())
    expect(r?.contactId).not.toBe('c-rio')
    expect(m.prisma.contact.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ organizationId: 'org-a', phone: '+5511987654321', name: 'Maria' }),
    }))
  })

  it('contato de outra conta nunca é usado', async () => {
    m.state.contatos.push({ id: 'c-outra', name: 'Outra', phone: '5511987654321', organizationId: 'org-b' })
    const r = await registrarEntrada('org-a', 'conn-1', evento())
    expect(r?.contactId).not.toBe('c-outra')
  })

  it('LID sem telefone reusa o contato da mensagem anterior com o mesmo remoteJid; sem histórico, cria com source whatsapp_lid', async () => {
    const lid = { jid: '81896604192873@lid', telefone: null }
    const primeiro = await registrarEntrada('org-a', 'conn-1', evento(lid))
    expect(m.prisma.contact.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ phone: null, source: 'whatsapp_lid', name: 'Maria' }),
    }))
    const segundo = await registrarEntrada('org-a', 'conn-1', evento(lid))
    expect(segundo?.contactId).toBe(primeiro?.contactId)
    expect(m.prisma.contact.create).toHaveBeenCalledTimes(1)
  })

  it('o mesmo aviso duas vezes grava uma mensagem (dedup por create + P2002)', async () => {
    const e = evento({ messageId: 'wa-fixo' })
    expect(await registrarEntrada('org-a', 'conn-1', e)).not.toBeNull()
    expect(await registrarEntrada('org-a', 'conn-1', e)).toBeNull()
    expect(m.state.mensagens).toHaveLength(1)
  })

  it('entrada comum dispara whatsapp.message.in; fromMe não dispara e fica como enviada e lida', async () => {
    await registrarEntrada('org-a', 'conn-1', evento())
    expect(m.dispatch).toHaveBeenCalledWith('org-a', 'whatsapp.message.in', expect.objectContaining({ text: 'oi' }))
    m.dispatch.mockClear()
    await registrarEntrada('org-a', 'conn-1', evento({ fromMe: true, texto: 'respondi pelo celular' }))
    expect(m.dispatch).not.toHaveBeenCalled()
    expect(m.state.mensagens.at(-1)).toMatchObject({ direction: 'OUTBOUND', status: 'SENT', isRead: true })
  })

  it('a mídia vai para o storage pela chave orgId/contactId/messageId, e o link do integrador nunca vai para mediaUrl', async () => {
    const baixar = vi.fn(async () => ({ buffer: Buffer.from('jpg'), mimetype: 'image/jpeg' }))
    const r = await registrarEntrada('org-a', 'conn-1', evento({ midia: { tipo: 'image', ref: { url: 'https://storage.z-api.io/x.jpeg' } } }), baixar)
    const msg = m.state.mensagens[0]
    expect(msg.mediaUrl).toBe(`org-a/${r!.contactId}/${msg.id}.jpeg`)
    expect(JSON.stringify(m.state.mensagens)).not.toContain('z-api.io')
    expect(msg.mediaType).toBe('image')
  })

  it('mídia que falha ao baixar deixa a mensagem gravada, sem link', async () => {
    const baixar = vi.fn(async () => { throw new Error('404') })
    await registrarEntrada('org-a', 'conn-1', evento({ midia: { tipo: 'audio', ref: { messageId: 'x' } } }), baixar)
    expect(m.state.mensagens[0]).toMatchObject({ mediaType: 'audio' })
    expect(m.state.mensagens[0].mediaUrl ?? null).toBeNull()
  })
})
