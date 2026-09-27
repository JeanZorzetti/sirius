import { jidIgnorado, telefoneDoJid } from '@/lib/whatsapp/telefone'
import { chamarJson, corpoJson, credenciaisDe, quando, textoDaMidia } from './index'
import { FalhaIntegrador, RecusaIntegrador, type Adaptador, type Credenciais, type EstadoIntegrador, type Evento, type TipoMidia } from './tipos'

/**
 * Evolution API v2 (self-hosted by the customer). Always the instance API key, never the global one, which opens
 * every instance on the customer's server.
 */

const CAMPO = 'apiKey'

const e = (c: Credenciais) => credenciaisDe(c, 'EVOLUTION')
const base = (c: Credenciais) => e(c).baseUrl.replace(/\/+$/, '')
const inst = (c: Credenciais) => encodeURIComponent(e(c).instanceName)
const cabecalhos = (c: Credenciais) => ({ apikey: e(c).apiKey })
const get = <T = any>(c: Credenciais, caminho: string) => chamarJson<T>(`${base(c)}${caminho}`, { headers: cabecalhos(c) }, CAMPO)
const post = <T = any>(c: Credenciais, caminho: string, dados: unknown) =>
  chamarJson<T>(`${base(c)}${caminho}`, { method: 'POST', ...corpoJson(dados, cabecalhos(c)) }, CAMPO)

/** Baileys close reasons: 401 logged out, 403 number banned; anything else may come back on its own */
function fechamento(codigo: unknown): EstadoIntegrador {
  if (Number(codigo) === 401) return { status: 'FAILED', motivo: 'sessão encerrada no celular', phoneNumber: null }
  if (Number(codigo) === 403) {
    return { status: 'FAILED', motivo: 'número bloqueado pelo WhatsApp; a saída é a API oficial', phoneNumber: null }
  }
  return { status: 'DISCONNECTED', motivo: 'o integrador perdeu a conexão com o WhatsApp', phoneNumber: null }
}

/** v2.2 answers `[{ ownerJid, disconnectionReasonCode }]`; v2.0 answers `[{ instance: { owner } }]` */
async function instancia(c: Credenciais): Promise<{ owner: string | null; motivo: unknown }> {
  const r = await get<any>(c, `/instance/fetchInstances?instanceName=${inst(c)}`).catch(() => null)
  const i = Array.isArray(r) ? r[0] : r
  return { owner: i?.ownerJid ?? i?.instance?.owner ?? null, motivo: i?.disconnectionReasonCode }
}

async function estado(c: Credenciais): Promise<EstadoIntegrador> {
  const r = await get<{ instance?: { state?: string }; state?: string }>(c, `/instance/connectionState/${inst(c)}`)
  const state = r.instance?.state ?? r.state
  if (state === 'open') return { status: 'CONNECTED', motivo: null, phoneNumber: telefoneDoJid((await instancia(c)).owner) }
  if (state === 'connecting') return { status: 'CONNECTING', motivo: null, phoneNumber: null }
  return fechamento((await instancia(c)).motivo)
}

const ENTREGA: Record<string, 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'> = {
  SERVER_ACK: 'SENT', DELIVERY_ACK: 'DELIVERED', READ: 'READ', PLAYED: 'READ', ERROR: 'FAILED',
}

function mensagem(d: any): Evento[] {
  const k = d?.key
  if (!k?.id || !k.remoteJid) return []
  const jid = String(k.remoteJid)
  if (jidIgnorado(jid)) return []

  const bruta = d.message ?? {}
  const m = bruta.ephemeralMessage?.message ?? bruta.viewOnceMessage?.message ?? bruta.viewOnceMessageV2?.message ??
    bruta.documentWithCaptionMessage?.message ?? bruta
  if (m.reactionMessage || m.protocolMessage) return []

  let midia: { tipo: TipoMidia | 'sticker'; corpo: any } | null = null
  if (m.imageMessage) midia = { tipo: 'image', corpo: m.imageMessage }
  else if (m.videoMessage) midia = { tipo: 'video', corpo: m.videoMessage }
  else if (m.audioMessage) midia = { tipo: 'audio', corpo: m.audioMessage }
  else if (m.documentMessage) midia = { tipo: 'document', corpo: m.documentMessage }
  else if (m.stickerMessage) midia = { tipo: 'sticker', corpo: m.stickerMessage }

  const texto = midia
    ? textoDaMidia(midia.tipo, midia.corpo.caption, midia.corpo.fileName)
    : m.conversation || m.extendedTextMessage?.text ||
      (m.locationMessage ? '[Localização]' : m.contactMessage ? '[Contato]' : '[Mensagem]')

  return [
    {
      tipo: 'mensagem',
      messageId: String(k.id),
      jid,
      // remoteJid is the chat; its phone may come in remoteJidAlt, and senderPn is the contact only when they sent it
      telefone: telefoneDoJid(jid) ?? telefoneDoJid(k.remoteJidAlt) ?? (k.fromMe ? null : telefoneDoJid(d.senderPn ?? k.senderPn)),
      nomePerfil: k.fromMe ? null : d.pushName || null,
      fromMe: !!k.fromMe,
      enviadaEm: quando(d.messageTimestamp),
      texto,
      midia: midia ? { tipo: midia.tipo, ref: { messageId: String(k.id) }, mimetype: midia.corpo.mimetype } : null,
    },
  ]
}

function entregas(lista: any[]): Evento[] {
  const porStatus = new Map<'SENT' | 'DELIVERED' | 'READ' | 'FAILED', string[]>()
  for (const d of lista) {
    const status = ENTREGA[String(d?.status)]
    const id = d?.keyId ?? d?.key?.id
    if (!status || !id) continue
    porStatus.set(status, [...(porStatus.get(status) ?? []), String(id)])
  }
  return [...porStatus].map(([status, messageIds]) => ({ tipo: 'entrega' as const, messageIds, status }))
}

export const evolution: Adaptador = {
  async conferir(c) {
    try {
      // one server hosts many instances, and two customers may name theirs alike: the identity carries the host
      return { instanceName: `${new URL(base(c)).host}/${e(c).instanceName}`, ...(await estado(c)) }
    } catch (erro) {
      if (erro instanceof FalhaIntegrador && erro.status === 404) {
        throw new RecusaIntegrador('instanceName', 'esse servidor não tem uma instância com esse nome')
      }
      throw erro
    }
  },

  async ligarAviso(c, destino) {
    await post(c, `/webhook/set/${inst(c)}`, {
      webhook: { enabled: true, url: destino, byEvents: false, base64: false, events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'] },
    })
  },

  async desligarAviso(c) {
    await post(c, `/webhook/set/${inst(c)}`, { webhook: { enabled: false, url: '', events: [] } })
  },

  async qrCode(c) {
    const r = await get<{ base64?: string; code?: string; instance?: { state?: string } }>(c, `/instance/connect/${inst(c)}`)
    if (r.instance?.state === 'open') return { conectado: true, phoneNumber: telefoneDoJid((await instancia(c)).owner) }
    if (!r.base64) throw new FalhaIntegrador('a Evolution API não devolveu o QR Code')
    return { qrCode: r.base64.startsWith('data:') ? r.base64 : `data:image/png;base64,${r.base64}` }
  },

  estado,

  async enviarTexto(c, para, texto) {
    const r = await post<{ key?: { id?: string } }>(c, `/message/sendText/${inst(c)}`, { number: para, text: texto })
    if (!r.key?.id) throw new FalhaIntegrador('a Evolution API não devolveu o id da mensagem')
    return { messageId: r.key.id }
  },

  async enviarMidia(c, para, m) {
    const base64 = m.buffer.toString('base64') // without the data: prefix, as Evolution expects
    const r = await (m.tipo === 'audio'
      ? post<{ key?: { id?: string } }>(c, `/message/sendWhatsAppAudio/${inst(c)}`, { number: para, audio: base64 })
      : post<{ key?: { id?: string } }>(c, `/message/sendMedia/${inst(c)}`, {
          number: para, mediatype: m.tipo, mimetype: m.mimetype, media: base64, caption: m.legenda, fileName: m.nomeArquivo,
        }))
    if (!r.key?.id) throw new FalhaIntegrador('a Evolution API não devolveu o id da mensagem')
    return { messageId: r.key.id }
  },

  async baixarMidia(c, ref) {
    if (!('messageId' in ref)) throw new FalhaIntegrador('a Evolution API baixa a mídia pelo id da mensagem')
    const r = await post<{ base64?: string; mimetype?: string; fileName?: string }>(c, `/chat/getBase64FromMediaMessage/${inst(c)}`, {
      message: { key: { id: ref.messageId } },
      convertToMp4: false,
    })
    if (!r.base64) throw new FalhaIntegrador('a Evolution API não devolveu a mídia')
    return { buffer: Buffer.from(r.base64, 'base64'), mimetype: r.mimetype || 'application/octet-stream', nomeArquivo: r.fileName }
  },

  interpretar(corpo) {
    const b = corpo as any
    if (!b || typeof b !== 'object') return []
    const lista = Array.isArray(b.data) ? b.data : [b.data]
    switch (String(b.event ?? '').toLowerCase().replace(/_/g, '.')) {
      case 'messages.upsert':
        return lista.flatMap(mensagem)
      case 'messages.update':
        return entregas(lista)
      case 'connection.update': {
        const d = b.data ?? {}
        if (d.state === 'open') return [{ tipo: 'conexao', status: 'CONNECTED', motivo: null, phoneNumber: telefoneDoJid(d.wuid) }]
        if (d.state === 'connecting') return [{ tipo: 'conexao', status: 'CONNECTING', motivo: null, phoneNumber: null }]
        return [{ tipo: 'conexao', ...fechamento(d.statusReason) }]
      }
      default:
        return []
    }
  },
}
