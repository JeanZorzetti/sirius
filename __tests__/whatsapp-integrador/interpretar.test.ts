// @vitest-environment node
import fs from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'
import { zapi } from '@/lib/whatsapp/integradores/zapi'
import { uazapi } from '@/lib/whatsapp/integradores/uazapi'
import { evolution } from '@/lib/whatsapp/integradores/evolution'
import type { Adaptador } from '@/lib/whatsapp/integradores/tipos'

const fixture = (provider: string, nome: string) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', provider, `${nome}.json`), 'utf8'))

const casos: [string, Adaptador, Record<string, string>][] = [
  ['zapi', zapi, { texto: '3EB0ZAPI0001', imagem: '3EB0ZAPI0002', audio: '3EB0ZAPI0003', documento: '3EB0ZAPI0004', celular: '3EB0ZAPI0005' }],
  ['uazapi', uazapi, { texto: '3EB0UAZ0001', imagem: '3EB0UAZ0002', audio: '3EB0UAZ0003', documento: '3EB0UAZ0004', celular: '3EB0UAZ0005' }],
  ['evolution', evolution, { texto: '3EB0EVO0001', imagem: '3EB0EVO0002', audio: '3EB0EVO0003', documento: '3EB0EVO0004', celular: '3EB0EVO0005' }],
]

describe.each(casos)('interpretar: %s', (provider, adaptador, ids) => {
  const um = (nome: string) => {
    const eventos = adaptador.interpretar(fixture(provider, nome))
    expect(eventos, nome).toHaveLength(1)
    return eventos[0] as any
  }

  it('texto do cliente vira mensagem com telefone, nome do perfil e hora', () => {
    const e = um('texto')
    expect(e).toMatchObject({
      tipo: 'mensagem', messageId: ids.texto, telefone: '5511987654321', fromMe: false, texto: 'Olá, quero um orçamento', midia: null,
    })
    expect(e.jid).toMatch(/^5511987654321@/)
    expect(e.nomePerfil).toBe('Maria Souza')
    expect(e.enviadaEm.getTime()).toBe(1_790_000_000_000)
  })

  it('imagem, áudio e documento trazem a mídia e o texto de apoio', () => {
    const img = um('imagem')
    expect(img).toMatchObject({ messageId: ids.imagem, texto: 'segue a foto', midia: { tipo: 'image' } })
    const aud = um('audio')
    expect(aud).toMatchObject({ messageId: ids.audio, texto: '[Áudio]', midia: { tipo: 'audio' } })
    const doc = um('documento')
    expect(doc).toMatchObject({ messageId: ids.documento, texto: 'proposta.pdf', midia: { tipo: 'document' } })
    // Z-API hands the file URL (kept 30 days); uazapi and Evolution are fetched later by message id
    for (const e of [img, aud, doc]) {
      expect(e.midia.ref).toEqual(provider === 'zapi' ? { url: expect.stringMatching(/^https:\/\//) } : { messageId: e.messageId })
    }
  })

  it('resposta pelo celular vira mensagem fromMe', () => {
    expect(um('enviada-pelo-celular')).toMatchObject({ messageId: ids.celular, fromMe: true, texto: 'respondi pelo celular' })
  })

  it('grupo e status viram []', () => {
    expect(adaptador.interpretar(fixture(provider, 'grupo'))).toEqual([])
    expect(adaptador.interpretar(fixture(provider, 'status'))).toEqual([])
  })

  it('LID sem telefone guarda o JID e não inventa telefone', () => {
    const e = um('lid-sem-telefone')
    expect(e.jid).toBe('81896604192873@lid')
    expect(e.telefone).toBeNull()
  })

  it('aviso de entrega vira o estado traduzido', () => {
    expect(um('entrega-lida')).toEqual({ tipo: 'entrega', messageIds: ['3EB0SIRIUS01'], status: 'READ' })
  })

  it('conexão aberta vira CONNECTED com o número', () => {
    expect(um('conectado')).toEqual({ tipo: 'conexao', status: 'CONNECTED', motivo: null, phoneNumber: '5511999990000' })
  })

  it('corpo desconhecido ou vazio vira []', () => {
    expect(adaptador.interpretar({ qualquer: 'coisa' })).toEqual([])
    expect(adaptador.interpretar(null)).toEqual([])
  })
})

describe('casos de cada integrador', () => {
  it('eco do próprio envio vira [] (Z-API fromApi, uazapi wasSentByApi)', () => {
    expect(zapi.interpretar(fixture('zapi', 'eco-da-api'))).toEqual([])
    expect(uazapi.interpretar(fixture('uazapi', 'eco-da-api'))).toEqual([])
  })

  it('canal vira []', () => {
    expect(zapi.interpretar(fixture('zapi', 'canal'))).toEqual([])
    expect(evolution.interpretar(fixture('evolution', 'canal'))).toEqual([])
  })

  it('LID com o telefone junto casa pelo telefone', () => {
    for (const [provider, a] of [['uazapi', uazapi], ['evolution', evolution]] as const) {
      const [e] = a.interpretar(fixture(provider, 'lid-com-telefone')) as any[]
      expect(e, provider).toMatchObject({ jid: '81896604192873@lid', telefone: '5511987654321' })
    }
  })

  it('Z-API: RECEIVED vira DELIVERED para cada id', () => {
    expect(zapi.interpretar(fixture('zapi', 'entrega-recebida'))).toEqual([
      { tipo: 'entrega', messageIds: ['3EB0SIRIUS01', '3EB0SIRIUS02'], status: 'DELIVERED' },
    ])
  })

  it('Z-API: desconexão vira DISCONNECTED com o motivo', () => {
    expect(zapi.interpretar(fixture('zapi', 'desconectado'))).toEqual([
      { tipo: 'conexao', status: 'DISCONNECTED', motivo: 'o integrador avisou que o aparelho desconectou', phoneNumber: null },
    ])
  })

  it('uazapi: desconectada sem login vira FAILED (sessão encerrada)', () => {
    expect(uazapi.interpretar(fixture('uazapi', 'desconectado'))).toEqual([
      { tipo: 'conexao', status: 'FAILED', motivo: 'sessão encerrada no celular', phoneNumber: null },
    ])
  })

  it('Evolution: ERROR vira FAILED; 401 encerra a sessão, 403 é número bloqueado e o resto é queda', () => {
    expect(evolution.interpretar(fixture('evolution', 'entrega-erro'))).toEqual([
      { tipo: 'entrega', messageIds: ['3EB0SIRIUS02'], status: 'FAILED' },
    ])
    expect(evolution.interpretar(fixture('evolution', 'sessao-encerrada'))[0]).toMatchObject({ status: 'FAILED', motivo: 'sessão encerrada no celular' })
    expect(evolution.interpretar(fixture('evolution', 'numero-bloqueado'))[0]).toMatchObject({ status: 'FAILED', motivo: expect.stringMatching(/bloqueado/) })
    expect(evolution.interpretar(fixture('evolution', 'caiu'))[0]).toMatchObject({ status: 'DISCONNECTED' })
  })

  it('Evolution aceita o nome do evento em maiúsculas (MESSAGES_UPSERT)', () => {
    const corpo = { ...fixture('evolution', 'texto'), event: 'MESSAGES_UPSERT' }
    expect(evolution.interpretar(corpo)).toHaveLength(1)
  })
})
