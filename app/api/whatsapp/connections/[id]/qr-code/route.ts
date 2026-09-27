/**
 * GET /api/whatsapp/connections/[id]/qr-code
 *
 * The QR Code of an integrator connection, read live (spec 012). The screen asks every 3 s while open, because the
 * integrators renew the QR about every 20 s; the same call switches the screen to "Conectado" once paired (FR-007).
 * Also reconnects a FAILED or DISCONNECTED connection that still holds credentials.
 */

import { NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { autorizarConfiguracao } from '@/lib/visibilidade'
import { adaptador } from '@/lib/whatsapp/integradores'
import { carregarConexao, contaTemPlanoPago, numeroJaConectado, respostaDoErro } from '@/lib/whatsapp/integradores/conexao'
import { mudarEstado } from '@/lib/whatsapp/integradores/estado'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const acesso = await autorizarConfiguracao()
  if (acesso instanceof Response) return acesso
  const { organizationId } = acesso

  const carregada = await carregarConexao(organizationId, id)
  if (!carregada || !carregada.linha.provider) return NextResponse.json({ error: 'Conexão não encontrada.' }, { status: 404 })
  const { linha, credenciais } = carregada
  if (!credenciais) {
    return NextResponse.json({ error: 'Esta conexão foi desconectada. Conecte de novo com as credenciais do integrador.' }, { status: 409 })
  }
  if (!(await contaTemPlanoPago(organizationId))) {
    return NextResponse.json({ error: 'WhatsApp por integrador está nos planos pagos, a partir do Starter.' }, { status: 403 })
  }

  try {
    const integrador = adaptador(credenciais.provider)
    const r = await integrador.qrCode(credenciais)

    if ('conectado' in r) {
      const proibido = await numeroJaConectado(organizationId, r.phoneNumber, linha.id)
      if (proibido) {
        await mudarEstado(linha, 'FAILED', proibido, { dados: { phoneNumber: r.phoneNumber } })
        await integrador.desligarAviso(credenciais).catch((erro) => logger.warn({ connectionId: id, erro: String(erro) }, 'integrator notice not turned off'))
        return NextResponse.json({ status: 'FAILED', statusMotivo: proibido })
      }
      await mudarEstado(linha, 'CONNECTED', null, { dados: { phoneNumber: r.phoneNumber } })
      return NextResponse.json({ status: 'CONNECTED', phoneNumber: r.phoneNumber })
    }

    if (linha.status === 'FAILED' || linha.status === 'DISCONNECTED') {
      await mudarEstado(linha, 'CONNECTING', 'aguardando a leitura do QR Code')
    }
    return NextResponse.json({ status: 'CONNECTING', qrCode: r.qrCode })
  } catch (erro) {
    try {
      return respostaDoErro(erro)
    } catch {
      logger.error({ organizationId, connectionId: id, erro: String(erro) }, 'Error reading integrator QR Code')
      return NextResponse.json({ error: 'Não foi possível buscar o QR Code agora. Tente de novo.' }, { status: 500 })
    }
  }
}
