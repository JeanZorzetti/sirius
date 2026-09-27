/**
 * Terms acceptance at signup: the recorded version must be the text on screen, and the server
 * must refuse an account without the checkbox (the form's `required` is only the first wall).
 */
import { vi } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    organization: { create: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))
vi.mock('@/lib/auth', () => ({ login: vi.fn(), logout: vi.fn() }))
vi.mock('@/lib/email-automations', () => ({ sendWelcomeEmail: vi.fn(), sendEmailAsync: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn(async () => new Headers()) }))

import { prisma } from '@/lib/prisma'
import { registerAction } from '@/app/auth/actions'
import { registrarAceiteIntegrador } from '@/lib/auditoria'
import { VERSAO_TERMOS, VERSAO_PRIVACIDADE, VERSAO_AVISO_INTEGRADOR } from '@/lib/termos'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

/** "Última atualização: 02 de fevereiro de 2026" → "2026-02-02" */
function dataDaPagina(texto: string): string {
  const m = texto.match(/(\d{1,2}) de (\S+) de (\d{4})/)
  if (!m) throw new Error(`lastUpdated sem data: ${texto}`)
  const mes = MESES.indexOf(m[2].toLowerCase()) + 1
  return `${m[3]}-${String(mes).padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

describe('aceite dos termos no cadastro', () => {
  it('a versão gravada é a data da última atualização de cada página', () => {
    const msgs = JSON.parse(readFileSync(path.resolve(__dirname, '../messages/pt-BR/marketing.json'), 'utf-8'))
    expect(dataDaPagina(msgs.terms.lastUpdated)).toBe(VERSAO_TERMOS)
    expect(dataDaPagina(msgs.privacy.lastUpdated)).toBe(VERSAO_PRIVACIDADE)
  })

  it('sem a caixa marcada, recusa antes de tocar no banco', async () => {
    const fd = new FormData()
    fd.set('name', 'Ana')
    fd.set('email', 'ana@exemplo.com')
    fd.set('password', 'segredo123')
    fd.set('company', 'Empresa')
    fd.set('aceite', '')

    const resultado = await registerAction(null, fd)

    expect(resultado?.error).toMatch(/Termos de Uso/)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(prisma.organization.create).not.toHaveBeenCalled()
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('integrador de WhatsApp: sem o aceite não grava nada; com ele, grava quem, qual integrador e qual aviso', async () => {
    const base = { organizationId: 'org-1', autor: { userId: 'u-1', email: 'ana@exemplo.com', tipo: 'USUARIO' as const }, integrador: 'Z-API', ip: '10.0.0.1' }

    expect(await registrarAceiteIntegrador({ ...base, aceite: undefined })).toBe(false)
    expect(await registrarAceiteIntegrador({ ...base, aceite: 'true' })).toBe(false)
    expect(prisma.auditLog.create).not.toHaveBeenCalled()

    expect(await registrarAceiteIntegrador({ ...base, aceite: true })).toBe(true)
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-1',
        autorUserId: 'u-1',
        acao: 'ACEITE_INTEGRADOR',
        alvo: `Z-API · aviso de ${VERSAO_AVISO_INTEGRADOR}`,
        ip: '10.0.0.1',
      }),
    })
  })
})
