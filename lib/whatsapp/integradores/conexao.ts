import { NextResponse } from 'next/server'
import type { Prisma, WhatsAppConnection } from '.prisma/client-wa'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { decrypt, encrypt } from '@/lib/encryption'
import { getEffectiveTier } from '@/lib/entitlements'
import { getWhatsAppOfficialClient } from '@/lib/integrations/whatsapp-official-client'
import { EnderecoNaoPermitido } from '@/lib/url-publica'
import { chaveTelefone } from '@/lib/whatsapp/telefone'
import { FalhaIntegrador, RecusaIntegrador, type Credenciais } from './tipos'

export { NOME_INTEGRADOR } from './tipos'

/** WhatsApp through an integrator is on every paid plan; the trial counts (research R9). */
export async function contaTemPlanoPago(organizationId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true, trialEndsAt: true, trialStatus: true },
  })
  return !!org && getEffectiveTier(org) !== 'FREE'
}

/** How each credential field is called on the screen */
export const ROTULO_CAMPO: Record<string, string> = {
  instanceId: 'ID da instância',
  token: 'token da instância',
  clientToken: 'Client-Token',
  baseUrl: 'endereço do servidor',
  instanceName: 'nome da instância',
  apiKey: 'API key da instância',
  url: 'link da mídia',
}

/** Integrator errors as the routes answer them; anything else is rethrown. */
export function respostaDoErro(erro: unknown): Response {
  if (erro instanceof EnderecoNaoPermitido) {
    return NextResponse.json({ error: 'O endereço precisa ser público e com HTTPS.' }, { status: 400 })
  }
  if (erro instanceof RecusaIntegrador) {
    const campo = ROTULO_CAMPO[erro.campo] ?? erro.campo
    return NextResponse.json({ error: `O integrador recusou o ${campo}: ${erro.motivo}. Confira o dado e tente de novo.` }, { status: 422 })
  }
  if (erro instanceof FalhaIntegrador) {
    return NextResponse.json({ error: `O integrador não respondeu como esperado: ${erro.message}. Tente de novo em instantes.` }, { status: 502 })
  }
  throw erro
}

/** The only shape a connection leaves the server in (FR-005): no credentials, secret or hash. */
export type ConexaoPublica = {
  id: string
  provider: 'ZAPI' | 'UAZAPI' | 'EVOLUTION' | null
  instanceName: string
  baseUrl: string | null
  phoneNumber: string | null
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'FAILED' | 'SUSPENDED'
  statusMotivo: string | null
  statusMudouEm: string | null
  connectedAt: string | null
}

export const SELECT_PUBLICO = {
  id: true,
  provider: true,
  instanceName: true,
  baseUrl: true,
  phoneNumber: true,
  status: true,
  statusMotivo: true,
  statusMudouEm: true,
  connectedAt: true,
} satisfies Prisma.WhatsAppConnectionSelect

type LinhaPublica = Prisma.WhatsAppConnectionGetPayload<{ select: typeof SELECT_PUBLICO }>

export function paraPublica(linha: LinhaPublica): ConexaoPublica {
  return {
    id: linha.id,
    provider: linha.provider,
    instanceName: linha.instanceName,
    baseUrl: linha.baseUrl,
    phoneNumber: linha.phoneNumber,
    status: linha.status,
    statusMotivo: linha.statusMotivo,
    statusMudouEm: linha.statusMudouEm?.toISOString() ?? null,
    connectedAt: linha.connectedAt?.toISOString() ?? null,
  }
}

export const cifrarCredenciais = (c: Credenciais) => encrypt(JSON.stringify(c))

export function decifrarCredenciais(apiKey: string | null): Credenciais | null {
  if (!apiKey) return null
  try {
    return JSON.parse(decrypt(apiKey)) as Credenciais
  } catch {
    return null
  }
}

/** The connection of this account, with its credentials decrypted (null when disconnected by the owner). */
export async function carregarConexao(
  organizationId: string,
  id: string,
): Promise<{ linha: WhatsAppConnection; credenciais: Credenciais | null } | null> {
  const linha = await prismaWa.whatsAppConnection.findFirst({ where: { id, organizationId } })
  if (!linha) return null
  return { linha, credenciais: decifrarCredenciais(linha.apiKey) }
}

export type ConexaoDaConversa = { via: 'oficial' } | { via: 'integrador'; connectionId: string } | { via: 'nenhuma' }

/**
 * Which connection a reply must go out through (FR-018): the one the contact last wrote to. A contact who never wrote
 * has no conversation connection, and any connection of the account may reach them.
 */
export async function conexaoDaConversa(organizationId: string, contactId: string): Promise<ConexaoDaConversa> {
  const ultima = await prismaWa.whatsAppMessage.findFirst({
    where: { organizationId, contactId, direction: 'INBOUND' },
    orderBy: { sentAt: 'desc' },
    select: { connectionId: true },
  })
  if (!ultima) return { via: 'nenhuma' }
  return ultima.connectionId ? { via: 'integrador', connectionId: ultima.connectionId } : { via: 'oficial' }
}

/**
 * One number fits in only one connection per account (FR-008): compares by phone key with the official API number,
 * when the account has it, and with the account's other integrator connections that hold credentials.
 * Returns the reason to refuse, or null.
 */
export async function numeroJaConectado(
  organizationId: string,
  phoneNumber: string | null,
  excetoId: string | null,
): Promise<string | null> {
  const chave = chaveTelefone(phoneNumber)
  if (!chave) return null

  const outras = await prismaWa.whatsAppConnection.findMany({
    where: {
      organizationId,
      provider: { not: null },
      apiKey: { not: null },
      phoneNumber: { not: null },
      ...(excetoId ? { NOT: { id: excetoId } } : {}),
    },
    select: { phoneNumber: true },
  })
  if (outras.some((c) => chaveTelefone(c.phoneNumber) === chave)) return 'este número já está conectado nesta conta'

  const oficial = await getWhatsAppOfficialClient(organizationId)
  if (oficial) {
    try {
      const info = await oficial.getPhoneNumberInfo()
      if (chaveTelefone(info.display_phone_number) === chave) return 'número já conectado pela API oficial'
    } catch {
      // ponytail: Meta unreachable does not block the integrator; the settings route checks the other direction
    }
  }
  return null
}
