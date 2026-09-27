/**
 * POST /api/whatsapp/send-media
 *
 * A file from the inbox through the customer's integrator (spec 012): multipart/form-data with file, connectionId,
 * contactId, [caption], [ptt], [duration]. The file goes to the integrator in base64, so it needs no public address,
 * and a copy goes to our storage so the conversation shows it later (research R10).
 */

import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { uploadMedia } from '@/lib/storage'
import { convertWebmToOgg } from '@/lib/whatsapp/audio'
import { adaptador } from '@/lib/whatsapp/integradores'
import { enviarPeloIntegrador, prepararEnvio } from '@/lib/whatsapp/integradores/envio'
import type { TipoMidia } from '@/lib/whatsapp/integradores/tipos'

const MB = 1024 * 1024

/** Office files, PDF, text and archives; never an executable */
const DOCUMENTO =
  /^(application\/(pdf|msword|rtf|zip|x-zip-compressed|vnd\.ms-(excel|powerpoint)|vnd\.openxmlformats-officedocument\.[\w.]+|vnd\.oasis\.opendocument\.[\w.]+)|text\/(plain|csv))$/

/** WhatsApp's limits (research R10) */
function classificar(mime: string): { tipo: TipoMidia; limite: number } | null {
  if (mime === 'image/jpeg' || mime === 'image/png') return { tipo: 'image', limite: 5 * MB }
  if (mime === 'video/mp4' || mime === 'video/3gpp') return { tipo: 'video', limite: 16 * MB }
  if (/^audio\/(ogg|mpeg|mp4|aac|amr|webm)$/.test(mime)) return { tipo: 'audio', limite: 16 * MB }
  if (DOCUMENTO.test(mime)) return { tipo: 'document', limite: 100 * MB }
  return null
}

const ROTULO: Record<TipoMidia, string> = { image: 'imagem', video: 'vídeo', audio: 'áudio', document: 'documento' }

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const arquivo = form?.get('file')
  if (!form || !(arquivo instanceof File)) return NextResponse.json({ error: 'Escolha o arquivo.' }, { status: 400 })

  const p = await prepararEnvio(form.get('contactId') as string | null, form.get('connectionId') as string | null)
  if (p instanceof Response) return p

  // 5. Size and type before anything goes out
  const mimeOriginal = (arquivo.type || 'application/octet-stream').split(';')[0].trim()
  const classe = classificar(mimeOriginal)
  if (!classe) {
    return NextResponse.json(
      { error: 'Este tipo de arquivo não vai pelo WhatsApp. Envie imagem JPG ou PNG, vídeo MP4, áudio ou documento (PDF, planilha, texto).' },
      { status: 415 },
    )
  }
  if (arquivo.size > classe.limite) {
    return NextResponse.json({ error: `Arquivo grande demais: ${ROTULO[classe.tipo]} vai até ${classe.limite / MB} MB no WhatsApp.` }, { status: 413 })
  }

  const legenda = ((form.get('caption') as string | null) || '').trim() || undefined
  const ptt = form.get('ptt') === 'true'
  const duracao = parseInt((form.get('duration') as string | null) || '0', 10)
  let buffer: Buffer = Buffer.from(await arquivo.arrayBuffer())
  let mimetype = mimeOriginal
  let nomeArquivo = arquivo.name || 'arquivo'

  try {
    // what the browser records; WhatsApp plays voice notes as OGG/Opus
    if (mimetype === 'audio/webm') {
      buffer = await convertWebmToOgg(buffer)
      mimetype = 'audio/ogg'
      nomeArquivo = 'audio.ogg'
    }

    // the copy lives under the account's key, like every other media (research R10)
    const mediaUrl = await uploadMedia({
      orgId: p.acesso.organizationId,
      contactId: p.contato.id,
      messageId: randomUUID(),
      buffer,
      mimetype,
      fileName: nomeArquivo,
    }).catch((erro) => {
      logger.warn({ organizationId: p.acesso.organizationId, erro: String(erro) }, 'WhatsApp outbound media copy not stored')
      return null
    })

    const texto =
      classe.tipo === 'audio'
        ? duracao > 0 ? `[Áudio ${Math.floor(duracao / 60)}:${String(duracao % 60).padStart(2, '0')}]` : '[Áudio]'
        : classe.tipo === 'image'
          ? legenda ? `[Imagem] ${legenda}` : '[Imagem]'
          : classe.tipo === 'video'
            ? legenda ? `[Vídeo] ${legenda}` : '[Vídeo]'
            : legenda ? `[Documento] ${nomeArquivo} ${legenda}` : `[Documento] ${nomeArquivo}`

    return await enviarPeloIntegrador(p, { text: texto, mediaType: classe.tipo, mediaUrl }, () =>
      adaptador(p.credenciais.provider).enviarMidia(p.credenciais, p.numero, {
        tipo: classe.tipo, buffer, mimetype, nomeArquivo, legenda, ptt,
      }),
    )
  } catch (erro) {
    logger.error({ organizationId: p.acesso.organizationId, connectionId: p.conexao.id, erro: String(erro) }, 'Error sending WhatsApp integrator media')
    return NextResponse.json({ error: 'Não foi possível enviar o arquivo agora. Tente de novo.' }, { status: 500 })
  }
}
