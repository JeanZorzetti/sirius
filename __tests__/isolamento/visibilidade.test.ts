// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.setConfig({ testTimeout: 30_000 }) // cold imports of the routes under the parallel full run

const m = vi.hoisted(() => {
  const state = { usuario: null as any }
  const prisma: any = {
    user: {
      findUnique: vi.fn(async () => state.usuario),
      findFirst: vi.fn(async () => state.usuario),
    },
    contact: { findMany: vi.fn(async () => [{ id: 'c1' }, { id: 'c2' }]) },
    deal: { findMany: vi.fn(async () => [{ id: 'd1' }]) },
    chatConversation: { findMany: vi.fn(async () => []) },
    task: { findMany: vi.fn(async () => []) },
    auditLog: { create: vi.fn(async () => ({})) },
  }
  return { prisma, state }
})

vi.mock('@/lib/prisma', () => ({ prisma: m.prisma }))
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(async () => (m.state.usuario ? { user: { id: m.state.usuario.id, email: m.state.usuario.email } } : null)),
  login: vi.fn(),
}))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }))
vi.mock('@/lib/xlsx-export', () => ({
  exportToXLSX: vi.fn(async () => Buffer.from('planilha')),
  formatContactsForExport: vi.fn((x: unknown[]) => x),
  formatDealsForExport: vi.fn((x: unknown[]) => x),
}))

const usuario = (orgRole: string, extra: Record<string, unknown> = {}) => ({
  id: `u-${orgRole}`, email: `${orgRole.toLowerCase()}@conta.com`, name: orgRole, organizationId: 'org-a', orgRole,
  pipelineRestricted: false, allowedPipelineIds: [], role: 'USER', ...extra,
})
const pedido = (url: string) => new Request(`https://crm.test${url}`, { headers: { 'x-forwarded-for': '200.1.2.3' } }) as never

beforeEach(() => {
  vi.clearAllMocks()
})

describe('exportação', () => {
  it('vendedor, supervisor e coordenador: recusada com quem pode exportar, e nada vai para a auditoria', async () => {
    const contatos = await import('@/app/api/export/contacts/xlsx/route')
    const negocios = await import('@/app/api/export/deals/xlsx/route')
    for (const papel of ['VENDEDOR', 'SUPERVISOR', 'COORDENADOR', 'MEMBER']) {
      m.state.usuario = usuario(papel)
      const r1 = await contatos.GET(pedido('/api/export/contacts/xlsx'))
      const r2 = await negocios.GET(pedido('/api/export/deals/xlsx'))
      expect([r1.status, r2.status]).toEqual([403, 403])
      expect((await r1.json()).error).toMatch(/dono e o gerente/)
    }
    expect(m.prisma.contact.findMany).not.toHaveBeenCalled()
    expect(m.prisma.auditLog.create).not.toHaveBeenCalled()
  })

  it('gerente exporta, e a exportação fica na auditoria com quem, o quê, formato, linhas e origem', async () => {
    m.state.usuario = usuario('GERENTE')
    const { GET } = await import('@/app/api/export/contacts/xlsx/route')
    const res = await GET(pedido('/api/export/contacts/xlsx'))
    expect(res.status).toBe(200)
    expect(m.prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-a', autorEmail: 'gerente@conta.com', autorTipo: 'USUARIO',
        acao: 'EXPORTACAO', alvo: 'contatos', formato: 'xlsx', linhas: 2, ip: '200.1.2.3',
      }),
    })
  })

  it('negócios exportados respeitam os pipelines permitidos de quem exporta', async () => {
    m.state.usuario = usuario('GERENTE', { pipelineRestricted: true, allowedPipelineIds: ['p-varejo'] })
    const { GET } = await import('@/app/api/export/deals/xlsx/route')
    await GET(pedido('/api/export/deals/xlsx'))
    expect(m.prisma.deal.findMany.mock.calls[0][0].where).toEqual({ organizationId: 'org-a', pipelineId: { in: ['p-varejo'] } })
  })
})

describe('entrar como (equipe ROI Labs)', () => {
  it('grava na conta visitada quem da equipe entrou e como qual usuário', async () => {
    const equipe = { id: 'staff-1', email: 'suporte@roilabs.com.br', role: 'ADMIN', organizationId: 'org-roilabs' }
    const visitado = usuario('VENDEDOR', { id: 'u-visitado', email: 'vendedora@cliente.com', organizationId: 'org-cliente' })
    m.state.usuario = equipe
    m.prisma.user.findUnique.mockImplementation(async ({ where }: any) => (where.id === 'u-visitado' ? visitado : equipe))
    const { impersonateUser } = await import('@/app/[locale]/(admin)/admin/actions')
    await impersonateUser('u-visitado')
    expect(m.prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-cliente', autorUserId: 'staff-1', autorEmail: 'suporte@roilabs.com.br',
        autorTipo: 'EQUIPE', acao: 'ENTRAR_COMO', alvo: 'vendedora@cliente.com',
      }),
    })
  })
})

describe('busca global', () => {
  it('vendedora restrita: negócios só dos pipelines dela e tarefas pela regra de visibilidade', async () => {
    m.prisma.user.findUnique.mockImplementation(async () => m.state.usuario)
    m.state.usuario = usuario('VENDEDOR', { pipelineRestricted: true, allowedPipelineIds: ['p-varejo'] })
    const { GET } = await import('@/app/api/search/global/route')
    const req = Object.assign(pedido('/api/search/global?q=ab'), { nextUrl: new URL('https://crm.test/api/search/global?q=ab') })
    await GET(req)
    const ondeNegocio = m.prisma.deal.findMany.mock.calls[0][0].where
    const ondeTarefa = m.prisma.task.findMany.mock.calls[0][0].where
    expect(ondeNegocio).toMatchObject({ organizationId: 'org-a', pipelineId: { in: ['p-varejo'] } })
    expect(ondeTarefa.organizationId).toBe('org-a')
    expect(JSON.stringify(ondeTarefa.OR)).toContain('PRIVATE')
    expect(JSON.stringify(ondeTarefa)).not.toContain('ADMINS_ONLY')
  })
})
