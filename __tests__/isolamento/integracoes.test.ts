// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.setConfig({ testTimeout: 30_000 }) // cold imports of the routes under the parallel full run

const m = vi.hoisted(() => {
  process.env.INTEGRATION_ENCRYPTION_KEY = 'ab'.repeat(32)
  const state = { usuario: null as any }
  const prisma: any = {
    user: {
      findUnique: vi.fn(async () => state.usuario),
      findFirst: vi.fn(async () => state.usuario),
    },
    organization: { update: vi.fn(async () => ({})) },
  }
  const google = {
    getGoogleCalendarAuthUrl: vi.fn((s: string) => `https://accounts.google.com/o/oauth2/auth?state=${encodeURIComponent(s)}`),
    exchangeCodeForTokens: vi.fn(async () => ({ refreshToken: 'refresh-token' })),
    GoogleCalendarClient: vi.fn(function () {
      return { getCalendarInfo: async () => ({ email: 'agenda@exemplo.com' }) }
    }),
    logGoogleCalendarActivity: vi.fn(async () => {}),
  }
  return { prisma, state, google }
})

vi.mock('@/lib/prisma', () => ({ prisma: m.prisma }))
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(async () => (m.state.usuario ? { user: { id: m.state.usuario.id, email: m.state.usuario.email } } : null)),
  login: vi.fn(),
}))
vi.mock('@/lib/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }))
vi.mock('@/lib/integrations/google-calendar-client', () => m.google)

const usuario = (orgRole: string, org: Record<string, unknown> = {}) => ({
  id: `u-${orgRole}`, email: `${orgRole.toLowerCase()}@conta.com`, name: orgRole, organizationId: 'org-a', orgRole,
  pipelineRestricted: false, allowedPipelineIds: [], role: 'USER',
  organization: { id: 'org-a', tier: 'BUSINESS', wabaGrandfathered: false, ...org },
})
const pedido = (url: string, method = 'GET', body?: unknown) =>
  new Request(`https://crm.test${url}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }),
  }) as never

const waba = () => import('@/app/api/integrations/whatsapp-official/settings/route')
const agendaInicio = () => import('@/app/api/integrations/google-calendar/auth/route')
const agendaRetorno = () => import('@/app/api/integrations/google-calendar/callback/route')

/** Every route that changes an account-wide integration, with a body that would write if allowed. */
const mudancas: [string, () => Promise<any>, 'POST' | 'PATCH', unknown][] = [
  ['whatsapp-official/settings', waba, 'POST',
    { organizationId: 'org-a', enabled: true, phoneNumberId: '123', accessToken: 'token-novo', appSecret: 'segredo-novo' }],
  ['n8n/settings', () => import('@/app/api/integrations/n8n/settings/route'), 'POST', { organizationId: 'org-a', enabled: false }],
  ['google-calendar/settings', () => import('@/app/api/integrations/google-calendar/settings/route'), 'POST',
    { organizationId: 'org-a', action: 'disconnect' }],
  ['omie/settings', () => import('@/app/api/integrations/omie/settings/route'), 'PATCH', { omieEnabled: false }],
]

beforeEach(() => {
  vi.clearAllMocks()
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('integrações da conta', () => {
  it('vendedor, supervisor e coordenador: toda rota que muda integração recusa com quem pode, e nada é gravado', async () => {
    for (const [rota, carregar, metodo, corpo] of mudancas) {
      const mod = await carregar()
      for (const papel of ['VENDEDOR', 'SUPERVISOR', 'COORDENADOR', 'MEMBER']) {
        m.state.usuario = usuario(papel)
        const res = await mod[metodo](pedido(`/api/integrations/${rota}`, metodo, corpo))
        expect(res.status, `${papel} em ${rota}`).toBe(403)
        expect((await res.json()).error).toMatch(/dono e o gerente/)
      }
    }
    expect(m.prisma.organization.update).not.toHaveBeenCalled()
  })

  it('dono e gerente continuam mudando integração', async () => {
    const omie = await import('@/app/api/integrations/omie/settings/route')
    for (const papel of ['OWNER', 'GERENTE']) {
      m.state.usuario = usuario(papel)
      const res = await omie.PATCH(pedido('/api/integrations/omie/settings', 'PATCH', { omieEnabled: false }))
      expect(res.status, papel).toBe(200)
    }
    expect(m.prisma.organization.update).toHaveBeenCalledWith({ where: { id: 'org-a' }, data: { omieEnabled: false } })
  })

  it('WhatsApp oficial: vale o mesmo plano da tela, Business ou conta que já tinha acesso', async () => {
    const { POST } = await waba()
    const corpo = { organizationId: 'org-a', enabled: false }
    const casos: [Record<string, unknown>, number][] = [
      [{ tier: 'PRO' }, 403],
      [{ tier: 'PRO', wabaGrandfathered: true }, 200],
      [{ tier: 'STARTER', wabaGrandfathered: true }, 200],
      [{ tier: 'BUSINESS' }, 200],
    ]
    for (const [org, status] of casos) {
      m.state.usuario = usuario('GERENTE', org)
      const res = await POST(pedido('/api/integrations/whatsapp-official/settings', 'POST', corpo))
      expect(res.status, JSON.stringify(org)).toBe(status)
    }
    expect(m.prisma.organization.update).toHaveBeenCalledTimes(3)
  })
})

describe('Google Agenda da conta', () => {
  const stateEmitido = async () => {
    const res = await (await agendaInicio()).GET(pedido('/api/integrations/google-calendar/auth'))
    return new URL(res.headers.get('location')!).searchParams.get('state')!
  }
  const retorno = async (state: string) =>
    (await agendaRetorno()).GET(
      pedido(`/api/integrations/google-calendar/callback?code=codigo&state=${encodeURIComponent(state)}`),
    )

  it('vendedor não inicia a conexão da agenda da conta', async () => {
    m.state.usuario = usuario('VENDEDOR')
    const res = await (await agendaInicio()).GET(pedido('/api/integrations/google-calendar/auth'))
    expect(res.headers.get('location')).toMatch(/google-calendar\?error=forbidden/)
    expect(m.google.getGoogleCalendarAuthUrl).not.toHaveBeenCalled()
  })

  it('state montado à mão para outra conta não grava token nenhum', async () => {
    m.state.usuario = null
    const forjado = Buffer.from(JSON.stringify({ organizationId: 'org-b', userId: 'u-qualquer' })).toString('base64')
    const res = await retorno(forjado)
    expect(res.headers.get('location')).toMatch(/error=invalid_state/)
    expect(m.google.exchangeCodeForTokens).not.toHaveBeenCalled()
    expect(m.prisma.organization.update).not.toHaveBeenCalled()
  })

  it('o state emitido para o gerente conecta a agenda da conta dele', async () => {
    m.state.usuario = usuario('GERENTE')
    const res = await retorno(await stateEmitido())
    expect(res.headers.get('location')).toMatch(/success=true/)
    expect(m.prisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'org-a' }, data: expect.objectContaining({ googleCalendarEnabled: true }) }),
    )
  })

  it('state vencido (mais de 10 minutos) é recusado', async () => {
    m.state.usuario = usuario('GERENTE')
    const state = await stateEmitido()
    const agora = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(agora + 11 * 60_000)
    const res = await retorno(state)
    expect(res.headers.get('location')).toMatch(/error=invalid_state/)
    expect(m.prisma.organization.update).not.toHaveBeenCalled()
  })

  it('quem deixou de ser gerente antes de voltar do Google não conecta', async () => {
    m.state.usuario = usuario('GERENTE')
    const state = await stateEmitido()
    m.state.usuario = usuario('VENDEDOR')
    const res = await retorno(state)
    expect(res.headers.get('location')).toMatch(/error=forbidden/)
    expect(m.prisma.organization.update).not.toHaveBeenCalled()
  })
})
