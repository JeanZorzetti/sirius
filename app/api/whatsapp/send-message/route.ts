/**
 * POST /api/whatsapp/send-message
 *
 * A text reply from the inbox through the customer's integrator (spec 012). The official API stays in send-waba.
 * Only a person typing in the inbox sends through an integrator (terms 6.5); the locks run in prepararEnvio.
 */

import { NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { adaptador } from '@/lib/whatsapp/integradores'
import { enviarPeloIntegrador, mensagemRespondida, prepararEnvio } from '@/lib/whatsapp/integradores/envio'

export async function POST(req: Request) {
  const corpo = await req.json().catch(() => ({}))
  const texto = typeof corpo.message === 'string' ? corpo.message.trim() : ''
  if (!texto) return NextResponse.json({ error: 'Escreva a mensagem.' }, { status: 400 })

  const p = await prepararEnvio(corpo.contactId ?? null, corpo.connectionId ?? null)
  if (p instanceof Response) return p

  try {
    const replyTo = await mensagemRespondida(p.acesso.organizationId, corpo.replyToId)
    return await enviarPeloIntegrador(p, { text: texto, replyTo }, () =>
      adaptador(p.credenciais.provider).enviarTexto(p.credenciais, p.numero, texto),
    )
  } catch (erro) {
    logger.error({ organizationId: p.acesso.organizationId, connectionId: p.conexao.id, erro: String(erro) }, 'Error sending WhatsApp integrator message')
    return NextResponse.json({ error: 'Não foi possível enviar agora. Tente de novo.' }, { status: 500 })
  }
}
