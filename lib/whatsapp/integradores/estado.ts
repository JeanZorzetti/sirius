import type { Prisma, WhatsAppConnection, WhatsAppStatus } from '.prisma/client-wa'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { createNotifications } from '@/lib/notifications'
import logger from '@/lib/logger'
import { NOME_INTEGRADOR } from './tipos'

export type ConexaoEstado = Pick<WhatsAppConnection, 'id' | 'organizationId' | 'status' | 'statusMudouEm' | 'connectedAt' | 'provider'>

const hora = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

function tempoFora(desde: Date, agora: Date): string {
  const min = Math.max(1, Math.round((agora.getTime() - desde.getTime()) / 60_000))
  return min < 90 ? `${min} min` : `${Math.round(min / 60)} h`
}

/**
 * The only way a connection changes state (research R8). The update is conditioned on the state the caller read, so
 * when the integrator notice and the cron see the same drop, only one of them changes the row and notifies (FR-026).
 * Returns whether it changed the row.
 *
 * - A drop from CONNECTED to DISCONNECTED or FAILED, and any SUSPENDED, notifies the owner and the managers once.
 *   A drop that only gets worse (DISCONNECTED to FAILED) was already told. `notificar: false` when the owner did it.
 * - Waiting for the QR after a drop keeps the time it dropped, so the return reads "voltou depois de N min fora".
 */
export async function mudarEstado(
  conexao: ConexaoEstado,
  novo: WhatsAppStatus,
  motivo: string | null,
  opcoes: { dados?: Prisma.WhatsAppConnectionUpdateManyMutationInput; notificar?: boolean } = {},
): Promise<boolean> {
  const anterior = conexao.status
  if (novo === anterior) return false
  const agora = new Date()
  const caiuAntes = anterior === 'DISCONNECTED' || anterior === 'FAILED' || anterior === 'SUSPENDED'

  // US3-4: back after a drop (connectedAt says it was up before; a first pairing has no "fora")
  let motivoFinal = motivo
  if (novo === 'CONNECTED' && !motivo && conexao.connectedAt && conexao.statusMudouEm && (caiuAntes || anterior === 'CONNECTING')) {
    motivoFinal = `voltou depois de ${tempoFora(conexao.statusMudouEm, agora)} fora`
  }
  const manterHoraDaQueda = novo === 'CONNECTING' && (anterior === 'DISCONNECTED' || anterior === 'FAILED')

  const { count } = await prismaWa.whatsAppConnection.updateMany({
    where: { id: conexao.id, organizationId: conexao.organizationId, status: anterior },
    data: {
      ...opcoes.dados,
      status: novo,
      statusMotivo: motivoFinal,
      ...(manterHoraDaQueda ? {} : { statusMudouEm: agora }),
      ...(novo === 'CONNECTED' && !conexao.connectedAt ? { connectedAt: agora } : {}),
    },
  })
  if (count !== 1) return false

  const avisar = novo === 'SUSPENDED' || ((novo === 'DISCONNECTED' || novo === 'FAILED') && anterior === 'CONNECTED')
  if (avisar && opcoes.notificar !== false) await notificarQueda(conexao, novo, motivoFinal, agora)
  return true
}

/** One notification per drop to the owner and the managers, with the way back (terms 6.4, research R8) */
async function notificarQueda(conexao: ConexaoEstado, novo: WhatsAppStatus, motivo: string | null, quando: Date) {
  try {
    const integrador = conexao.provider ? NOME_INTEGRADOR[conexao.provider] : 'integrador'
    const gestores = await prisma.user.findMany({
      where: { organizationId: conexao.organizationId, orgRole: { in: ['OWNER', 'GERENTE'] } },
      select: { id: true },
    })
    if (gestores.length === 0) return
    const suspensa = novo === 'SUSPENDED'
    const title = suspensa ? `WhatsApp (${integrador}) suspenso` : `WhatsApp (${integrador}) desconectado`
    const message = suspensa
      ? `WhatsApp (${integrador}) suspenso desde ${hora(quando)}: o plano da conta não inclui WhatsApp. Assine um plano pago para reativar.`
      : `WhatsApp (${integrador}) desconectado desde ${hora(quando)}${motivo ? ` (${motivo})` : ''} — reconectar`
    await createNotifications(
      gestores.map((g) => ({
        userId: g.id,
        organizationId: conexao.organizationId,
        type: 'SYSTEM' as const,
        title,
        message,
        actionUrl: '/dashboard/chat',
        metadata: { connectionId: conexao.id, status: novo },
      })),
    )
  } catch (erro) {
    // the state change stands; the inbox banner still shows the drop
    logger.error({ connectionId: conexao.id, erro: String(erro) }, 'WhatsApp drop notification failed')
  }
}
