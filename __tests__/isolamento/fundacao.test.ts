// @vitest-environment node
import { createHmac } from 'crypto'
import http from 'http'
import type { AddressInfo } from 'net'
import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { assinaturaMetaValida } from '@/lib/meta-assinatura'
import { ipPublico, garantirUrlPublica, fetchPublico } from '@/lib/url-publica'
import { escopoNegocio, escopoPipeline, escopoTarefa, podeExportar, pipelinesPermitidos, type Acesso } from '@/lib/visibilidade'

const assinar = (corpo: string, segredo: string) => 'sha256=' + createHmac('sha256', segredo).update(corpo).digest('hex')

describe('assinaturaMetaValida', () => {
  const corpo = '{"object":"whatsapp_business_account","entry":[]}'
  it('aceita a assinatura certa', () => {
    expect(assinaturaMetaValida(corpo, assinar(corpo, 's3gr3do'), 's3gr3do')).toBe(true)
  })
  it('recusa segredo errado, corpo alterado, cabeçalho ausente, malformado ou sem segredo', () => {
    expect(assinaturaMetaValida(corpo, assinar(corpo, 'outro'), 's3gr3do')).toBe(false)
    expect(assinaturaMetaValida(corpo + ' ', assinar(corpo, 's3gr3do'), 's3gr3do')).toBe(false)
    expect(assinaturaMetaValida(corpo, null, 's3gr3do')).toBe(false)
    expect(assinaturaMetaValida(corpo, 'sha1=abc', 's3gr3do')).toBe(false)
    expect(assinaturaMetaValida(corpo, 'sha256=zz', 's3gr3do')).toBe(false)
    expect(assinaturaMetaValida(corpo, assinar(corpo, ''), '')).toBe(false)
    expect(assinaturaMetaValida(corpo, assinar(corpo, 'x'), undefined)).toBe(false)
  })
})

describe('ipPublico', () => {
  it.each([
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.0.10', '169.254.169.254', '100.64.0.1', '0.0.0.0',
    '224.0.0.1', '::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'ff02::1', '::ffff:127.0.0.1', '::ffff:7f00:1',
    '::ffff:10.0.0.1', '64:ff9b::a00:1', '2001:db8::1', 'não é ip',
  ])('%s não é público', (ip) => expect(ipPublico(ip)).toBe(false))

  it.each(['8.8.8.8', '172.32.0.1', '200.147.67.142', '2606:4700:4700::1111', '::ffff:8.8.8.8'])('%s é público', (ip) =>
    expect(ipPublico(ip)).toBe(true),
  )
})

describe('garantirUrlPublica', () => {
  it('recusa protocolo, IP literal interno e http quando exige https', () => {
    expect(() => garantirUrlPublica('file:///etc/passwd')).toThrow(/não permitido/)
    expect(() => garantirUrlPublica('http://127.0.0.1:5432')).toThrow(/não permitido/)
    expect(() => garantirUrlPublica('http://[::1]/')).toThrow(/não permitido/)
    expect(() => garantirUrlPublica('http://[::ffff:127.0.0.1]/')).toThrow(/não permitido/)
    expect(() => garantirUrlPublica('http://example.com', { exigirHttps: true })).toThrow(/https/)
    expect(() => garantirUrlPublica('não é url')).toThrow(/não permitido/)
  })
  it('aceita https público e http quando não exige', () => {
    expect(garantirUrlPublica('https://hooks.example.com/x', { exigirHttps: true }).hostname).toBe('hooks.example.com')
    expect(garantirUrlPublica('http://example.com').protocol).toBe('http:')
  })
})

describe('fetchPublico', () => {
  let servidor: http.Server
  let porta = 0
  let pedidos = 0
  beforeAll(async () => {
    servidor = http.createServer((_req, res) => {
      pedidos++
      res.end('segredo interno')
    })
    await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', () => ok()))
    porta = (servidor.address() as AddressInfo).port
  })
  afterAll(() => new Promise<void>((ok) => servidor.close(() => ok())))

  it('não conecta em IP literal interno nem em nome que resolve para ele', async () => {
    const motivo = (e: unknown) => {
      const erro = e as Error & { cause?: Error }
      return `${erro.message} ${erro.cause?.message ?? ''}`
    }
    await expect(fetchPublico(`http://127.0.0.1:${porta}/`)).rejects.toThrow(/não permitido/)
    const erro = await fetchPublico(`http://localhost:${porta}/`).catch((e) => e)
    expect(motivo(erro)).toMatch(/não permitido/) // refused by the guard, not a refused connection
    expect(pedidos).toBe(0)
  })
})

describe('visibilidade', () => {
  const base: Acesso = { userId: 'u1', organizationId: 'org', orgRole: 'VENDEDOR', pipelineRestricted: false, allowedPipelineIds: [] }
  const restrita: Acesso = { ...base, pipelineRestricted: true, allowedPipelineIds: ['p1'] }

  it('negócios e pipelines: conta sempre; pipelines permitidos quando restrito (lista vazia = nenhum)', () => {
    expect(escopoNegocio(base)).toEqual({ organizationId: 'org' })
    expect(escopoNegocio(restrita)).toEqual({ organizationId: 'org', pipelineId: { in: ['p1'] } })
    expect(escopoPipeline(restrita)).toEqual({ organizationId: 'org', id: { in: ['p1'] } })
    expect(escopoNegocio({ ...restrita, allowedPipelineIds: [] })).toEqual({ organizationId: 'org', pipelineId: { in: [] } })
    expect(pipelinesPermitidos(restrita, ['p1', 'p2'])).toEqual(['p1'])
    expect(pipelinesPermitidos(base, ['p1', 'p2'])).toEqual(['p1', 'p2'])
  })

  it('tarefas: dono e gerente veem tudo; os demais papéis (inclusive o legado MEMBER) veem públicas e as privadas deles', () => {
    for (const orgRole of ['OWNER', 'GERENTE'] as const) {
      expect(escopoTarefa({ ...base, orgRole })).toEqual({ organizationId: 'org' })
    }
    for (const orgRole of ['COORDENADOR', 'SUPERVISOR', 'VENDEDOR', 'MEMBER'] as const) {
      const w = escopoTarefa({ ...base, orgRole })
      expect(w.organizationId).toBe('org')
      expect(JSON.stringify(w)).not.toContain('ADMINS_ONLY')
      expect(w.OR).toEqual([
        { visibility: 'PUBLIC' },
        { visibility: 'PRIVATE', OR: [{ assigneeId: 'u1' }, { creatorId: 'u1' }] },
      ])
    }
  })

  it('exportar: só dono e gerente', () => {
    expect(podeExportar({ orgRole: 'OWNER' })).toBe(true)
    expect(podeExportar({ orgRole: 'GERENTE' })).toBe(true)
    expect(podeExportar({ orgRole: 'VENDEDOR' })).toBe(false)
    expect(podeExportar({ orgRole: 'MEMBER' })).toBe(false)
    expect(podeExportar({ orgRole: 'SUPERVISOR' })).toBe(false)
  })
})
