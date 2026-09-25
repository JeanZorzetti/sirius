// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const m = vi.hoisted(() => {
  const CONTATO_A = { id: 'contato-a', name: 'Cliente A', phone: '+5511987654321', email: null, company: 'Empresa digitada', assignedToId: null }
  const prisma: any = {
    $executeRaw: vi.fn(async () => 1),
    $transaction: vi.fn(async (arg: any) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg))),
    organization: { findUnique: vi.fn() },
    deal: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    contact: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    pipeline: { findFirst: vi.fn() },
    product: { findMany: vi.fn(async () => []) },
    user: { findFirst: vi.fn() },
    activity: { create: vi.fn() },
    agentAction: { count: vi.fn(async () => 0), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  }
  const prismaWa: any = {
    $executeRaw: vi.fn(async () => 1),
    whatsAppMessage: { count: vi.fn(async () => 1), findMany: vi.fn(async () => []), findFirst: vi.fn(async () => ({ id: 'in-1' })) },
  }
  const enviar = vi.fn(async () => ({}))
  const callLLM = vi.fn()
  return { prisma, prismaWa, enviar, callLLM, CONTATO_A }
})

vi.mock('@/lib/prisma', () => ({ prisma: m.prisma }))
vi.mock('@/lib/prisma-wa', () => ({ prismaWa: m.prismaWa }))
vi.mock('@/lib/agaas-quota', () => ({ checkAgaasQuota: vi.fn(async () => ({ allowed: true })), incrementAgaasUsage: vi.fn() }))
vi.mock('@/lib/agi/providers', () => ({ callLLM: m.callLLM }))
vi.mock('@/lib/integrations/whatsapp-official-client', () => ({
  getWhatsAppOfficialClient: vi.fn(async () => ({ sendTextMessage: m.enviar })),
  normalizePhone: (p: string) => p.replace(/\D/g, ''),
}))
vi.mock('@/lib/integrations/google-calendar-client', () => ({ getGoogleCalendarClient: vi.fn(async () => null) }))
vi.mock('@/lib/rag/retrieval', () => ({ retrieveContext: vi.fn(async () => '') }))
vi.mock('@/lib/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }))
vi.mock('@/lib/api-middleware', () => ({
  withApiMiddleware: (req: any, handler: any) => handler(req, { organizationId: 'org-a', requestId: 'req-1' }),
  apiResponse: (_id: string, data?: unknown, error?: unknown) => ({ data, error }),
}))

import { triggerAgentsForInboundMessage } from '@/lib/agaas-agent-trigger'
import { executeAgentAction } from '@/lib/agaas-executor'
import { revisarAcaoDeAgente } from '@/lib/agaas-aprovacao'
import { POST as registrarAcaoPelaApi } from '@/app/api/v1/agents/actions/route'

/** Contact lookups only find contato-a, and only inside org-a — like the real scoped query. */
const soNaContaA = async ({ where }: any) =>
  where?.id === m.CONTATO_A.id && where?.organizationId === 'org-a' ? { ...m.CONTATO_A } : null

const acao = (extra: Record<string, any>) => ({
  id: 'acao-1', organizationId: 'org-a', agentName: 'PropertyMatcher', actionType: 'MATCH_PROPERTIES',
  entityType: 'Contact', entityId: m.CONTATO_A.id, reasoning: 'r', confidence: 0.82,
  input: { messageText: 'quero um apartamento' }, status: 'NEEDS_APPROVAL', output: null, reviewedBy: null, reviewedAt: null,
  createdAt: new Date(), ...extra,
})

beforeEach(() => {
  vi.clearAllMocks()
  m.prisma.contact.findFirst.mockImplementation(soNaContaA)
  m.prisma.user.findFirst.mockImplementation(async ({ where }: any) =>
    where?.organizationId === 'org-a' ? { id: where.id ?? 'dono-mais-antigo' } : null,
  )
  m.prisma.organization.findUnique.mockResolvedValue({
    iaConfig: {
      enabledAgents: { 'lead-qualifier': true, 'property-matcher': true },
      operatingHoursStart: '00:00', operatingHoursEnd: '23:59', weekendsEnabled: true,
      confidenceThreshold: 0, // the old "auto-execute above" knob: must have no effect
    },
  })
  m.prisma.agentAction.create.mockImplementation(async ({ data }: any) => ({ id: `acao-${data.agentName}`, createdAt: new Date(), output: null, ...data }))
  m.callLLM.mockImplementation(async (msgs: any[]) =>
    String(msgs[0].content).includes('JSON')
      ? { content: JSON.stringify({ qualification: 'HOT', score: 90, suggestedDealTitle: 'Apartamento centro', suggestedDealValue: 0, nextAction: 'Continuar' }) }
      : { content: 'Olá! Tenho duas opções para você.' },
  )
})

describe('gatilho: nada executa sozinho', () => {
  it('com limiar 0, cria propostas aguardando aprovação com rascunho, e nada sai nem é criado', async () => {
    m.prisma.deal.findFirst.mockResolvedValue(null)
    m.prisma.agentAction.findFirst.mockResolvedValue(null)

    await triggerAgentsForInboundMessage({
      organizationId: 'org-a', contactId: m.CONTATO_A.id, messageId: 'msg-1',
      messageText: 'quero comprar um apartamento', contactName: 'Cliente A', contactPhone: '5511987654321',
    })

    const status = m.prisma.agentAction.create.mock.calls.map(([arg]: any) => arg.data.status)
    expect(status).toEqual(['NEEDS_APPROVAL', 'NEEDS_APPROVAL'])
    expect(m.enviar).not.toHaveBeenCalled()
    expect(m.prisma.deal.create).not.toHaveBeenCalled()
    const rascunhos = m.prisma.agentAction.update.mock.calls.map(([arg]: any) => arg.data.output)
    expect(rascunhos).toContainEqual({ rascunho: expect.objectContaining({ message: 'Olá! Tenho duas opções para você.' }) })
  })

  it('não cria segunda proposta do mesmo agente para o mesmo contato enquanto a primeira espera', async () => {
    m.prisma.deal.findFirst.mockResolvedValue(null)
    m.prisma.agentAction.findFirst.mockResolvedValue({ id: 'ja-pendente' })

    await triggerAgentsForInboundMessage({
      organizationId: 'org-a', contactId: m.CONTATO_A.id, messageId: 'msg-2',
      messageText: 'quero comprar', contactName: 'Cliente A', contactPhone: '5511987654321',
    })

    expect(m.prisma.agentAction.create).not.toHaveBeenCalled()
    expect(m.prisma.$executeRaw).toHaveBeenCalled() // serialized per agent + entity
  })
})

describe('aprovação', () => {
  it('envia exatamente o rascunho aprovado, sem escrever outro', async () => {
    m.prisma.agentAction.findFirst.mockResolvedValue(acao({ output: { rascunho: { message: 'Texto que a pessoa leu' } } }))
    m.prisma.agentAction.updateMany.mockResolvedValue({ count: 1 })
    m.prisma.agentAction.update.mockImplementation(async ({ data }: any) => acao(data))

    const r = await revisarAcaoDeAgente({ id: 'acao-1', organizationId: 'org-a', decisao: 'APPROVED', revisorId: 'vendedora-a' })

    expect(r.ok).toBe(true)
    expect(m.enviar).toHaveBeenCalledWith('5511987654321', 'Texto que a pessoa leu')
    expect(m.callLLM).not.toHaveBeenCalled()
  })

  it('duas aprovações ao mesmo tempo: só a primeira executa', async () => {
    m.prisma.agentAction.findFirst.mockResolvedValue(acao({ output: { rascunho: { message: 'x' } } }))
    m.prisma.agentAction.updateMany.mockResolvedValue({ count: 0 })

    const r = await revisarAcaoDeAgente({ id: 'acao-1', organizationId: 'org-a', decisao: 'APPROVED', revisorId: null })

    expect(r).toMatchObject({ ok: false, status: 409 })
    expect(m.enviar).not.toHaveBeenCalled()
  })

  it('abrir negócio: sem valor sugerido nasce sem valor; dono é o dono mais antigo quando o contato não tem responsável', async () => {
    m.prisma.deal.findFirst.mockResolvedValue(null)
    m.prisma.pipeline.findFirst.mockResolvedValue({ id: 'pipe-a', stages: [{ id: 'etapa-1' }] })
    m.prisma.deal.create.mockResolvedValue({ id: 'negocio-novo' })

    const r = await executeAgentAction({
      ...acao({ agentName: 'LeadQualifier', output: { rascunho: { suggestedDealTitle: 'Apto', suggestedDealValue: 0, nextAction: 'x' } } }),
      userId: 'vendedora-a',
    })

    expect(r.success).toBe(true)
    const data = m.prisma.deal.create.mock.calls[0][0].data
    expect(data.value).toBeNull()
    expect(data.userId).toBe('dono-mais-antigo')
    expect(data.organizationId).toBe('org-a')
  })

  it('abrir negócio: contato que já tem negócio aberto não ganha outro', async () => {
    m.prisma.deal.findFirst.mockResolvedValue({ id: 'negocio-existente' })

    const r = await executeAgentAction({ ...acao({ agentName: 'LeadQualifier', output: { rascunho: { suggestedDealTitle: 'Apto' } } }), userId: 'u' })

    expect(r.output).toMatchObject({ dealId: 'negocio-existente', jaExistia: true })
    expect(m.prisma.deal.create).not.toHaveBeenCalled()
  })

  it('mudança de etapa aprovada fica no histórico com quem aprovou', async () => {
    m.prisma.deal.findFirst.mockImplementation(async ({ where }: any) =>
      where?.id === 'negocio-a' && where?.organizationId === 'org-a'
        ? { id: 'negocio-a', title: 'N', stageId: 'e1', stage: { name: 'Lead' }, pipeline: { stages: [{ id: 'e1', name: 'Lead' }, { id: 'e2', name: 'Proposta' }] } }
        : null,
    )

    const r = await executeAgentAction({
      ...acao({ agentName: 'DealStageAnalyzer', entityType: 'Deal', entityId: 'negocio-a', output: { rascunho: { shouldMove: true, suggestedStage: 'Proposta' } } }),
      userId: 'vendedora-a',
    })

    expect(r.output.movedTo).toBe('Proposta')
    expect(m.prisma.deal.update).toHaveBeenCalledWith({ where: { id: 'negocio-a', organizationId: 'org-a' }, data: { stageId: 'e2' } })
    expect(m.prisma.activity.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'STAGE_CHANGE', dealId: 'negocio-a', userId: 'vendedora-a' }) })
  })

  it('sugestão de perfil e de empresa, aprovada, não grava no contato', async () => {
    for (const agentName of ['ContactEnricher', 'LeadProfiler']) {
      const r = await executeAgentAction({ ...acao({ agentName, output: { rascunho: { company: 'Chute do modelo', profile: 'COMPRADOR' } } }), userId: 'u' })
      expect(r.success).toBe(true)
      expect(r.output.sugestao).toBe(true)
    }
    expect(m.prisma.contact.update).not.toHaveBeenCalled()
  })
})

describe('entidade de outra conta', () => {
  it('o executor recusa sem ler conversa, sem chamar o modelo e sem enviar', async () => {
    for (const agentName of ['PropertyMatcher', 'ContactEnricher', 'NegotiationAssistant', 'LeadQualifier']) {
      const r = await executeAgentAction({ ...acao({ agentName, entityId: 'contato-da-conta-b' }), userId: 'u' }, 'rascunho')
      expect(r).toMatchObject({ success: false, output: { error: 'Contact not found in this organization' } })
    }
    const viaInput = await executeAgentAction({
      ...acao({ agentName: 'FollowUpCoordinator', entityType: 'Deal', entityId: 'negocio-a', input: { contactId: 'contato-da-conta-b' } }),
      userId: 'u',
    })
    expect(viaInput.success).toBe(false)
    expect(m.callLLM).not.toHaveBeenCalled()
    expect(m.prismaWa.whatsAppMessage.findMany).not.toHaveBeenCalled()
    expect(m.enviar).not.toHaveBeenCalled()
  })

  it('a API recusa registrar ação sobre entidade de outra conta', async () => {
    m.prisma.deal.findFirst.mockResolvedValue(null)
    const req = new Request('https://crm.test/api/v1/agents/actions', {
      method: 'POST',
      body: JSON.stringify({ agentName: 'ContactEnricher', actionType: 'X', entityType: 'Contact', entityId: 'contato-da-conta-b', reasoning: 'r', confidence: 0.5, input: {} }),
    })
    const res = await registrarAcaoPelaApi(req as never)
    expect(res.status).toBe(404)
    expect(m.prisma.agentAction.create).not.toHaveBeenCalled()
  })
})
