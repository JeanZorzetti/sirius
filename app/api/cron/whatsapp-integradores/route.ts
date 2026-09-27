/**
 * WhatsApp integrator check (spec 012, research R8). Every 5 minutes, from the same scheduler as the other
 * /api/cron/* jobs: asks each integrator connection holding credentials for its state, so a drop the integrator never
 * announced still shows within 15 minutes (FR-025).
 *
 * Manual test:
 * GET /api/cron/whatsapp-integradores?token=SEU_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import type { WhatsAppConnection } from '.prisma/client-wa'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { getEffectiveTier } from '@/lib/entitlements'
import logger from '@/lib/logger'
import { VERSAO_AVISO_INTEGRADOR } from '@/lib/termos'
import { adaptador } from '@/lib/whatsapp/integradores'
import { decifrarCredenciais, numeroJaConectado } from '@/lib/whatsapp/integradores/conexao'
import { mudarEstado } from '@/lib/whatsapp/integradores/estado'
import { RecusaIntegrador } from '@/lib/whatsapp/integradores/tipos'

export const runtime = 'nodejs'
export const maxDuration = 300

const LOTE = 10

type Resultado = 'mudou' | 'igual' | 'falha'

async function conferir(c: WhatsAppConnection & { provider: NonNullable<WhatsAppConnection['provider']> }, pago: boolean): Promise<Resultado> {
  if (!pago) {
    return (await mudarEstado(c, 'SUSPENDED', 'plano sem WhatsApp')) ? 'mudou' : 'igual'
  }
  // Back on a paid plan: the notice version accepted then must still be the current one (FR-027)
  if (c.status === 'SUSPENDED' && c.avisoVersao !== VERSAO_AVISO_INTEGRADOR) {
    return (await mudarEstado(c, 'FAILED', 'aceite o aviso novo para reativar')) ? 'mudou' : 'igual'
  }
  const credenciais = decifrarCredenciais(c.apiKey)
  if (!credenciais) return 'falha'

  let resultado: Resultado = 'igual'
  try {
    const e = await adaptador(c.provider).estado(credenciais)
    // still waiting for its first QR Code: not a drop
    if (c.status === 'CONNECTING' && e.status !== 'CONNECTED') return 'igual'
    if (e.status !== c.status) {
      if (e.status === 'CONNECTED') {
        const proibido = await numeroJaConectado(c.organizationId, e.phoneNumber, c.id)
        if (proibido) {
          resultado = (await mudarEstado(c, 'FAILED', proibido, { dados: { phoneNumber: e.phoneNumber } })) ? 'mudou' : 'igual'
        } else {
          resultado = (await mudarEstado(c, 'CONNECTED', null, e.phoneNumber ? { dados: { phoneNumber: e.phoneNumber } } : {})) ? 'mudou' : 'igual'
        }
      } else {
        resultado = (await mudarEstado(c, e.status, e.motivo)) ? 'mudou' : 'igual'
      }
    }
  } catch (erro) {
    if (!(erro instanceof RecusaIntegrador)) {
      // a network error or a 5xx is not a drop
      logger.warn({ connectionId: c.id, erro: String(erro) }, 'WhatsApp integrator check failed')
      return 'falha'
    }
    resultado = (await mudarEstado(c, 'FAILED', 'o integrador recusou as credenciais; conecte de novo')) ? 'mudou' : 'igual'
  }

  await prismaWa.whatsAppConnection.updateMany({
    where: { id: c.id, organizationId: c.organizationId },
    data: { lastSyncAt: new Date() },
  })
  return resultado
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  const token = new URL(request.url).searchParams.get('token')
  if (!cronSecret || (auth !== `Bearer ${cronSecret}` && token !== cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const inicio = Date.now()
  // Every account's connections, by definition of the job; each change below carries the connection's own account
  const conexoes = await prismaWa.whatsAppConnection.findMany({
    where: { provider: { not: null }, apiKey: { not: null } },
  })
  const orgIds = conexoes.map((c) => c.organizationId)
  const contas = await prisma.organization.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, tier: true, trialEndsAt: true, trialStatus: true },
  })
  const pagas = new Set(contas.filter((o) => getEffectiveTier(o) !== 'FREE').map((o) => o.id))

  let mudancas = 0
  let falhas = 0
  for (let i = 0; i < conexoes.length; i += LOTE) {
    const resultados = await Promise.all(
      conexoes.slice(i, i + LOTE).map((c) =>
        conferir(c as WhatsAppConnection & { provider: NonNullable<WhatsAppConnection['provider']> }, pagas.has(c.organizationId)).catch(
          (erro): Resultado => {
            logger.error({ connectionId: c.id, erro: String(erro) }, 'WhatsApp integrator check crashed')
            return 'falha'
          },
        ),
      ),
    )
    mudancas += resultados.filter((r) => r === 'mudou').length
    falhas += resultados.filter((r) => r === 'falha').length
  }

  const resposta = { conferidas: conexoes.length, mudancas, falhas, ms: Date.now() - inicio }
  logger.info(resposta, 'WhatsApp integrators checked')
  return NextResponse.json(resposta)
}
