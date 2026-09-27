// @vitest-environment node
/**
 * Behaviour tests for the isolation holes fixed in spec 011 (FR-004): a session of organization B uses ids that
 * belong to organization A, and nothing may be written. The fake database finds nothing for B (every record here
 * belongs to A) and records every write; before the fixes, each of these calls wrote something.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.setConfig({ testTimeout: 30_000 }) // cold imports of the server actions under the parallel full run

const m = vi.hoisted(() => {
  const USUARIO_B = {
    id: 'user-b', email: 'b@conta-b.com', name: 'B', organizationId: 'org-b', orgRole: 'OWNER',
    pipelineRestricted: false, allowedPipelineIds: [], role: 'USER', organization: { id: 'org-b', tier: 'PRO' },
  }
  const gravacoes: string[] = []
  const LEITURAS: Record<string, (...a: any[]) => any> = {
    findFirst: async () => null,
    findMany: async () => [],
    count: async () => 0,
    aggregate: async () => ({ _max: { order: null } }),
    groupBy: async () => [],
  }
  const ESCRITAS = ['create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert']
  const modelo = (nome: string) =>
    new Proxy({}, {
      get: (_, op: string) => {
        if (nome === 'user' && (op === 'findUnique' || op === 'findFirst')) {
          return vi.fn(async ({ where }: any) => (where?.email === USUARIO_B.email || where?.id === USUARIO_B.id ? { ...USUARIO_B } : null))
        }
        if (op === 'findUnique') {
          // By-id lookups without the organization find A's record (that is the hole being tested)
          return vi.fn(async ({ where }: any) => ({ id: where?.id, organizationId: 'org-a', pipelineId: 'pipe-a', stage: { name: 'x' }, deal: { organizationId: 'org-a' }, organization: { tier: 'PRO' } }))
        }
        if (op in LEITURAS) return vi.fn(LEITURAS[op])
        if (op === 'updateMany' || op === 'deleteMany') {
          // scoped to B's organization it matches none of A's rows; without the scope it would hit A's
          return vi.fn(async ({ where }: any) => {
            if (JSON.stringify(where ?? {}).includes('org-b')) return { count: 0 }
            gravacoes.push(`${nome}.${op}`)
            return { count: 1 }
          })
        }
        if (ESCRITAS.includes(op)) return vi.fn(async () => { gravacoes.push(`${nome}.${op}`); return { id: 'gravado', count: 1 } })
        return vi.fn(async () => null)
      },
    })
  const prisma: any = new Proxy({}, {
    get: (_, chave: string) => {
      if (chave === '$transaction') return async (arg: any) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg))
      if (chave === '$executeRaw' || chave === '$queryRaw') return vi.fn(async () => [])
      return modelo(chave)
    },
  })
  return { prisma, gravacoes, USUARIO_B }
})

vi.mock('@/lib/prisma', () => ({ prisma: m.prisma }))
vi.mock('@/lib/prisma-wa', () => ({ prismaWa: m.prisma }))
vi.mock('@/lib/auth', () => ({ getSession: vi.fn(async () => ({ user: { ...m.USUARIO_B } })) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }))
vi.mock('@/lib/webhooks/dispatcher', () => ({ dispatchWebhookAsync: vi.fn() }))
vi.mock('@/lib/email', () => ({ sendEmailAsync: vi.fn(), sendHtmlEmail: vi.fn() }))
vi.mock('@/lib/entitlements', () => ({
  canCreateDeal: vi.fn(async () => ({ allowed: true })),
  canCreateContact: vi.fn(async () => ({ allowed: true })),
  checkTaskLimit: vi.fn(),
  checkTaskStatusLimit: vi.fn(),
}))
vi.mock('@aws-sdk/client-s3', () => ({ S3Client: vi.fn(), PutObjectCommand: vi.fn(), DeleteObjectCommand: vi.fn(), GetObjectCommand: vi.fn() }))
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn(async () => 'https://arquivo-da-conta-a') }))

const ctx = <T extends Record<string, string>>(params: T) => ({ params: Promise.resolve(params) })
const json = (url: string, method: string, corpo?: unknown) =>
  new Request(`https://crm.test${url}`, { method, body: corpo === undefined ? undefined : JSON.stringify(corpo) })

beforeEach(() => {
  m.gravacoes.length = 0
})

describe('negócios (server actions)', () => {
  it('nota em negócio de outra conta', async () => {
    const { addNote } = await import('@/app/[locale]/dashboard/deals/actions')
    await expect(addNote('negocio-da-conta-a', 'oi')).rejects.toThrow()
    expect(m.gravacoes).toEqual([])
  })

  it('fechamento no próprio negócio apontando para produto de outra conta', async () => {
    const { addDealClosing } = await import('@/app/[locale]/dashboard/deals/actions')
    // the deal lookup (by id + comparison) sees A's deal: the whole closing is refused either way
    await expect(addDealClosing('negocio', '2026-09-25', 100, undefined, 'produto-da-conta-a')).rejects.toThrow()
    expect(m.gravacoes).toEqual([])
  })

  it('reordenar com negócios de outra conta', async () => {
    const { reorderDeals } = await import('@/app/[locale]/dashboard/deals/actions')
    await expect(reorderDeals('etapa', [{ id: 'negocio-da-conta-a', order: 0 }])).rejects.toThrow()
    expect(m.gravacoes).toEqual([])
  })

  it('criar negócio ligado a contato de outra conta, e editar apontando etapa, contato ou produto de fora', async () => {
    const { createDeal, updateDeal } = await import('@/app/[locale]/dashboard/actions')
    const criar = new FormData()
    criar.set('title', 'x'); criar.set('stageId', 'etapa'); criar.set('contactId', 'contato-da-conta-a')
    expect((await createDeal(criar)).success).toBe(false)
    const editar = new FormData()
    editar.set('dealId', 'negocio'); editar.set('title', 'x'); editar.set('stageId', 'etapa-da-conta-a'); editar.set('contactId', 'contato-da-conta-a')
    expect((await updateDeal(editar)).success).toBe(false)
    expect(m.gravacoes).toEqual([])
  })

  it('responsável de contato que é usuário de outra conta', async () => {
    const { createContact } = await import('@/app/[locale]/dashboard/contacts/actions')
    const f = new FormData()
    f.set('name', 'Contato'); f.set('assignedToId', 'usuario-da-conta-a')
    const r = await createContact(f)
    expect(r.success).toBe(false)
    expect(m.gravacoes).toEqual([])
  })
})

describe('tarefas e projetos (rotas)', () => {
  it('anexos de tarefa de outra conta: nada listado, nenhum link de arquivo', async () => {
    const { GET } = await import('@/app/api/tasks/[taskId]/attachments/route')
    const res = await GET(new Request('https://crm.test/x'), ctx({ taskId: 'tarefa-da-conta-a' }))
    expect(res.status).toBe(404)
    expect(await res.text()).not.toContain('arquivo-da-conta-a')
  })

  it('checklist de tarefa de outra conta: apagar item e checklist não apaga nada', async () => {
    const { PATCH } = await import('@/app/api/tasks/[taskId]/checklists/route')
    const r1 = await PATCH(json('/x', 'PATCH', { action: 'deleteItem', itemId: 'item-da-conta-a' }), ctx({ taskId: 'tarefa-da-conta-a' }))
    const r2 = await PATCH(json('/x', 'PATCH', { action: 'deleteChecklist', checklistId: 'lista-da-conta-a' }), ctx({ taskId: 'tarefa-da-conta-a' }))
    expect([r1.status, r2.status]).toEqual([404, 404])
    expect(m.gravacoes).toEqual([])
  })

  it('atividades, comentários e colunas de outra conta', async () => {
    const atividades = await import('@/app/api/tasks/[taskId]/activities/route')
    const comentarios = await import('@/app/api/tasks/[taskId]/comments/route')
    const colunas = await import('@/app/api/task-projects/[projectId]/statuses/route')
    const rotulos = await import('@/app/api/task-projects/[projectId]/labels/route')
    expect((await atividades.GET(new Request('https://crm.test/x'), ctx({ taskId: 'tarefa-da-conta-a' }))).status).toBe(404)
    expect((await comentarios.POST(json('/x', 'POST', { content: 'oi' }), ctx({ taskId: 'tarefa-da-conta-a' }))).status).toBe(404)
    expect((await colunas.PATCH(json('/x', 'PATCH', { orderedIds: ['coluna-da-conta-a'] }), ctx({ projectId: 'projeto-da-conta-a' }))).status).toBe(404)
    expect((await rotulos.POST(json('/x', 'POST', { name: 'x', color: '#000' }), ctx({ projectId: 'projeto-da-conta-a' }))).status).toBe(404)
    expect(m.gravacoes).toEqual([])
  })

  it('criar tarefa dentro de projeto de outra conta', async () => {
    const { POST } = await import('@/app/api/tasks/route')
    const res = await POST(json('/api/tasks', 'POST', { title: 'x', projectId: 'projeto-da-conta-a', statusId: 'coluna-da-conta-a' }))
    expect(res.status).toBe(404)
    expect(m.gravacoes).toEqual([])
  })
})

describe('outras rotas', () => {
  it('arquivar e fixar conversa de contato de outra conta', async () => {
    const arquivar = await import('@/app/api/whatsapp/conversations/[id]/archive/route')
    const fixar = await import('@/app/api/whatsapp/conversations/[id]/pin/route')
    expect((await arquivar.PUT(json('/x', 'PATCH', { isArchived: true }) as never, ctx({ id: 'contato-da-conta-a' }))).status).toBe(404)
    expect((await fixar.PUT(json('/x', 'PATCH', { isPinned: true }) as never, ctx({ id: 'contato-da-conta-a' }))).status).toBe(404)
    expect(m.gravacoes).toEqual([])
  })

  it('comentário de post do Instagram de outra conta', async () => {
    const { PATCH, DELETE } = await import('@/app/api/instagram/posts/[id]/comments/[commentId]/route')
    const params = ctx({ id: 'post-da-conta-a', commentId: 'comentario-da-conta-a' })
    expect((await PATCH(json('/x', 'PATCH', { resolved: true }) as never, params)).status).toBe(404)
    expect((await DELETE(json('/x', 'DELETE') as never, ctx({ id: 'post-da-conta-a', commentId: 'comentario-da-conta-a' }))).status).toBe(404)
    expect(m.gravacoes).toEqual([])
  })

  it('check-in no celular com contato de outra conta', async () => {
    const { POST } = await import('@/app/api/mobile/checkin/route')
    const res = await POST(json('/x', 'POST', { latitude: -23.5, longitude: -46.6, contactId: 'contato-da-conta-a' }) as never)
    expect(res.status).toBe(404)
    expect(m.gravacoes).toEqual([])
  })
})
