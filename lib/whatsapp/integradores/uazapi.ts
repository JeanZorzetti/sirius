import { digitos, jidIgnorado, telefoneDoJid } from '@/lib/whatsapp/telefone'
import { chamarJson, corpoJson, credenciaisDe, quando, textoDaMidia } from './index'
import { FalhaIntegrador, RecusaIntegrador, type Adaptador, type Credenciais, type EstadoIntegrador, type Evento, type TipoMidia } from './tipos'

/**
 * uazapi v2 (docs.uazapi.com). The customer's server address and the instance token in the `token` header.
 * Paths marked TODO(012 §2) come from the OpenAPI contract and public SDKs and are confirmed on a real instance
 * before push B (quickstart §2).
 */

const CAMPO = 'token'

const u = (c: Credenciais) => credenciaisDe(c, 'UAZAPI')
const base = (c: Credenciais) => u(c).baseUrl.replace(/\/+$/, '')
const cabecalhos = (c: Credenciais) => ({ token: u(c).token })
const get = <T = any>(c: Credenciais, caminho: string) => chamarJson<T>(`${base(c)}${caminho}`, { headers: cabecalhos(c) }, CAMPO)
const post = <T = any>(c: Credenciais, caminho: string, dados: unknown) =>
  chamarJson<T>(`${base(c)}${caminho}`, { method: 'POST', ...corpoJson(dados, cabecalhos(c)) }, CAMPO)

/** Phone digits from a JID or from a bare number */
const telefoneDe = (v: unknown) => telefoneDoJid(String(v ?? '')) ?? (/^\d{8,15}$/.test(String(v ?? '')) ? String(v) : null)

type StatusBruto = { instance?: { id?: string; name?: string; status?: string; owner?: string; qrcode?: string }; status?: { connected?: boolean; loggedIn?: boolean; jid?: string } }

function traduzir(r: StatusBruto): EstadoIntegrador {
  const st = String(r.instance?.status ?? '').toLowerCase()
  const phoneNumber = digitos(r.instance?.owner) || telefoneDe(r.status?.jid) || null
  if (st === 'connected') return { status: 'CONNECTED', motivo: null, phoneNumber }
  if (st === 'connecting') return { status: 'CONNECTING', motivo: null, phoneNumber: null }
  // TODO(012 §2): confirm `status.loggedIn` tells a logout apart from a drop
  if (r.status?.loggedIn === false) return { status: 'FAILED', motivo: 'sessão encerrada no celular', phoneNumber: null }
  return { status: 'DISCONNECTED', motivo: 'o integrador perdeu a conexão com o WhatsApp', phoneNumber: null }
}

const lerStatus = (c: Credenciais) => get<StatusBruto>(c, '/instance/status')

function tipoDaMidia(m: any): TipoMidia | 'sticker' | null {
  const t = String(m.mediaType || m.messageType || '').toLowerCase()
  if (t.includes('image')) return 'image'
  if (t.includes('video')) return 'video'
  if (t.includes('audio') || t === 'ptt') return 'audio'
  if (t.includes('document')) return 'document'
  if (t.includes('sticker')) return 'sticker'
  return null
}

function mensagem(b: any): Evento[] {
  const m = b.message
  if (!m || m.isGroup || m.wasSentByApi || !m.messageid) return []
  const jid = String(m.chatid ?? '')
  if (!jid || jidIgnorado(jid)) return []
  const conteudo = typeof m.content === 'object' && m.content ? m.content : {}
  const tipo = tipoDaMidia(m)
  const legenda = m.text || conteudo.caption || null
  return [
    {
      tipo: 'mensagem',
      messageId: String(m.messageid),
      jid,
      // the chat JID is the contact; sender_pn is the contact only on messages they sent
      telefone: telefoneDe(jid) ?? (m.fromMe ? null : telefoneDe(m.sender_pn)),
      nomePerfil: (m.fromMe ? b.chat?.name : m.senderName || b.chat?.name) || null,
      fromMe: !!m.fromMe,
      enviadaEm: quando(m.messageTimestamp),
      texto: tipo ? textoDaMidia(tipo, legenda, conteudo.fileName) : m.text || (typeof m.content === 'string' ? m.content : '') || '[Mensagem]',
      midia: tipo ? { tipo, ref: { messageId: String(m.messageid) }, mimetype: conteudo.mimetype } : null,
    },
  ]
}

function entrega(b: any): Evento[] {
  const ids: string[] = (b.event?.MessageIDs ?? []).map(String)
  const t = String(b.event?.Type ?? b.state ?? '').toLowerCase()
  // TODO(012 §2): confirm the delivery Type names
  if (!ids.length || t.includes('self')) return []
  const status = t.includes('read') || t.includes('played') ? 'READ' : t.includes('deliver') ? 'DELIVERED' : t.includes('fail') || t.includes('error') ? 'FAILED' : t.includes('sent') || t.includes('server') ? 'SENT' : null
  return status ? [{ tipo: 'entrega', messageIds: ids, status }] : []
}

export const uazapi: Adaptador = {
  async conferir(c) {
    try {
      const r = await lerStatus(c)
      const id = r.instance?.id || r.instance?.name
      if (!id) throw new RecusaIntegrador('token', 'a uazapi não devolveu a instância desse token')
      // one uazapi server hosts many instances, so the identity carries the host
      return { instanceName: `${new URL(base(c)).host}/${id}`, ...traduzir(r) }
    } catch (erro) {
      if (erro instanceof FalhaIntegrador && (erro.status === 400 || erro.status === 404)) {
        throw new RecusaIntegrador('baseUrl', 'esse endereço não respondeu como um servidor uazapi')
      }
      throw erro
    }
  },

  async ligarAviso(c, destino) {
    await post(c, '/webhook', {
      enabled: true,
      url: destino,
      events: ['messages', 'messages_update', 'connection'],
      excludeMessages: ['wasSentByApi'],
      addUrlEvents: false,
      addUrlTypesMessages: false,
    })
  },

  async desligarAviso(c) {
    await post(c, '/webhook', { enabled: false, url: '', events: [] })
  },

  async qrCode(c) {
    // TODO(012 §2): confirm that /instance/connect without `phone` answers with instance.qrcode
    const r = await post<StatusBruto & { connected?: boolean }>(c, '/instance/connect', {})
    const estado = traduzir(r)
    if (r.connected || estado.status === 'CONNECTED') return { conectado: true, phoneNumber: estado.phoneNumber }
    const qr = r.instance?.qrcode
    if (!qr) throw new FalhaIntegrador('a uazapi não devolveu o QR Code')
    return { qrCode: qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}` }
  },

  async estado(c) {
    return traduzir(await lerStatus(c))
  },

  async enviarTexto(c, para, texto) {
    const r = await post<{ messageid?: string; id?: string }>(c, '/send/text', { number: para, text: texto })
    const messageId = r.messageid ?? r.id?.split(':').pop()
    if (!messageId) throw new FalhaIntegrador('a uazapi não devolveu o id da mensagem')
    return { messageId }
  },

  async enviarMidia(c, para, m) {
    // TODO(012 §2): confirm `file` takes plain base64
    const r = await post<{ messageid?: string; id?: string }>(c, '/send/media', {
      number: para,
      type: m.tipo === 'audio' && m.ptt ? 'ptt' : m.tipo,
      file: m.buffer.toString('base64'),
      text: m.legenda,
      docName: m.tipo === 'document' ? m.nomeArquivo : undefined,
    })
    const messageId = r.messageid ?? r.id?.split(':').pop()
    if (!messageId) throw new FalhaIntegrador('a uazapi não devolveu o id da mensagem')
    return { messageId }
  },

  async baixarMidia(c, ref) {
    if (!('messageId' in ref)) throw new FalhaIntegrador('a uazapi baixa a mídia pelo id da mensagem')
    // TODO(012 §2): confirm the download path and its answer
    const r = await post<{ base64Data?: string; base64?: string; mimetype?: string }>(c, '/message/download', { id: ref.messageId, return_base64: true })
    const dados = r.base64Data ?? r.base64
    if (!dados) throw new FalhaIntegrador('a uazapi não devolveu a mídia')
    return { buffer: Buffer.from(dados.replace(/^data:[^,]*,/, ''), 'base64'), mimetype: r.mimetype || 'application/octet-stream' }
  },

  interpretar(corpo) {
    const b = corpo as any
    if (!b || typeof b !== 'object') return []
    switch (String(b.EventType ?? b.eventType ?? '')) {
      case 'messages':
        return mensagem(b)
      case 'messages_update':
        return entrega(b)
      case 'connection': {
        const e = traduzir({ instance: b.instance, status: b.status })
        return [{ tipo: 'conexao', ...e }]
      }
      default:
        return []
    }
  },
}
