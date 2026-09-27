import { digitos, jidIgnorado, telefoneDoJid } from '@/lib/whatsapp/telefone'
import { chamarIntegrador, chamarJson, corpoJson, credenciaisDe, extensaoDe, quando, textoDaMidia } from './index'
import { FalhaIntegrador, RecusaIntegrador, type Adaptador, type Credenciais, type EstadoIntegrador, type Evento, type TipoMidia } from './tipos'

/**
 * Z-API (developer.z-api.io). Fixed host; the instance id and token go in the path, and the account's Client-Token,
 * when enabled, in a header. Research R2 has the table this follows.
 */

const BASE = 'https://api.z-api.io'
const CAMPO = 'token'

const z = (c: Credenciais) => credenciaisDe(c, 'ZAPI')
const url = (c: Credenciais, caminho: string) =>
  `${BASE}/instances/${encodeURIComponent(z(c).instanceId)}/token/${encodeURIComponent(z(c).token)}/${caminho}`
const cabecalhos = (c: Credenciais): Record<string, string> => {
  const { clientToken } = z(c)
  return clientToken ? { 'Client-Token': clientToken } : {}
}
const get = <T = any>(c: Credenciais, caminho: string) => chamarJson<T>(url(c, caminho), { headers: cabecalhos(c) }, CAMPO)
const enviar = <T = any>(c: Credenciais, caminho: string, metodo: 'POST' | 'PUT', dados: unknown) =>
  chamarJson<T>(url(c, caminho), { method: metodo, ...corpoJson(dados, cabecalhos(c)) }, CAMPO)

async function estado(c: Credenciais): Promise<EstadoIntegrador> {
  const s = await get<{ connected?: boolean; error?: string }>(c, 'status')
  if (s.connected) {
    const aparelho = await get<{ phone?: string }>(c, 'device').catch(() => ({}) as { phone?: string })
    return { status: 'CONNECTED', motivo: null, phoneNumber: digitos(aparelho.phone) || null }
  }
  if (/restore/i.test(s.error ?? '')) {
    return { status: 'DISCONNECTED', motivo: 'a sessão caiu e o integrador está tentando restaurar', phoneNumber: null }
  }
  // Z-API answers "You are not connected." both before the first pairing and after a logout
  return { status: 'FAILED', motivo: 'sessão encerrada no celular', phoneNumber: null }
}

const ENTREGA: Record<string, 'SENT' | 'DELIVERED' | 'READ'> = { SENT: 'SENT', RECEIVED: 'DELIVERED', READ: 'READ', PLAYED: 'READ' }

function mensagem(b: any): Evento[] {
  if (b.isGroup || b.isNewsletter || b.broadcast || b.fromApi || b.reaction) return []
  const phone = String(b.phone ?? '')
  let jid: string
  let telefone: string | null
  if (phone.includes('@')) {
    jid = phone
    telefone = telefoneDoJid(phone)
  } else if (/^\d{8,15}$/.test(phone)) {
    jid = `${phone}@s.whatsapp.net`
    telefone = phone
  } else if (typeof b.chatLid === 'string' && b.chatLid) {
    jid = b.chatLid
    telefone = null
  } else return []
  if (jidIgnorado(jid) || !b.messageId) return []

  const bruta: { tipo: TipoMidia | 'sticker'; url?: string; mime?: string; legenda?: string; nome?: string } | null = b.image
    ? { tipo: 'image', url: b.image.imageUrl, mime: b.image.mimeType, legenda: b.image.caption }
    : b.video
      ? { tipo: 'video', url: b.video.videoUrl, mime: b.video.mimeType, legenda: b.video.caption }
      : b.audio
        ? { tipo: 'audio', url: b.audio.audioUrl, mime: b.audio.mimeType }
        : b.document
          ? { tipo: 'document', url: b.document.documentUrl, mime: b.document.mimeType, legenda: b.document.caption, nome: b.document.fileName }
          : b.sticker
            ? { tipo: 'sticker', url: b.sticker.stickerUrl, mime: b.sticker.mimeType }
            : null

  const texto = bruta
    ? textoDaMidia(bruta.tipo, bruta.legenda, bruta.nome)
    : b.text?.message || (b.location ? '[Localização]' : b.contact ? '[Contato]' : '[Mensagem]')

  return [
    {
      tipo: 'mensagem',
      messageId: String(b.messageId),
      jid,
      telefone,
      nomePerfil: (b.fromMe ? b.chatName : b.senderName || b.chatName) || null,
      fromMe: !!b.fromMe,
      enviadaEm: quando(b.momment),
      texto,
      midia: bruta?.url ? { tipo: bruta.tipo, ref: { url: bruta.url }, mimetype: bruta.mime } : null,
    },
  ]
}

export const zapi: Adaptador = {
  async conferir(c) {
    try {
      return { instanceName: z(c).instanceId, ...(await estado(c)) }
    } catch (erro) {
      if (erro instanceof FalhaIntegrador && (erro.status === 400 || erro.status === 404)) {
        throw new RecusaIntegrador('instanceId', 'a Z-API não encontrou uma instância com esse ID e token')
      }
      throw erro
    }
  },

  async ligarAviso(c, destino) {
    await enviar(c, 'update-every-webhooks', 'PUT', { value: destino, notifySentByMe: true })
  },

  async desligarAviso(c) {
    // TODO(012 §2): confirm that an empty value turns the notices off
    await enviar(c, 'update-every-webhooks', 'PUT', { value: '', notifySentByMe: false })
  },

  async qrCode(c) {
    const r = await get<{ value?: string; connected?: boolean }>(c, 'qr-code/image')
    if (r.connected) return { conectado: true, phoneNumber: (await estado(c)).phoneNumber }
    if (!r.value) throw new FalhaIntegrador('a Z-API não devolveu o QR Code')
    return { qrCode: r.value.startsWith('data:') ? r.value : `data:image/png;base64,${r.value}` }
  },

  estado,

  async enviarTexto(c, para, texto) {
    const r = await enviar<{ messageId?: string; id?: string }>(c, 'send-text', 'POST', { phone: para, message: texto })
    const messageId = r.messageId ?? r.id
    if (!messageId) throw new FalhaIntegrador('a Z-API não devolveu o id da mensagem')
    return { messageId }
  },

  async enviarMidia(c, para, m) {
    const arquivo = `data:${m.mimetype};base64,${m.buffer.toString('base64')}`
    const [caminho, dados] =
      m.tipo === 'image'
        ? ['send-image', { phone: para, image: arquivo, caption: m.legenda }]
        : m.tipo === 'video'
          ? ['send-video', { phone: para, video: arquivo, caption: m.legenda }]
          : m.tipo === 'audio'
            ? ['send-audio', { phone: para, audio: arquivo, waveform: true }]
            : [`send-document/${extensaoDe(m.mimetype, m.nomeArquivo)}`, { phone: para, document: arquivo, fileName: m.nomeArquivo, caption: m.legenda }]
    const r = await enviar<{ messageId?: string; id?: string }>(c, caminho, 'POST', dados)
    const messageId = r.messageId ?? r.id
    if (!messageId) throw new FalhaIntegrador('a Z-API não devolveu o id da mensagem')
    return { messageId }
  },

  async baixarMidia(_c, ref) {
    if (!('url' in ref)) throw new FalhaIntegrador('a Z-API entrega a mídia só pelo link do aviso')
    const r = await chamarIntegrador(ref.url, {}, 'url')
    return { buffer: Buffer.from(await r.arrayBuffer()), mimetype: r.headers.get('content-type') || 'application/octet-stream' }
  },

  interpretar(corpo) {
    const b = corpo as any
    if (!b || typeof b !== 'object') return []
    switch (b.type) {
      case 'ReceivedCallback':
        return mensagem(b)
      case 'MessageStatusCallback': {
        const status = ENTREGA[String(b.status)]
        const ids = Array.isArray(b.ids) ? b.ids.map(String) : []
        return status && ids.length ? [{ tipo: 'entrega', messageIds: ids, status }] : []
      }
      case 'ConnectedCallback':
        return [{ tipo: 'conexao', status: 'CONNECTED', motivo: null, phoneNumber: digitos(b.phone) || null }]
      case 'DisconnectedCallback':
        return [{ tipo: 'conexao', status: 'DISCONNECTED', motivo: 'o integrador avisou que o aparelho desconectou', phoneNumber: null }]
      default:
        return []
    }
  },
}
