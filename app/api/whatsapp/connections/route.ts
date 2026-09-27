/**
 * API Route: /api/whatsapp/connections
 *
 * WhatsApp through the integrator the customer already pays for (spec 012, contracts/rotas.md):
 * Z-API, uazapi or Evolution API. Sirius checks the credentials, records the risk notice acceptance and turns the
 * integrator's notices on at an address with a secret of its own.
 */

import { createHash, randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prismaWa } from '@/lib/prisma-wa'
import { getSession } from '@/lib/auth'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'
import logger from '@/lib/logger'
import { autorizarConfiguracao, carregarAcesso, podeVerTudo } from '@/lib/visibilidade'
import { ipDoPedido, registrarAceiteIntegrador } from '@/lib/auditoria'
import { VERSAO_AVISO_INTEGRADOR } from '@/lib/termos'
import { checkWhatsAppInstanceLimit } from '@/lib/entitlements'
import { garantirUrlPublica } from '@/lib/url-publica'
import { adaptador } from '@/lib/whatsapp/integradores'
import type { Credenciais } from '@/lib/whatsapp/integradores/tipos'
import {
  NOME_INTEGRADOR, ROTULO_CAMPO, SELECT_PUBLICO, cifrarCredenciais, contaTemPlanoPago, numeroJaConectado, paraPublica, respostaDoErro,
} from '@/lib/whatsapp/integradores/conexao'
import { mudarEstado } from '@/lib/whatsapp/integradores/estado'

const texto = z.string().trim().min(1)
const corpoSchema = z.discriminatedUnion('provider', [
  z.object({ provider: z.literal('ZAPI'), instanceId: texto, token: texto, clientToken: z.string().trim().optional(), aceite: z.unknown() }),
  z.object({ provider: z.literal('UAZAPI'), baseUrl: texto, token: texto, aceite: z.unknown() }),
  z.object({ provider: z.literal('EVOLUTION'), baseUrl: texto, instanceName: texto, apiKey: texto, aceite: z.unknown() }),
])

/**
 * GET: the account's integrator connections, with the plan limit. Anyone in the account reads it; `podeGerenciar`
 * tells the screen whether to offer changes.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.email) return await apiError(ERR.UNAUTHORIZED, 401)
    const acesso = await carregarAcesso({ email: session.user.email })
    if (!acesso) return await apiError(ERR.USER_NOT_FOUND, 404)

    const [linhas, { limite, usadas }] = await Promise.all([
      prismaWa.whatsAppConnection.findMany({
        // legacy gateway rows (no provider) are discontinued and stay out
        where: { organizationId: acesso.organizationId, provider: { not: null } },
        select: SELECT_PUBLICO,
        orderBy: { createdAt: 'desc' },
      }),
      checkWhatsAppInstanceLimit(acesso.organizationId),
    ])
    return NextResponse.json({ conexoes: linhas.map(paraPublica), limite, usadas, podeGerenciar: podeVerTudo(acesso) })
  } catch (error) {
    logger.error({ error }, 'Error fetching WhatsApp connections')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

/** The address the integrator must never be: an internal one, plain http, or Sirius itself. */
function enderecoPermitido(baseUrl: string, pedidoUrl: string): string | null {
  try {
    const alvo = garantirUrlPublica(baseUrl, { exigirHttps: true })
    const proprios = [new URL(pedidoUrl).hostname, process.env.NEXT_PUBLIC_APP_URL && new URL(process.env.NEXT_PUBLIC_APP_URL).hostname]
    if (proprios.includes(alvo.hostname) || alvo.hostname === 'localhost') return null
    return alvo.origin + alvo.pathname.replace(/\/+$/, '')
  } catch {
    return null
  }
}

/** The instance identity when it is known before asking the integrator (uazapi only says it on the status call). */
function nomePrevisto(c: Credenciais): string | null {
  if (c.provider === 'ZAPI') return c.instanceId
  if (c.provider === 'EVOLUTION') return `${new URL(c.baseUrl).host}/${c.instanceName}`
  return null
}

export async function POST(req: Request) {
  const acesso = await autorizarConfiguracao()
  if (acesso instanceof Response) return acesso
  const { organizationId } = acesso

  try {
    // 1. Plan
    if (!(await contaTemPlanoPago(organizationId))) {
      return NextResponse.json(
        { error: 'WhatsApp por integrador está nos planos pagos, a partir do Starter. Assine um plano para conectar.' },
        { status: 403 },
      )
    }

    // 2. Body
    const lido = corpoSchema.safeParse(await req.json().catch(() => null))
    if (!lido.success) {
      const campo = String(lido.error.issues[0]?.path[0] ?? 'provider')
      const rotulo = campo === 'provider' ? 'integrador (Z-API, uazapi ou Evolution API)' : (ROTULO_CAMPO[campo] ?? campo)
      return NextResponse.json({ error: `Preencha o ${rotulo}.` }, { status: 400 })
    }
    const corpo = lido.data

    // 3. Address: nothing goes out before this
    let credenciais: Credenciais
    if (corpo.provider === 'ZAPI') {
      credenciais = { provider: 'ZAPI', instanceId: corpo.instanceId, token: corpo.token, ...(corpo.clientToken ? { clientToken: corpo.clientToken } : {}) }
    } else {
      const baseUrl = enderecoPermitido(corpo.baseUrl, req.url)
      if (!baseUrl) {
        return NextResponse.json({ error: 'O endereço do servidor precisa ser público e com HTTPS.' }, { status: 400 })
      }
      credenciais = corpo.provider === 'UAZAPI'
        ? { provider: 'UAZAPI', baseUrl, token: corpo.token }
        : { provider: 'EVOLUTION', baseUrl, instanceName: corpo.instanceName, apiKey: corpo.apiKey }
    }

    // 4. Acceptance (terms 6.2): nothing is written without it
    if (corpo.aceite !== true) {
      return NextResponse.json({ error: 'O aceite do aviso é obrigatório para conectar.' }, { status: 400 })
    }

    // 5 and 6. Limit and instance, before the credentials when the identity is already known
    const conferirLimiteEInstancia = async (instanceName: string): Promise<Response | null> => {
      const reusada = await prismaWa.whatsAppConnection.findFirst({
        where: { organizationId, instanceName },
        select: { id: true },
      })
      const { limite, cabe } = await checkWhatsAppInstanceLimit(organizationId, reusada?.id)
      if (!cabe) {
        const plural = limite === 1 ? 'conexão' : 'conexões'
        return NextResponse.json(
          { error: `Seu plano permite ${limite} ${plural} de WhatsApp. Compre uma conexão extra em Plano e cobrança, ou mude de plano.`, codigo: 'LIMITE' },
          { status: 409 },
        )
      }
      // isolamento: the instance key is unique across accounts on purpose (FR-008); the answer never names the account
      const emUso = await prismaWa.whatsAppConnection.findFirst({
        where: { instanciaChave: `${credenciais.provider}:${instanceName}`, NOT: { organizationId } },
        select: { id: true },
      })
      if (emUso) return NextResponse.json({ error: 'Esta instância já está conectada no Sirius.' }, { status: 409 })
      return null
    }

    const previsto = nomePrevisto(credenciais)
    if (previsto) {
      const recusa = await conferirLimiteEInstancia(previsto)
      if (recusa) return recusa
    }

    // 7. Credentials
    const integrador = adaptador(credenciais.provider)
    const conferido = await integrador.conferir(credenciais)
    if (!previsto) {
      const recusa = await conferirLimiteEInstancia(conferido.instanceName)
      if (recusa) return recusa
    }

    // 8. Acceptance recorded before the connection exists
    const session = await getSession()
    await registrarAceiteIntegrador({
      organizationId,
      autor: { userId: acesso.userId, email: session?.user?.email ?? '', tipo: 'USUARIO' },
      integrador: NOME_INTEGRADOR[credenciais.provider],
      aceite: corpo.aceite,
      ip: ipDoPedido(req.headers),
    })

    // 9. Connection, created or reused by (account, instance) so a reconnection keeps the history
    const segredo = randomBytes(32).toString('base64url')
    const dados = {
      provider: credenciais.provider,
      baseUrl: credenciais.provider === 'ZAPI' ? null : credenciais.baseUrl,
      apiKey: cifrarCredenciais(credenciais),
      webhookSegredoHash: createHash('sha256').update(segredo).digest('hex'),
      instanciaChave: `${credenciais.provider}:${conferido.instanceName}`,
      avisoVersao: VERSAO_AVISO_INTEGRADOR,
      userId: acesso.userId,
      status: 'CONNECTING' as const,
      statusMotivo: null,
      statusMudouEm: new Date(),
    }
    let linha
    try {
      linha = await prismaWa.whatsAppConnection.upsert({
        where: { organizationId_instanceName: { organizationId, instanceName: conferido.instanceName } },
        create: { organizationId, instanceName: conferido.instanceName, ...dados },
        update: dados,
      })
    } catch (erro: any) {
      if (erro?.code === 'P2002') return NextResponse.json({ error: 'Esta instância já está conectada no Sirius.' }, { status: 409 })
      throw erro
    }

    // 10. Notices at the secret address
    const base = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/+$/, '')
    try {
      await integrador.ligarAviso(credenciais, `${base}/api/webhooks/whatsapp-integrador/${segredo}`)
    } catch (erro) {
      await mudarEstado(linha, 'FAILED', 'o integrador recusou o endereço de aviso do Sirius')
      return respostaDoErro(erro)
    }

    // 11. Already paired: one number fits in only one connection of the account (FR-008)
    if (conferido.status === 'CONNECTED') {
      const proibido = await numeroJaConectado(organizationId, conferido.phoneNumber, linha.id)
      if (proibido) {
        await mudarEstado(linha, 'FAILED', proibido, { dados: { phoneNumber: conferido.phoneNumber } })
        await integrador.desligarAviso(credenciais).catch((erro) => logger.warn({ connectionId: linha.id, erro: String(erro) }, 'integrator notice not turned off'))
      } else {
        await mudarEstado(linha, 'CONNECTED', null, { dados: { phoneNumber: conferido.phoneNumber } })
      }
    }

    const atual = await prismaWa.whatsAppConnection.findFirst({ where: { id: linha.id, organizationId }, select: SELECT_PUBLICO })
    logger.info({ organizationId, connectionId: linha.id, provider: credenciais.provider }, 'WhatsApp integrator connected')
    return NextResponse.json(paraPublica(atual ?? linha), { status: 201 })
  } catch (erro) {
    try {
      return respostaDoErro(erro)
    } catch {
      logger.error({ organizationId, erro: String(erro) }, 'Error connecting WhatsApp integrator')
      return await apiError(ERR.INTERNAL_ERROR, 500)
    }
  }
}
