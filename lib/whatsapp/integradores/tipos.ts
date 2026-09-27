/**
 * Contract shared by the three integrator adapters (spec 012, contracts/adaptador.md).
 * The customer brings their own Z-API, uazapi or Evolution API account; Sirius only stores the credentials, encrypted.
 */

export type Provider = 'ZAPI' | 'UAZAPI' | 'EVOLUTION'

export const NOME_INTEGRADOR: Record<Provider, string> = { ZAPI: 'Z-API', UAZAPI: 'uazapi', EVOLUTION: 'Evolution API' }

export type StatusConexao = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'FAILED' | 'SUSPENDED'

export const ROTULO_ESTADO: Record<StatusConexao, string> = {
  CONNECTED: 'Conectado',
  CONNECTING: 'Aguardando QR Code',
  DISCONNECTED: 'Desconectado',
  FAILED: 'Precisa reconectar',
  SUSPENDED: 'Suspenso',
}

/** Reason written when the owner or manager disconnects; the screen reads it as "no credentials left" */
export const MOTIVO_DESCONECTADA_POR = 'desconectada por'

export type Credenciais =
  | { provider: 'ZAPI'; instanceId: string; token: string; clientToken?: string }
  | { provider: 'UAZAPI'; baseUrl: string; token: string }
  | { provider: 'EVOLUTION'; baseUrl: string; instanceName: string; apiKey: string }

export type StatusIntegrador = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'FAILED'

export type EstadoIntegrador = {
  status: StatusIntegrador
  /** Sentence for the screen: "sessão encerrada no celular", "número bloqueado"... */
  motivo: string | null
  /** Digits only, when paired */
  phoneNumber: string | null
}

export type Midia = { buffer: Buffer; mimetype: string; nomeArquivo?: string }

export type TipoMidia = 'image' | 'video' | 'audio' | 'document'

/** Where to fetch received media later: the Z-API URL (30 days) or the message id on uazapi and Evolution */
export type RefMidia = { url: string } | { messageId: string }

export type EventoMensagem = {
  tipo: 'mensagem'
  messageId: string
  /** remoteJid as the integrator sent it (phone JID or @lid) */
  jid: string
  /** digits, from the JID or the alternate field (phone, sender_pn, remoteJidAlt) */
  telefone: string | null
  nomePerfil: string | null
  fromMe: boolean
  enviadaEm: Date
  /** body or caption; "[Imagem]", "[Áudio]"... when empty, like the official route */
  texto: string
  midia: { tipo: TipoMidia | 'sticker'; ref: RefMidia; mimetype?: string } | null
}

export type Evento =
  | EventoMensagem
  | { tipo: 'entrega'; messageIds: string[]; status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' }
  | { tipo: 'conexao'; status: StatusIntegrador; motivo: string | null; phoneNumber: string | null }

export interface Adaptador {
  /** Resolves the instance identity and checks the credentials. Throws RecusaIntegrador naming the refused field. */
  conferir(c: Credenciais): Promise<{ instanceName: string } & EstadoIntegrador>
  ligarAviso(c: Credenciais, url: string): Promise<void>
  desligarAviso(c: Credenciais): Promise<void>
  qrCode(c: Credenciais): Promise<{ qrCode: string } | { conectado: true; phoneNumber: string | null }>
  estado(c: Credenciais): Promise<EstadoIntegrador>
  enviarTexto(c: Credenciais, para: string, texto: string): Promise<{ messageId: string }>
  enviarMidia(
    c: Credenciais,
    para: string,
    midia: Midia & { tipo: TipoMidia; legenda?: string; ptt?: boolean },
  ): Promise<{ messageId: string }>
  baixarMidia(c: Credenciais, ref: RefMidia): Promise<Midia>
  /** Pure: turns one notice body into zero or more events. Unknown or ignored notices return []. */
  interpretar(corpo: unknown): Evento[]
}

/** The integrator refused the credentials or the instance (401, 403, unknown instance). */
export class RecusaIntegrador extends Error {
  constructor(
    readonly campo: string,
    readonly motivo: string,
  ) {
    super(`${campo}: ${motivo}`)
    this.name = 'RecusaIntegrador'
  }
}

/** Timeout, network error or 5xx: not a refusal, and not a dropped connection. */
export class FalhaIntegrador extends Error {
  constructor(
    motivo: string,
    readonly status?: number,
  ) {
    super(motivo)
    this.name = 'FalhaIntegrador'
  }
}
