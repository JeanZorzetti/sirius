/**
 * Terms section 6.5, in code (spec 012, research R7). Through an integrator only a person sends, from the inbox, to
 * one contact at a time; "SAIR" locks the contact; a per-minute limit refuses on the spot. Everything is derived from
 * the messages that already exist, so it holds across processes without a new column.
 *
 * The pure functions are safe to import on the client (the conversation shows the "SAIR" lock by the same rule).
 */

/** Only the inbox exists today; any other origin is refused (FR-020). */
export type OrigemEnvio = 'inbox'

/** 20 per minute lets a person typing fast with quick replies through, and stops a script. */
export const LIMITE_POR_MINUTO = 20

const PALAVRAS_DE_PARADA = new Set(['sair', 'parar', 'stop'])

/** The contact's message, without spaces or punctuation and in lowercase, is "sair", "parar" or "stop" (FR-022). */
export function pediuParaParar(texto: string | null | undefined): boolean {
  const limpo = (texto ?? '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')
  return PALAVRAS_DE_PARADA.has(limpo)
}

export type DadosDasTravas = {
  /** The contact's last message to this connection, or null if they never wrote to it */
  ultimaEntrada: { texto: string } | null
  enviosUltimoMinuto: number
}

/** null: may send. Otherwise the reason, written for the screen. */
export function avaliarTravas(
  entrada: { origem: OrigemEnvio; destinatarios: number } & DadosDasTravas,
): string | null {
  const origem: string = entrada.origem
  if (origem !== 'inbox') {
    // FR-021: a send with no person typing needs a message from that contact first
    if (!entrada.ultimaEntrada) {
      return 'este contato nunca escreveu para este número; o primeiro contato automático só pela API oficial'
    }
    return 'pelo integrador só sai mensagem digitada por uma pessoa no inbox; envio automático só pela API oficial'
  }
  if (entrada.destinatarios !== 1) {
    return 'pelo integrador a mensagem vai para um contato por vez; para vários, use a API oficial'
  }
  if (pediuParaParar(entrada.ultimaEntrada?.texto)) {
    return 'o contato pediu para parar (mandou "SAIR"); a conversa volta quando ele escrever de novo'
  }
  if (entrada.enviosUltimoMinuto >= LIMITE_POR_MINUTO) {
    return `limite de ${LIMITE_POR_MINUTO} mensagens por minuto neste número; aguarde alguns segundos e envie de novo`
  }
  return null
}

/** The two numbers the rules need, read from the connection's messages. */
export async function dadosDasTravas(organizationId: string, connectionId: string, contactId: string): Promise<DadosDasTravas> {
  // loaded here so the pure functions above stay importable on the client
  const { prismaWa } = await import('@/lib/prisma-wa')
  const [ultima, enviosUltimoMinuto] = await Promise.all([
    prismaWa.whatsAppMessage.findFirst({
      where: { organizationId, connectionId, contactId, direction: 'INBOUND' },
      orderBy: { sentAt: 'desc' },
      select: { text: true },
    }),
    prismaWa.whatsAppMessage.count({
      where: { organizationId, connectionId, direction: 'OUTBOUND', sentAt: { gte: new Date(Date.now() - 60_000) } },
    }),
  ])
  return { ultimaEntrada: ultima ? { texto: ultima.text } : null, enviosUltimoMinuto }
}
